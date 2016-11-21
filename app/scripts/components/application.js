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
const { BrowserWindow, ipcMain } = electron;

/**
 * Modules
 * External
 * @global
 * @constant
 */
const menubar = require('menubar');
const appRootPath = require('app-root-path').path;
const electronSettings = require('electron-settings');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));

/**
 * URLS
 * @global
 */
let controllerUrl = url.format({
        protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'controller.html')
    }),
    overlayUrl = url.format({ protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'overlay.html') });

/**
 * App
 * @global
 */
let appVersion = packageJson.version;

/**
 * Create reference for Overlays
 * @global
 */
let overlays = global.overlays = {};

/**
 * Create reference for App Menubar Controller (Menubar)
 * @global
 * @constant
 */
const appMenubar = menubar({
    width: 300,
    preloadWindow: true,
    height: 60,
    index: controllerUrl,
    alwaysOnTop: false
});

/**
 * Dimmer Overlay
 * @class
 * @constant
 */
class Overlay extends BrowserWindow {
    constructor(display) {
        super({
            show: false,
            transparent: true,
            enableLargerThanScreen: true,
            frame: false,
            focusable: false
        });
        this.setAlwaysOnTop(true, 'screen-saver');
        this.setIgnoreMouseEvents(true);
        this.setBounds({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height,
        }, true);

        // Add Display Id reference to every Overlay Window
        this.displayId = display.id;
        this.alpha = 0.0;
        this.color = 'rgba(0, 0, 0)';

        this.loadURL(overlayUrl);

        /** @listens mainPage:dom-ready */
        this.webContents.on('dom-ready', () => {
            this.show();

            electronSettings.get('internal.overlays').then((savedOverlays) => {
                if (savedOverlays[this.displayId]) {
                    this.setAlpha(savedOverlays[this.displayId].alpha);
                    this.setColor(savedOverlays[this.displayId].color);
                }
            });

            // DEBUG
            // this.webContents.openDevTools();
        });
    }

    setAlpha = function(value) {
        this.alpha = parseFloat(value);
        this.webContents.send('overlay-update', this.displayId, 'alpha', value);
    };

    setColor = function(value) {
        this.color = value;
        this.webContents.send('overlay-update', this.displayId, 'color', value);
    };
}

/**
 * Creates Overlay windows for all screens
 */
let createOverlays = () => {
    electron.screen.getAllDisplays().forEach(function(display) {
        overlays[display.id] = new Overlay(display);
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
 * Settings Defaults
 * @property {String} internal.currentVersion - Application Version
 * @property {Object} internal.overlays - Hashmap
 * @property {Number} display.id- Play Notification Sound
 * @property {Number} display.alpha - Autostart
 * @property {String} display.color - Show recent pushes
 */
let settingsDefaults = {
    internal: {
        currentVersion: appVersion,
        overlays: {}
    }
};


/** @listens appMenubar.app#before-quit */
appMenubar.app.on('ready', () => {
    // Settings Defaults
    electronSettings.defaults(settingsDefaults);
    electronSettings.applyDefaultsSync();

    // Update Settings
    electronSettings.setSync('internal.currentVersion', appVersion);

    // Settings Configuration
    electronSettings.configure({
        prettify: true,
        atomicSaving: true
    });

     appMenubar.window.setVibrancy('dark');
});

/** @listens appMenubar#before-quit */
appMenubar.app.on('before-quit', () => {
    persistOverlaySettings();
});

/** @listens appMenubar#quit */
appMenubar.app.on('quit', () => {
    console.log('Settings', 'File', electronSettings.getSettingsFilePath());
    console.log('Settings', 'Content', util.inspect(electronSettings.getSync(), true, null, true));
});

/**
 * @listens appMenubar#ready
 */
appMenubar.on('ready', () => {
    createOverlays();

    // DEBUG
    appMenubar.window.webContents.openDevTools();
});

/**
 * @listens appMenubar#hide
 */
appMenubar.on('hide', () => {
    appMenubar.window.webContents.send('controller-hide');
});

/**
 * @listens appMenubar#show
 */
appMenubar.on('show', () => {
    appMenubar.window.webContents.send('controller-show');
});


/**
 * @listens ipcMain#log
 */
ipcMain.on('log', (event, message) => {
    console.log(message);
});

/**
 * @listens ipcMain#mouse
 */
ipcMain.on('mouse', (ev, view, action) => {
    if (action === 'leave') {
        //appMenubar.hideWindow();
    }
});


