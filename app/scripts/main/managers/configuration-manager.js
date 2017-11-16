'use strict';


/**
 * Modules
 * Node
 * @constant
 */
const path = require('path');

/**
 * Modules
 * External
 * @constant
 */
const _ = require('lodash');
const Appdirectory = require('appdirectory');
const AutoLaunch = require('auto-launch');
const electronSettings = require('electron-settings');

/**
 * Modules
 * Internal
 * @constant
 */
const logger = require('@sidneys/logger')({ write: true });


/**
 * Application
 * @constant
 * @default
 */
const appName = global.manifest.name;
const appVersion = global.manifest.version;

/**
 * Filesystem
 * @constant
 * @default
 */
const appSettingsFilepath = path.join(path.dirname(electronSettings.file()), `${appName}.json`);
const appLogDirectory = (new Appdirectory(appName)).userLogs();

/**
 * Modules
 * Configuration
 */
const app = global.menubar.menubar.app;
const autoLauncher = new AutoLaunch({ name: appName, mac: { useLaunchAgent: true } });
electronSettings.setPath(appSettingsFilepath);
/** @namespace Electron */
/** @namespace electronSettings.delete */
/** @namespace electronSettings.deleteAll */
/** @namespace electronSettings.file */
/** @namespace electronSettings.get */
/** @namespace electronSettings.getAll */
/** @namespace electronSettings.set */
/** @namespace electronSettings.setAll */
/** @namespace electronSettings.setPath */

/**
 * Configuration Items
 */
let configurationItems = {
    /**
     * appAutoUpdate
     */
    appAutoUpdate: {
        keypath: 'appAutoUpdate',
        default: true,
        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(value) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, value);
        }
    },
    /**
     * appChangelog
     */
    appChangelog: {
        keypath: 'appChangelog',
        default: '',
        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(value) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, value);
        }
    },
    /**
     * appLastVersion
     */
    appLastVersion: {
        keypath: 'appLastVersion',
        default: appVersion,
        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(value) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, value);
        }
    },
    /**
     * appLaunchOnStartup
     */
    appLaunchOnStartup: {
        keypath: 'appLaunchOnStartup',
        default: true,
        init() {
            logger.debug(this.keypath, 'init');

            this.implement(this.get());
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(value) {
            logger.debug(this.keypath, 'set', value);

            this.implement(value);
            electronSettings.set(this.keypath, value);
        },
        implement(value) {
            logger.debug(this.keypath, 'implement', value);

            if (value) {
                autoLauncher.enable();
            } else {
                autoLauncher.disable();
            }
        }
    },
    /**
     * appLogFile
     */
    appLogFile: {
        keypath: 'appLogFile',
        default: path.join(appLogDirectory, appName + '.log'),
        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(value) {
            logger.debug(this.keypath, 'set');

            electronSettings.set(this.keypath, value);
        }
    },
    /**
     * overlayConfigurationDatabase
     */
    overlayConfigurationDatabase: {
        keypath: 'overlayConfigurationDatabase',
        default: [],
        init() {
            logger.debug(this.keypath, 'init');
        },
        get() {
            logger.debug(this.keypath, 'get');

            return electronSettings.get(this.keypath);
        },
        set(value) {
            logger.debug(this.keypath, 'set', value);

            electronSettings.set(this.keypath, value);
        }
    }
};

/**
 * Access single item
 * @param {String} playlistItemId - Configuration item identifier
 * @returns {Object|void}
 */
let getItem = (playlistItemId) => {
    //logger.debug('getConfigurationItem', playlistItemId);

    if (configurationItems.hasOwnProperty(playlistItemId)) {
        return configurationItems[playlistItemId];
    }
};

/**
 * Get defaults of all items
 * @returns {Object}
 */
let getConfigurationDefaults = () => {
    logger.debug('getConfigurationDefaults');

    let defaults = {};
    for (let item of Object.keys(configurationItems)) {
        defaults[item] = getItem(item).default;
    }

    return defaults;
};

/**
 * Delete all settings
 * @param {function(*)} callback - Callback
 */
let deleteAll = (callback = () => {}) => {
    logger.debug('deleteAll');

    electronSettings.deleteAll();

    callback();
};

/**
 * Set defaults
 * @param {function(*)} callback - Callback
 */
let applyAllDefaults = (callback = () => {}) => {
    logger.debug('applyAllDefaults');

    electronSettings.setAll(_.defaultsDeep(electronSettings.getAll(), getConfigurationDefaults()));

    callback();
};

/**
 * Reset all to defaults
 * @param {function(*)} callback - Callback
 */
let resetAllToDefaults = (callback = () => {}) => {
    logger.debug('resetAllToDefaults');

    deleteAll(() => applyAllDefaults(() => callback()));
};

/**
 * Run init() method of all configuration items
 * @param {function(*)} callback - Callback
 * @function
 */
let runItemInitializers = (callback = () => {}) => {
    logger.debug('runItemInitializers');

    let configurationItemList = Object.keys(configurationItems);

    configurationItemList.forEach((item, itemIndex) => {
        getItem(item).init();

        // Last item
        if (configurationItemList.length === (itemIndex + 1)) {
            logger.debug('initConfigurationItems', 'complete');
            callback();
        }
    });
};

/**
 * Remove unknown items
 * @param {function(*)} callback - Callback
 * @function
 */
let removeLegacyItems = (callback = () => {}) => {
    logger.debug('removeLegacyItems');

    let savedSettings = electronSettings.getAll();
    let savedSettingsList = Object.keys(savedSettings);

    savedSettingsList.forEach((item, itemIndex) => {
        if (!configurationItems.hasOwnProperty(item)) {
            electronSettings.delete(item);
            logger.debug('cleanConfiguration', 'deleted', item);
        }

        // Last item
        if (savedSettingsList.length === (itemIndex + 1)) {
            logger.debug('cleanConfiguration', 'complete');
            callback();
        }
    });
};


/**
 * Init
 */
let init = () => {
    logger.debug('init');

    applyAllDefaults(() => runItemInitializers(() => removeLegacyItems(() => logger.debug('init complete'))));
};


/**
 * @listens Electron.App#Event:ready
 */
app.once('ready', () => {
    logger.debug('app#ready');

    init();
});


/**
 * @listens Electron.App#before-quit
 */
app.on('quit', () => {
    logger.debug('app#quit');

    // Prettify
    // electronSettings.setAll(electronSettings.getAll(), { prettify: true });

    logger.debug('appSettingsFilepath', electronSettings.file());
    logger.debug('appSettings', electronSettings.getAll());
});

/**
 * @exports
 */
module.exports = getItem;
module.exports.resetAllToDefaults = resetAllToDefaults;
