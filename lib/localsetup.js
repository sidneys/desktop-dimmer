#!/usr/bin/env node
'use strict';


/**
 * Modules
 * Node
 * @global
 * @constant
 */
const childProcess = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

/**
 * Modules
 * External
 * @global
 * @constant
 */
const appRootPath = require('app-root-path').path;
const fkill = require('fkill');
const glob = require('glob');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))();


/**
 * Developer Mode
 * @global
 */
let devMode = (process.env.NODE_ENV === 'debug');

/**
 *  @global
 */
let directoryBuild = path.join(appRootPath, packageJson.build.directoryBuild),
    directoryRelease = path.join(directoryBuild, 'release'),
    directoryStaging = path.join(directoryBuild, 'staging');

/**
 * App
 * @global
 */
let appProductName = packageJson.productName || packageJson.name,
    appName = packageJson.name,
    appVersion = packageJson.version;

/**
 * Get Name of active NPM Script
 *  @global
 */
let npmScript = process.env['npm_lifecycle_event'];

/**
 * Build
 */
let build = function() {
    logger.log('Building', appProductName);
    childProcess.execSync('npm run build ' + os.platform(), { stdio: [0, 1, 2] });
};


/**
 * Quit locally running application processes, then install and launch
 */
let installApplication = function() {

    if (devMode) {
        process.env.DEBUG = devMode;
    }

    /**
     *  macOs
     */
    if (platformHelper.isMacOS) {

        let applicationFileName = appProductName + '.app',
            installerArch = '',
            sourceFilePathPattern = path.normalize(path.join(directoryStaging, '*' + 'darwin' + '*' + installerArch, '*' + '.app')),
            sourceFilePathList = glob.sync(sourceFilePathPattern),
            destinationFilePath = path.join('/Applications', applicationFileName);

        // DEBUG
        logger.debug('platformHelper', 'isMacOS', 'sourceFilePathPattern', sourceFilePathPattern);
        logger.debug('platformHelper', 'isMacOS', 'sourceFilePathList', sourceFilePathList);

        logger.log('Closing', applicationFileName);
        fkill(appProductName, { force: true });

        logger.log('Removing', destinationFilePath);
        fs.removeSync(destinationFilePath);

        logger.log('Installing', destinationFilePath);
        fs.copySync(sourceFilePathList[0], destinationFilePath, { clobber: true, preserveTimestamps: true });

        logger.log('Starting', destinationFilePath);
        childProcess.execSync('open  ' + '"' + destinationFilePath + '"');
    }

    /**
     *  Windows
     */
    if (platformHelper.isWindows) {
        let applicationFileName = appName + '.exe',
            installerArch = os.arch(),
            installerFilePathPattern = path.join(directoryRelease, '*' + appVersion + '*' + 'win' + '*' + installerArch + '*' + '.exe'),
            installerFilePathList = glob.sync(installerFilePathPattern),
            installerFilePath = installerFilePathList[0];

        // DEBUG
        logger.debug('platformHelper', 'isWindows', 'installerFilePathPattern', installerFilePathPattern);
        logger.debug('platformHelper', 'isWindows', 'installerFilePathList', installerFilePathList);
        logger.debug('platformHelper', 'isWindows', 'installerFilePath', installerFilePath);

        logger.log('Closing', applicationFileName);
        fkill(appProductName, { force: true });

        logger.log('Installing', installerFilePath);
        logger.log('Starting', applicationFileName);
        childProcess.execSync('start "" ' + '"' + installerFilePath + '"', { stdio: [0, 1, 2] });
    }

    /**
     *  Linux
     */
    if (platformHelper.isLinux) {
        let installerArch;

        switch (os.arch()) {
            case 'arm7l':
                installerArch = 'arm';
                break;
            case 'x64':
                installerArch = 'amd64';
                break;
            case 'ia32':
                installerArch = 'i386';
                break;
        }

        let applicationFileName = appName,
            installerFilePathPattern = path.normalize(path.join(directoryRelease, '*' + appVersion + '*' + 'linux' + '*' + installerArch + '*' + '.deb')),
            installerFilePathList = glob.sync(installerFilePathPattern),
            installerFilePath = installerFilePathList[0],
            destinationFilePath = path.join('/usr/bin', applicationFileName);

        // DEBUG
        logger.debug('platformHelper', 'isLinux', 'installerFilePathPattern', installerFilePathPattern);
        logger.debug('platformHelper', 'isLinux', 'installerFilePathList', installerFilePathList);
        logger.debug('platformHelper', 'isLinux', 'destinationFilePath', destinationFilePath);

        logger.log('Closing', applicationFileName);
        fkill(applicationFileName, { force: true });

        logger.log('Installing', installerFilePath);
        childProcess.execSync('sudo dpkg --install --force-overwrite ' + installerFilePath);

        logger.log('Starting', destinationFilePath);
        let child = childProcess.spawn(destinationFilePath, [], { detached: true, stdio: 'ignore' });
        child.unref();
    }
};


/**
 * Main
 */
if (require.main === module) {

    if (npmScript && npmScript.includes('dev')) {
       process.env.NODE_ENV = 'dev';
    }

    if (npmScript && npmScript.includes('rebuild')) {
        build();
    }

    installApplication(devMode);

    process.exit(0);
}
