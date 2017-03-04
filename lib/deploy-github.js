'use strict';


/**
 * Modules
 * Node
 * @global
 * @constant
 */
const path = require('path');
const util = require('util');

/**
 * Modules
 * External
 * @global
 * @constant
 */
const glob = require('glob');
const _ = require('lodash');
const appRootPath = require('app-root-path').path;
const publishRelease = require('publish-release');
const ProgressBar = require('progress');
const minimist = require('minimist');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))();


/**
 * Execution environment
 * @global
 */
let isCI = process.env['CI'] || process.env['CONTINUOUS_INTEGRATION'] || process.env['APPVEYOR'] || process.env['TRAVIS'];
if (isCI) {
    logger.log('Environment', 'Continuous Integration detected.');
}

/**
 * GitHub Release
 * @global
 * @default
 * @const
 */
const defaultBranch = 'master';
const defaultNotes =
    `## 🍾 Features
- Adds feature (#1)

## 🚨 Bugfixes
- Fixes issue (#2)

## 📒 Documentation
- Augments document

## 👷 Internals
- Upgrades module`;

/**
 * Environment
 * @global
 * @const
 */
const envDirectory = process.env['ARTIFACTS_DIRECTORY'] || path.join(appRootPath, packageJson.build.directories.output);
const envBranch = process.env['TARGET_BRANCH'] || process.env['TRAVIS_BRANCH'] || process.env['APPVEYOR_REPO_BRANCH'];
const envToken = process.env['GITHUB_TOKEN'];


/**
 * Create list of absolute paths of build artifacts
 * @param {String=} directory - Directory containing assets
 * @returns {Array|undefined} List of absolute paths to files to be published
 *
 * @private
 */
let getArtifacts = function(directory) {
    logger.debug('deploy', 'getArtifactsList()');

    const artifactsDirectory = directory || envDirectory;

    if (!_.isString(artifactsDirectory)) {
        logger.error('deploy', 'getArtifacts()', 'artifactsDirectory', 'missing');
        return;
    }

    let installerFilePathPattern = path.join(path.resolve(artifactsDirectory), '**', '*.{AppImage,deb,dmg,exe,json,pacman,rpm,zip}');
    let installerIgnorePatternList = [
        path.join(path.resolve(artifactsDirectory), 'mac', '*.app', '**', '*'),
        path.join(path.resolve(artifactsDirectory), '*-unpacked', '**', '*'),
    ];

    const artifactsList = glob.sync(installerFilePathPattern, { ignore: installerIgnorePatternList }) || [];

    // DEBUG
    logger.debug('deploy', 'getArtifactsList', 'installerFilePathList', artifactsList);

    return artifactsList;
};

/**
 * Create Release Configuration
 * @param {Array} artifacts - List of Artifacts
 * @param {String=} branch - Release Branch
 * @param {String=} token - GitHub Token
 * @param {String=} notes - Release Notes
 * @returns {Object|void} - Configuration Object
 *
 * @private
 */
let getConfiguration = function(artifacts, branch, token, notes) {
    logger.debug('deploy', 'createConfiguration()');

    const artifactList = artifacts || [];
    const releaseBranch = branch || envBranch || defaultBranch;
    const githubToken = token || envToken;
    const releaseNotes = notes || defaultNotes;

    if (artifactList.length === 0) {
        logger.error('deploy', 'createConfiguration()', 'artifactList', 'empty');
        return;
    }

    if (!_.isString(releaseBranch)) {
        logger.error('deploy', 'createConfiguration()', 'releaseBranch', 'missing');
        return;
    }

    if (!_.isString(githubToken)) {
        logger.error('deploy', 'createConfiguration()', 'githubToken', 'missing');
        return;
    }

    if (!_.isString(releaseNotes)) {
        logger.error('deploy', 'createConfiguration()', 'releaseNotes', 'missing');
        return;
    }

    if (!_.isObjectLike(packageJson)) {
        logger.error('deploy', 'createConfiguration()', 'package', 'missing');
        return;
    }

    let releaseConfiguration = {
        assets: artifactList,
        draft: true,
        name: `${packageJson.productName} v${packageJson.version}`,
        notes: releaseNotes,
        owner: packageJson.author.name,
        prerelease: false,
        repo: packageJson.name,
        reuseDraftOnly: false,
        reuseRelease: true,
        tag: `v${packageJson.version}`,
        target_commitish: releaseBranch,
        token: githubToken
    };

    // DEBUG
    //logger.debug('deploy', 'createConfiguration()', 'artifactList', util.inspect(artifactList));
    //logger.debug('deploy', 'createConfiguration()', 'releaseBranch', releaseBranch);
    //logger.debug('deploy', 'createConfiguration()', 'githubToken', githubToken);
    //logger.debug('deploy', 'createConfiguration()', 'releaseNotes', releaseNotes);
    logger.debug('deploy', 'createConfiguration()', util.inspect(releaseConfiguration));

    return releaseConfiguration;
};

/**
 * Add upload progress event handler
 * @param {PublishRelease} publishReleaseObject - PublishRelease object
 * @returns {Boolean|void} - Result of add event handlers
 *
 * @private
 */
let addProgressHandlers = (publishReleaseObject) => {
    logger.debug('deploy', 'addProgressHandlers()');

    if (!publishReleaseObject || !_.isObject(publishReleaseObject)) {
        logger.error('deploy', 'addProgressHandlers', 'release missing or wrong format.');
        return;
    }

    let bar = {};
    let uploaded = {};

    // Upload started
    publishReleaseObject.on('upload-asset', function(fileName) {
        logger.log('deploy', 'Release', `upload started: ${fileName}`);
    });

    // Release created
    publishReleaseObject.on('created-release', function() {
        logger.log('deploy', 'Release', 'created');
    });

    // Release reused
    publishReleaseObject.on('reuse-release', function() {
        logger.log('deploy', 'Release', 're-using');
    });

    // Upload complete
    publishReleaseObject.on('uploaded-asset', function(fileName) {
        // Complete Progressbar
        if (bar[fileName]) {
            bar[fileName].update(1);
        }

        logger.log('deploy', 'Release', `upload complete: ${fileName}`);
    });

    // Upload progress update
    publishReleaseObject.on('upload-progress', function(fileName, event) {
        if (!uploaded[fileName]) { uploaded[fileName] = { size: 0, percentage: 0 }; }

        let currentPercentage = uploaded[fileName].percentage;

        uploaded[fileName].size += event.delta;
        uploaded[fileName].percentage = parseInt((uploaded[fileName].size / event.length) * 100);

        // Continuous Environment
        if (isCI) {
            if (currentPercentage !== uploaded[fileName].percentage) {
                logger.log('deploy', 'Release', `uploading: ${fileName} (${uploaded[fileName].percentage} %)`);
            }
            return;
        }

        // Interactive Environment
        if (!bar[fileName]) {
            bar[fileName] = new ProgressBar(`'Release uploading: ${fileName} [:bar] :percent (ETA: :etas)`, {
                complete: 'x',
                incomplete: ' ',
                width: 30,
                total: event.length,
                clear: true
            });
            return;
        }

        if (!bar[fileName].complete) {
            bar[fileName].tick(event.delta);
        }
    });
};

/**
 * Deploys all Release artifacts
 * @param {String=} directory - Directory containing build artifacts
 * @param {String=} branch - Target Branch
 * @param {String=} token - Github Token
 * @param {Function=} callback - Callback
 *
 * @private
 */
let deployRelease = function(directory, branch, token, callback) {
    logger.debug('deploy', 'deployRelease()');

    let cb = callback || function() {};

    // Create list of artifacts
    let artifactsList = getArtifacts(directory);
    if (artifactsList.length === 0) {
        cb(new Error('artifactsList empty.'));
        return;
    }

    // Create Configuration
    let releaseConfiguration = getConfiguration(artifactsList, branch, token);
    if (!releaseConfiguration) {
        cb(new Error('releaseConfiguration missing.'));
        return;
    }

    // Call publish-release module
    let publishReleaseHandler = publishRelease(releaseConfiguration, function(err, result) {
        if (err) {
            cb(err);
            return;
        }

        cb(null, result);
    });

    // Add progress handlers
    addProgressHandlers(publishReleaseHandler);
};

/**
 * Main
 *
 * @public
 */
let main = () => {
    logger.debug('deploy', 'main()');

    const argv = minimist(process.argv.slice(2));
    argv.directory = argv._[0];
    argv.branch = argv._[1];
    argv.token = argv._[2];

    deployRelease(argv.directory, argv.branch, argv.token, function(err, result) {
        if (err) {
            logger.error('deploy', err);
            return process.exit(1);
        }

        logger.log('deploy', 'GitHub Release complete');

        // DEBUG
        logger.debug('deploy', result);

        process.exit(0);
    });

    // DEBUG
    logger.debug('deploy', 'argv', argv);
};


/**
 * Main
 */
if (require.main === module) {
    logger.debug('deploy');

    main();
}


/**
 * @exports
 */
module.exports = {
    createArtifactsList: getArtifacts,
    createConfiguration: getConfiguration,
    release: deployRelease
};
