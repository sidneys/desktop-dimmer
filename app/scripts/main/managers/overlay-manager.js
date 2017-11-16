'use strict';

/**
 * Modules
 * Node
 * @constant
 */
const events = require('events');
const path = require('path');

/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron');
const { BrowserWindow } = electron || electron.remote;

/**
 * Modules
 * Configuration
 */
const app = global.menubar.app;

/**
 * Modules
 * External
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path').path;
const logger = require('@sidneys/logger')({ write: true });


/**
 * Modules
 * Internal
 * @constant
 */
const configurationManager = require(path.join(appRootPath, 'app', 'scripts', 'main', 'managers', 'configuration-manager'));
const OverlayWindow = require(path.join(appRootPath, 'app', 'scripts', 'main', 'windows', 'overlay-window'));


/**
 * Retrieve OverlayConfiguration
 * @param {OverlayId} id - Overlay id
 * @return {OverlayConfiguration} - Overlay configuration
 */
let retrieveOverlayConfiguration = (id) => {
    const map = new Map(configurationManager('overlayConfigurationDatabase').get());

    return map.get(id);
};

/**
 * Store OverlayConfiguration
 * @param {OverlayId} id - Overlay id
 * @param {OverlayConfiguration} configuration - Overlay configuration
 */
let storeOverlayConfiguration = (id, configuration) => {
    const map = new Map(configurationManager('overlayConfigurationDatabase').get());
    map.set(id, configuration);

    configurationManager('overlayConfigurationDatabase').set([...map]);
};


/**
 * @class OverlayManager
 */
class OverlayManager extends events.EventEmitter {
    /**
     * @constructor
     */
    constructor() {
        logger.debug('constructor');

        super();
        this.init();
    }

    /**
     * Init
     */
    init() {
        logger.debug('init');

        /**
         * @listens Electron.App#before-quit
         */
        app.on('before-quit', () => {
            logger.debug('app#before-quit');

            this.storeConfigurations();
        });

        /**
         * @listens Electron.Screen
         */
        const eventList = ['display-metrics-changed', 'display-added', 'display-removed'];
        eventList.forEach((eventName) => {
            electron.screen.on(eventName, () => {
                logger.debug(`Electron.Screen#${eventName}`);

                this.resetAll();
            });
        });

        this.createAll();
        this.retrieveConfigurations();
    }

    /**
     * Get all overlayWindows
     * @return {Array<OverlayWindow>}
     */
    getAll() {
        logger.debug('getAll');

        return BrowserWindow.getAllWindows().filter((browserWindow) => {
            if (!browserWindow.constructor.name) { return; }

            return browserWindow.constructor.name === 'OverlayWindow';
        });
    }

    /**
     * Check whether any overlays are visible
     * @return {Boolean}
     */
    isVisible() {
        logger.debug('isVisible');

        const overlayWindowList = this.getAll();
        const visibleOverlayWindowList = _.filter(overlayWindowList, overlayWindow => overlayWindow.overlayConfiguration.visibility === true);

        return visibleOverlayWindowList.length > 0;
    }

    /**
     * Retrieve all overlay configurations
     */
    retrieveConfigurations() {
        logger.debug('retrieveConfigurations');

        const overlayWindowList = this.getAll();

        overlayWindowList.forEach((overlayWindow) => {
            const overlayConfiguration = retrieveOverlayConfiguration(overlayWindow.overlayId);
            if (!overlayConfiguration) {
                return;
            }

            overlayWindow.setConfiguration(overlayConfiguration);
        });
    };

    /**
     * Store all overlay configurations
     */
    storeConfigurations() {
        logger.debug('storeConfigurations');

        const overlayWindowList = this.getAll();

        overlayWindowList.forEach((overlayWindow) => {
            storeOverlayConfiguration(overlayWindow.overlayId, overlayWindow.overlayConfiguration);
        });
    };

    /**
     * Remove all overlay windows
     * @param {Boolean} restart - relaunch app after removal
     */
    removeAll(restart) {
        logger.debug('removeAll');

        this.storeConfigurations();

        const overlayWindowList = this.getAll();

        overlayWindowList.forEach((overlayWindow, overlayWindowIndex, overlayWindowList) => {
            // Guard
            if (overlayWindow.isDestroyed()) {
                return;
            }

            /**
             * @listens OverlayWindow#closed
             */
            overlayWindow.on('closed', () => {
                logger.debug('overlayWindow#closed');

                // Remove reference
                overlayWindow = null;
                delete overlayWindowList[overlayWindowIndex];

                // Last window
                if (overlayWindowIndex === overlayWindowList.length - 1) {
                    // Restart
                    if (restart) {
                        app.relaunch();
                        app.exit();
                    }
                }
            });

            overlayWindow.close();
        });
    };

    /**
     * Create all overlays
     */
    createAll() {
        logger.debug('createAll');

        electron.screen.getAllDisplays().forEach((electronDisplay) => {
            new OverlayWindow(electronDisplay);
        });
    };

    /**
     * Reset all overlays
     */
    resetAll() {
        logger.debug('resetAll');

        this.removeAll(true);
    };
}

/**
 * Init
 */
let init = () => {
    logger.debug('init');

    // Ensure single instance
    if (!global.overlayManager) {
        global.overlayManager = new OverlayManager();
    }
};


/**
 * @listens Electron.App#on
 */
app.on('ready', () => {
    logger.debug('app#ready');

    init();
});


/**
 * @exports
 */
module.exports = global.overlayManager;
