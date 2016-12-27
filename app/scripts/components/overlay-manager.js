'use strict';

/**
 * Modules
 * Node
 * @global
 * @constant
 */
const path = require('path');

/**
 * Modules
 * Electron
 * @global
 * @constant
 */
const electron = require('electron');
const { app } = electron;

/**
 * Modules
 * External
 * @global
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path').path;
const electronSettings = require('electron-settings');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const OverlayWindow = require(path.join(appRootPath, 'app', 'scripts', 'windows', 'overlay-window'));


/**
 * Create reference for Overlays
 * @global
 */
global.overlays = {};


/**
 * Paths
 * @global
 */
let appTrayIconEnabled = path.join(appRootPath, 'icons', platformHelper.type, 'icon-tray' + platformHelper.templateImageExtension(platformHelper.name)),
    appTrayIconDisabled = path.join(appRootPath, 'icons', platformHelper.type, 'icon-tray-disabled' + platformHelper.templateImageExtension(platformHelper.name));

/**
 * Save Overlay Settings for each Display
 */
let persistConfiguration = () => {
    let savedOverlays = electronSettings.getSync('internal.overlays');

    for (let i in global.overlays) {
        savedOverlays[global.overlays[i].displayId] = {
            alpha: global.overlays[i].alpha,
            color: global.overlays[i].color
        };
    }
    electronSettings.setSync('internal.overlays', savedOverlays);
};

/**
 * Remove all Overlays
 * @param { Boolean } restart - relaunch app after removal
 */
let removeOverlays = (restart) => {
     persistConfiguration();

     logger.log('overlay-manager', 'remove');

    // Keep track of total number
    let overlayCount = Object.keys(global.overlays).length;
    let index = 1;

    for (let i in global.overlays) {
        // Check whether BrowserWindow is deleted or destroyed
        if (global.overlays[i].isDestroyed()) {
            return;
        }

        // After window close
        global.overlays[i].on('closed', () => {
            // Remove reference
            global.overlays[i] = null;
            //delete global.overlays[i];
            // Last window, restart app to reinitialize
            if (index === overlayCount) {
                if (restart) {
                    app.relaunch();
                    app.exit();
                }
            }

            index++;
        });

        // Close window
        global.overlays[i].close();

    }
};

/**
 * Remove and recreate all Overlays
 */
let resetOverlays = () => {
    logger.log('overlay-manager', 'restart');
    removeOverlays(true);
};

/**
 * Creates Overlay windows for all screens
 */
let createOverlays = () => {
    electron.screen.getAllDisplays().forEach(function(display) {
        global.overlays[display.id] = new OverlayWindow(display);
        global.overlays[display.id].on('update', () => {
            let pristineOverlays = _.clone(global.overlays);

            pristineOverlays = _.filter(pristineOverlays, function(overlay) {
                return (overlay.alpha === 0);
            });

            if (pristineOverlays.length !== Object.keys(global.overlays).length) {
                global.appMenubar.tray.setImage(appTrayIconEnabled);
            } else {
                global.appMenubar.tray.setImage(appTrayIconDisabled);
            }
        });
    });
};


/**
 * @listens appMenubar#before-quit
 */
app.on('before-quit', () => {
    persistConfiguration();
    logger.log('overlay-manager', 'before-quit');
});


/**
 * @exports
 */
module.exports = {
    persist: persistConfiguration,
    create: createOverlays,
    remove: removeOverlays,
    reset: resetOverlays
};
