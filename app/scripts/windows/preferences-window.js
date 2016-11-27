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
const { app, BrowserWindow } = electron;

/**
 * Modules
 * External
 * @global
 * @constant
 */
const appRootPath = require('app-root-path').path;
const electronConnect = require('electron-connect');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));

/**
 * App
 * @global
 */
let appProductName = packageJson.productName || packageJson.name;

/**
 * URLS
 * @global
 */
let preferencesUrl = url.format({
    protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'preferences.html')
});


/**
 */
let thisWindow = {};


/**
 * Settings Window
 * @class
 */
class preferencesWindow extends BrowserWindow {
    constructor() {
        super({
            acceptFirstMouse: true,
            alwaysOnTop: true,
            fullscreenable: false,
            width: 320,
            height: 128,
            maximizable: false,
            minimizable: false,
            resizable: false,
            show: false,
            type: 'textured',
            title: appProductName + ' Preferences'
        });

        this.forceQuit = false;

        this.init();
    }

    init() {
        this.loadURL(preferencesUrl);

        this.on('close', (ev) => {
            if (!this.forceQuit) {
                ev.preventDefault();
                this.hide();
            }
        });

        /** @listens mainPage:dom-ready */
        this.webContents.on('dom-ready', () => {
            // DEBUG
            if (global.devMode) {
                this.webContents.openDevTools({ mode: 'undocked' });
            }
            if (global.liveReload) {
                appMenubar.window.webContents.openDevTools({ mode: 'undocked' });
                const electronConnectClient = electronConnect.client;
                electronConnectClient.add();
            }
        });
    }
}

/**
 * Init global preferences window
 */
let initialize = () => {
    thisWindow = new preferencesWindow;
    global.preferencesWindow = thisWindow;
};

/**
 * @listens app#before-quit
 */
app.on('before-quit', () => {
    thisWindow.forceQuit = true;
});

/**
 * @listens app#ready
 */
app.on('ready', () => {
    initialize();
});


/**
 * @exports
 */
module.exports = thisWindow;
