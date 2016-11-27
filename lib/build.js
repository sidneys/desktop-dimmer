'use strict';


/**
 * Modules
 * Node
 * @global
 * @constant
 */
const childProcess = require('child_process');
const path = require('path');

/**
 * Modules
 * External
 * @global
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path').path;
const fs = require('fs-extra');
const glob = require('glob');
const nodeArchs = require('node-archs');
const nodePlatforms = require('node-platforms');
const rimraf = require('rimraf');
const tryRequire = require('try-require');
const which = require('which');
const electronPackager = require('electron-packager');

const darwinInstaller = tryRequire('appdmg');
const windowsInstaller = tryRequire('electron-winstaller');
const linuxInstaller = tryRequire('electron-installer-debian');

/**
 * Modules
 * Internal
 * @global
 */
const packageJson = require(path.join(appRootPath, 'package.json'));
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))();


/**
 * Developer Mode
 * @global
 */
let isDebug = process.env.DEBUG;

/**
 * @global
 */
let directoryBuild = path.join(appRootPath, packageJson.build.directoryBuild),
    directoryCache = path.join(directoryBuild, 'cache'),
    directoryRelease = path.join(directoryBuild, 'release'),
    directoryStaging = path.join(directoryBuild, 'staging'),
    directoryAssets = path.join(appRootPath, packageJson.build.directoryIcons);

/**
 * Ignored files
 * @global
 */
let fileIgnoreList = [
    '.appveyor.yml',
    '.editorconfig',
    '.DS_Store',
    '.gitignore',
    '.idea',
    '.jscsrc',
    '.jshintrc',
    '.npmignore',
    '.travis.yml',
    '.vscode',
    path.relative(appRootPath, directoryCache),
    path.relative(appRootPath, directoryStaging),
    path.relative(appRootPath, directoryRelease)
];


/**
 * Get platform-dependent installer creation modules
 * @param {String} platform - Target platform
 * @param {String} target - Installer target file
 * @return {Object|void}
 */
let getInstaller = function(platform, target) {

    let extension = path.extname(target).split('.')[1],
        map;

    // Hashmap
    map = {
        darwin: {
            dmg: darwinInstaller
        },
        win32: {
            exe: windowsInstaller.createWindowsInstaller
        },
        linux: {
            deb: linuxInstaller
        }
    };

    return map[platform][extension];
};

/**
 * Create electron-packager Configuration
 */
let createInstallerOptions = function(platform) {

    let pkg = _.clone(packageJson),
        options = pkg.build;

    let buildVersion = _(new Date().toJSON()).replace(/T|Z|-|:|\./g, ''),
        icon = path.join(directoryAssets, platform, 'icon-app' + platformHelper.iconImageExtension(platform));

    // Installation icon
    let setupIcon = path.join(directoryAssets, platform, 'icon-setup' + platformHelper.iconImageExtension(platform));

    // Setup icon
    let setupBackground = path.join(directoryAssets, platform, 'background-setup' + '.gif');

    // Ignore assets for other platforms
    let ignore = fileIgnoreList;
    for (let p of [...nodePlatforms()]) {
        if (platform !== p) {
            ignore.push(path.relative(appRootPath, path.join(directoryAssets, p)));
        }
    }
    for (let i in ignore) {
        // Regexify ignore list entries
        ignore[i] = '/' + ignore[i] + '($|/)';
        ignore[i] = ignore[i].replace(/\\/g, '\/');
        ignore[i] = ignore[i].replace(/\./g, '\\.');
    }

    // name of binary
    let name;
    if (platformHelper.isDarwin) {
        // "Product Name.app"
        name = options.productName;
    } else {
        // "product-name.exe"
        name = pkg.name;
    }

    // productName
    let productName = options.productName;
    if (platformHelper.isWindows) {
        productName = name;
    }

    return {
        'app-bundle-id': options.id,
        'app-category-type': options.category,
        'app-company': options.company,
        'app-copyright': 'Copyright © ' + new Date().getFullYear(),
        'app-version': pkg.version,
        'arch': 'all',
        'asar': false,
        'build-version': buildVersion,
        'dir': appRootPath,
        'helper-bundle-id': options.id + '.helper',
        'icon': icon,
        'iconUrl': options.iconUrl,
        'ignore': ignore,
        'name': name,
        'out': directoryStaging,
        'overwrite': true,
        'platform': platform,
        'productName': productName,
        'prune': true,
        'setupIcon': setupIcon,
        'setupBackground': setupBackground,
        'version': options.electronVersion,
        'win32metadata': {
            CompanyName: options.company,
            OriginalFilename: name,
            FileVersion: pkg.version,
            ProductVersion: pkg.version,
            ProductName: options.productName,
            InternalName: options.productName
        },
        'download': {
            'strictSSL': false
        }
    };
};

/**
 * Commandline platform override (default: build all platforms)
 * @example > npm run build darwin
 * @example > npm run build win32
 */
let createPlatformListCli = function() {
    let list = process.argv.slice(3) || [];

    // Convenience replacer for operating system names
    for (let p in list) {
        list[p] = list[p].replace(/\b(apple|mac|macos|macosx|macintosh|osx)\b/i, 'darwin');
        list[p] = list[p].replace(/\b(win|win10|windows|windows10)\b/i, 'win32');
        list[p] = list[p].replace(/\b(debian|gnu|ubuntu)\b/i, 'linux');
    }

    return _.uniq(list);
};

/**
 * Test if string contains a CPU architecture
 * @return {String} Found architecture
 */
let parseArchitecture = function(search) {
    let match = search.match(new RegExp(nodeArchs.join('|')))[0];

    // DEBUG
    logger.debug('parseArchitecture', 'search', search, 'match', match);

    return match;
};

/**
 * Strip wildcards from package names, convert to lowercase add version info
 * @param {String} filePath - Path to package
 * @param {String=} platform - Platform
 * @param {String=} version - File version
 * @param {String=} architecture - Target architecture
 * @param {Boolean=} retainDirectory - Retain full path to file
 * @param {Boolean=} removeExtension - Remove extension
 * @return {String}
 */
let getInstallerFileName = function(filePath, platform, version, architecture, retainDirectory, removeExtension) {
    let fileName = _.toLower(path.basename(filePath)),
        extension = path.extname(filePath);

    if (fileName) {
        // Remove extension
        fileName = fileName.replace(/\.[^/.]+$/, '');
        // Whitespace to underscore
        fileName = fileName.replace(/\s+/g, '-');
    }

    // Add version
    if (version) {
        fileName = fileName + '-' + 'v' + version;
    }

    // Add platform
    if (platform) {
        fileName = fileName + '-' + platform;
    }

    // Add architecture
    if (architecture) {
        fileName = fileName + '-' + architecture;
    }

    // Add extension
    if (!removeExtension) {
        fileName = fileName + extension;
    }

    // Add Path
    if (path.dirname(filePath) && retainDirectory) {
        fileName = path.join(path.dirname(filePath), fileName);
    }

    // DEBUG
    logger.debug('getSafePackageFileName', 'fileName', fileName);

    return fileName;
};

/**
 * Create folders
 * @param {...*} arguments - Filesystem paths
 */
let createDirectorySync = function() {
    let args = Array.from(arguments);
    for (let directoryPath of args) {
        let target = path.resolve(directoryPath);

        fs.mkdirpSync(target);

        // DEBUG
        logger.debug('createDirectorySync', target);
    }
};

/**
 * Zip Directory using Native CLI tools
 * @param {String} directoryPath - Source directory
 * @param {String} zipPath - Zip file target path
 * @param {Function=} callback - Completion callback
 */
let nativeZipDirectory = function(directoryPath, zipPath, callback) {

    let cb = callback || function() {},
        nativeBinary = which.sync('zip'),
        sourceDirectory = path.normalize(path.resolve(directoryPath));

    fs.lstat(nativeBinary, (err) => {
        if (err) {
            logger.error('nativeZipDirectory', 'fs.lstat', nativeBinary, err);
            return cb(err);
        }

        // DEBUG
        logger.debug('nativeZipDirectory', 'nativeBinary', nativeBinary);

        fs.lstat(sourceDirectory, (err, stats) => {
            if (err) {
                logger.error('nativeZipDirectory', 'fs.lstat', sourceDirectory, err);
                return cb(err);
            }
            if (!stats.isDirectory()) {
                logger.error('nativeZipDirectory', sourceDirectory);
                return cb(err);
            }

            // DEBUG
            logger.debug('nativeZipDirectory', 'sourceDirectory', sourceDirectory);

            childProcess.execFile(nativeBinary,
                ['--recurse-paths', '--paths', '--quiet', '--test', '--symlinks', '-9', zipPath, directoryPath],
                (err, stdout, stderr) => {
                    if (err) {
                        logger.error('childProcess.execFile', 'zip', err);
                        return cb(err);
                    }

                    if (stdout) {
                        logger.log('childProcess.execFile', 'zip', 'stdout', stdout);
                    }

                    if (stderr) {
                        logger.log('childProcess.execFile', 'zip', 'stdout', stderr);
                    }

                    cb(null, zipPath);
                });
        });
    });
};

/**
 * Delete directory
 * @param {String} directoryPath - Path
 * @param {Boolean=} contentsOnly - Keep directory intact
 * @param {Function=} callback - Completion callback
 */
let deleteDirectory = function(directoryPath, contentsOnly, callback) {

    let cb = callback || function() {};

    let target = path.normalize(path.resolve(directoryPath));

    if (contentsOnly) {
        target = path.join(target, '**', '*');
    }

    rimraf(target, {}, function(err) {
        if (err) {
            logger.error('deleteDirectory', target, err);
            return cb(err);
        }

        cb(null);

        // DEBUG
        logger.debug('deleteDirectory', target);
    });
};

/**
 * Delete directory synchronously
 * @param {String} directoryPath - Path
 * @param {Boolean=} contentsOnly - Keep directory intact
 */
let deleteDirectorySync = function(directoryPath, contentsOnly) {

    let target = path.normalize(path.resolve(directoryPath));

    if (contentsOnly) {
        target = path.join(target, '**', '*');
    }

    rimraf.sync(target);

    // DEBUG
    logger.debug('deleteDirectorySync', target);
};

/**
 * Define build target platforms
 * @returns {Array} - List of platforms to build for
 */
let createPlatformList = function() {

    let platformList = [];

    // If specified, use platform from commandline
    if (createPlatformListCli().length > 0) {
        platformList = createPlatformListCli();
    }

    // Default platforms
    if (platformList.length === 0) {
        // macOS
        if (platformHelper.isDarwin) {
            platformList = ['darwin', 'linux'];
        }
        // Windows
        if (platformHelper.isWindows) {
            platformList = ['win32'];
        }
        // Linux
        if (platformHelper.isLinux) {
            platformList = ['linux'];
        }
    }

    // DEBUG
    logger.debug('createPlatformList', platformList);

    return platformList;
};

/**
 * Package all Platforms into installers
 * @param {String} platformName - darwin, win32, linux
 * @param {String} sourceArtifact - Application to package
 * @param {String} targetDirectory - Deployment target folder
 * @param {Object} buildOptions - electron-packager options object
 * @param {Function=} callback - Completion callback
 */
let packageArtifact = function(platformName, sourceArtifact, targetDirectory, buildOptions, callback) {

    let cb = callback || function() {};

    let platformPackager = {};

    // macOS
    platformPackager.darwin = function() {
        let architectureName = parseArchitecture(sourceArtifact),
            installerFileName = getInstallerFileName(buildOptions['name'], platformName, buildOptions['app-version'], architectureName, null, true),
            installerSubdirectory = path.join(targetDirectory, installerFileName),
            installerExtension = '.dmg',
            installerFilePath = path.join(targetDirectory, path.basename(installerSubdirectory) + installerExtension),
            sourcesFilePath = path.join(sourceArtifact, buildOptions['name'] + '.app'),
            zipExtension = '.zip',
            zipFilePath = path.join(targetDirectory, path.basename(installerSubdirectory) + zipExtension);

        // Options
        let installerOptions = {
            basepath: '/',
            target: installerFilePath,
            arch: architectureName,
            specification: {
                title: buildOptions['productName'],
                icon: buildOptions['setupIcon'],
                background: buildOptions['setupBackground'],
                window: {
                    size: {
                        width: 640,
                        height: 360
                    }
                },
                contents: [
                    { x: 162, y: 220, type: 'file', path: sourcesFilePath },
                    { x: 478, y: 216, type: 'link', path: '/Applications' },
                    { x: 10000, y: 10000, type: 'position', path: '.background' },
                    { x: 10000, y: 10000, type: 'position', path: '.DS_Store' },
                    { x: 10000, y: 10000, type: 'position', path: '.Trashes' },
                    { x: 10000, y: 10000, type: 'position', path: '.VolumeIcon.icns' }
                ]
            }
        };

        // DEBUG
        logger.debug('packagePlatform', platformName, 'installerOptions', installerOptions);

        // Prepare working directories
        deleteDirectorySync(installerFilePath);
        // deleteDirectorySync(zipFilePath);

        // Create .DMG
        let installer = getInstaller(platformName, installerFilePath)(installerOptions);

        installer.on('finish', function() {
            // DEBUG
            logger.debug('installer', platformName, 'targetFilePath', installerFilePath);

            cb(null, installerFilePath);

            // nativeZipDirectory(path.dirname(sourcesFilePath), zipFilePath, function(err) {
            //     if (err) {
            //         return cb(err);
            //     }
            //
            //     // DEBUG
            //     logger.debug('installer', platformName, 'targetFilePath', zipFilePath);
            //
            //     cb(null, installerFilePath);
            // });
        });

        installer.on('error', function(err) {
            if (err) {
                logger.error('platformPackager', platformName, 'deployHelper', err);
                return cb(err);
            }
        });
    };


    // Windows
    platformPackager.win32 = function() {
        let architectureName = parseArchitecture(sourceArtifact),
            installerFileName = getInstallerFileName(buildOptions['productName'], platformName, buildOptions['app-version'], architectureName),
            installerSubdirectory = path.join(targetDirectory, installerFileName),
            installerExtension = '.exe',
            installerFilePath = path.join(targetDirectory, installerFileName + installerExtension),
            sourcesFilePath = path.join(installerSubdirectory, buildOptions['productName'] + 'Setup' + installerExtension);

        // Options
        let installerOptions = {
            arch: architectureName,
            appDirectory: sourceArtifact,
            outputDirectory: installerSubdirectory,
            loadingGif: buildOptions['setupBackground'],
            noMsi: true,
            exe: buildOptions['productName'] + '.exe',
            version: buildOptions['app-version'],
            authors: buildOptions['app-company'],
            title: buildOptions['productName'],
            productName: buildOptions['productName'],
            name: buildOptions['name'],
            iconUrl: buildOptions['iconUrl'],
            setupIcon: buildOptions['setupIcon']
        };

        // DEBUG
        logger.debug('packagePlatform', platformName, 'installerOptions', installerOptions);

        // Prepare working directories
        deleteDirectorySync(installerSubdirectory, true);
        deleteDirectorySync(installerFilePath);

        // Package
        if (isDebug) {
            process.env['DEBUG'] = 'electron-windows-installer:main';
        }

        // Create .EXE
        let installer = getInstaller(platformName, installerFilePath)(installerOptions);

        installer
            .then(function() {
                // Rename
                fs.rename(sourcesFilePath, installerFilePath, function(err) {

                    if (err) {
                        logger.error('deployHelper', platformName, 'fs.rename', err);
                        return cb(err);
                    }

                    // Remove working directories
                    deleteDirectory(installerSubdirectory, false, function(err) {
                        if (err) {
                            logger.error('deployHelper', platformName, 'deleteDirectory', err);
                            return cb(err);
                        }

                        cb(null, installerFilePath);
                    });
                });
            }, function(err) {
                if (err) {
                    logger.error('deployHelper', platformName, err);
                    return cb(err);
                }
            });
    };


    // Linux
    platformPackager.linux = function() {
        let architectureName = parseArchitecture(sourceArtifact),
            installerFileName = getInstallerFileName(buildOptions['productName'], platformName, buildOptions['app-version'], architectureName),
            installerExtension = '.deb',
            installerFilePath = path.join(targetDirectory, installerFileName + installerExtension);

        if (architectureName.includes('64')) {
            architectureName = 'amd64';
        }

        if (architectureName.includes('32')) {
            architectureName = 'i386';
        }

        let installerOptions = {
            arch: architectureName,
            logger: logger.debug,
            depends: ['libappindicator1', 'libnotify-bin'],
            src: sourceArtifact,
            dest: targetDirectory,
            rename(dest) {
                let filename = getInstallerFileName(buildOptions['name'] + installerExtension, platformName, buildOptions['app-version'], architectureName);

                // DEBUG
                logger.debug('platformPackager', platformName, 'rename', filename);

                return path.join(dest, filename);
            },
            bin: buildOptions['name'],
            icon: buildOptions['setupIcon']
        };

        // DEBUG
        logger.debug('packagePlatform', platformName, 'installerOptions', installerOptions);

        // Create .DEB
        let installer = getInstaller(platformName, installerFilePath);

        installer(installerOptions, function(err) {
            if (err) {
                logger.error('linuxInstaller', err);
                return cb(err);
            }

            // DEBUG
            logger.debug('platformPackager', platformName);

            cb(null);
        });
    };

    platformPackager[platformName]();
};

/**
 * Build, Package all Platforms
 * @param {Function..} callback - Completion callback
 */
let buildAndPackage = function(callback) {

    let cb = callback || function() {};

    let platformList = createPlatformList();

    logger.log('Project', packageJson.name, packageJson.version);
    logger.log('Platforms', platformList.join(', '));

    // Prepare working directories
    createDirectorySync(directoryStaging, directoryRelease);

    /**
     * Recurse Platforms with nested callbacks
     */
    let createBinaryForPlatformRecursive = function(platformIndex) {

        let platformName = platformList[platformIndex];

        if (platformName) {
            let installerOptions = createInstallerOptions(platformName);

            // DEBUG
            logger.debug('createBinaryForPlatformRecursive', 'installerOptions', installerOptions);

            electronPackager(installerOptions, function(err, archBinaryList) {
                if (err) { return cb(err); }

                /**
                 * Recurse Architecture-specific builds
                 */
                // DEBUG
                logger.debug('electronPackager', (_(archBinaryList).map(function(n) { return path.relative(appRootPath, n); })).join(' '), 'ok');
                let createDeploymentForArchitectureRecursive = function(archIndex) {
                    let sourceArtifact = archBinaryList[archIndex],
                        targetDirectory = directoryRelease;

                    // DEBUG
                    logger.debug('createDeploymentForArchitectureRecursive', 'sourceArtifact', sourceArtifact);
                    logger.debug('createDeploymentForArchitectureRecursive', 'targetDirectory', targetDirectory);

                    return packageArtifact(platformName, sourceArtifact, targetDirectory, installerOptions, function(err) {
                        if (err) { return cb(err); }

                        if ((archIndex + 1) !== archBinaryList.length) {
                            return createDeploymentForArchitectureRecursive(archIndex + 1);
                        }

                        if ((platformIndex + 1) !== platformList.length) {
                            return createBinaryForPlatformRecursive(platformIndex + 1);
                        }

                        cb(null, targetDirectory);
                    });
                };

                // Init arch recursion
                createDeploymentForArchitectureRecursive(0);
            });
        }
    };

    // Init platform recursion
    createBinaryForPlatformRecursive(0);
};


/**
 * Main
 */
if (require.main === module) {

    buildAndPackage(function(err, result) {
        if (err) {
            logger.error('buildAndPackage', err);
            return process.exit(1);
        }

        glob(path.join(result, '*.*'), { cwd: appRootPath }, function(err, files) {
            for (let file of files) {
                logger.log('Artifact ready', file);
            }
            process.exit(0);
        });
    });
}


/**
 * @exports
 */
module.exports = {
    build: buildAndPackage
};
