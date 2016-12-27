'use strict';

/**
 * Modules
 * Node
 * @global
 * @constant
 */
const path = require('path');
const url = require('url');

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
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const isDebug = require(path.join(appRootPath, 'lib', 'is-debug'));
const isLivereload = require(path.join(appRootPath, 'lib', 'is-livereload'));


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


let preferencesWindow = {};


/**
 * Settings Window
 * @class
 */
class PreferencesWindow extends BrowserWindow {
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

            // DEBUG
            logger.log('preferences-window', 'close');
        });

        this.on('closed', () => {
            logger.log('preferences-window', 'closed');
        });

        /**
         * @listens mainPage:dom-ready
         */
        this.webContents.on('dom-ready', () => {
            // DEBUG
            if (isDebug) {
                this.webContents.openDevTools({ mode: 'undocked' });
            }
            if (isLivereload) {
                global.appMenubar.window.webContents.openDevTools({ mode: 'undocked' });
                const electronConnectClient = electronConnect.client;
                electronConnectClient.add();
            }
        });
    }
}


/**
 * @listens app#before-quit
 */
app.on('before-quit', () => {
    preferencesWindow.forceQuit = true;

    // DEBUG
    logger.log('preferences-window', 'before-quit');
});


/**
 * @listens app#ready
 */
app.on('ready', () => {
    preferencesWindow = new PreferencesWindow();
    global.preferencesWindow = preferencesWindow;

    // DEBUG
    logger.log('preferences-window', 'ready');
});


/**
 * @exports
 */
module.exports = preferencesWindow;
