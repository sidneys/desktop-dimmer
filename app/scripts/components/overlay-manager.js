'use strict';

/**
 * Modules
 * Node
 * @global
 * @constant
 */
const path = require('path');
const url = require('url');
const util = require('util');

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
const menubar = require('menubar');
const appRootPath = require('app-root-path').path;
const electronSettings = require('electron-settings');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));
const OverlayWindow = require(path.join(appRootPath, 'app', 'scripts', 'windows', 'overlay-window'));


/**
 * Paths
 * @global
 */
let appTrayIconEnabled = path.join(appRootPath, 'icons', platformHelper.type, 'icon-tray' + platformHelper.templateImageExtension(platformHelper.name)),
    appTrayIconDisabled = path.join(appRootPath, 'icons', platformHelper.type, 'icon-tray-disabled' + platformHelper.templateImageExtension(platformHelper.name));

/**
 * Create reference for Overlays
 * @global
 */
let overlays = global.overlays = {};

/**
 * Remove and recreate all Overlays
 */
let resetOverlays = () => {
    persistOverlaySettings();

    for (let i in overlays) {
        overlays[i].close();
        delete overlays[i];
    }

    createOverlays();
};

/**
 * Creates Overlay windows for all screens
 */
let createOverlays = () => {
    electron.screen.getAllDisplays().forEach(function(display) {
        overlays[display.id] = new OverlayWindow(display);
        overlays[display.id].on('update', () => {
            let pristineOverlays = _.clone(overlays);
            pristineOverlays = _.filter(pristineOverlays, function(overlay) {
                return (overlay.alpha === 0)
            });
            if (pristineOverlays.length !== Object.keys(overlays).length) {
                appMenubar.tray.setImage(appTrayIconEnabled);
            } else {
                appMenubar.tray.setImage(appTrayIconDisabled);
            }
        })
    });
};

/**
 * Save Overlay Settings for each Display
 */
let persistOverlaySettings = () => {
    let savedOverlays = electronSettings.getSync('internal.overlays');

    for (let i in overlays) {
        savedOverlays[overlays[i].displayId] = {
            alpha: overlays[i].alpha,
            color: overlays[i].color
        };
    }
    electronSettings.setSync('internal.overlays', savedOverlays);
};

/**
 * @listens appMenubar#before-quit
 */
app.on('before-quit', () => {
    persistOverlaySettings();
});



/**
 * @exports
 */
module.exports = {
    create: createOverlays,
    reset: resetOverlays
};
