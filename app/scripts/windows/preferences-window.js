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
const { BrowserWindow } = electron;
const app = global.menubar.app;


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
 * @global
 * @constant
 */
const appProductName = packageJson.productName || packageJson.name;
const windowUrl = url.format({
    protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'preferences.html')
});

/**
 * @global
 */
let preferencesWindow = {};


/**
 * Settings Window
 * @class
 */
class PreferencesWindow extends BrowserWindow {
    constructor() {
        super({
            acceptFirstMouse: true,
            alwaysOnTop: false,
            fullscreenable: false,
            maximizable: false,
            minimizable: false,
            height: 128,
            minHeight: 128,
            maxHeight: 256,
            resizable: false,
            show: false,
            title: `${appProductName} Preferences`,
            type: 'textured',
            width: 320,
            minWidth: 320,
            maxWidth: 640,
        });

        this.forceQuit = false;

        this.init();
    }

    init() {
        logger.debug('preferences-window', 'init()');

        this.loadURL(windowUrl);

        /**
         * @listens Electron#BrowserWindow:close
         */
        this.on('close', (ev) => {
            logger.debug('preferences-window', 'close');

            if (!this.forceQuit) {
                ev.preventDefault();
                this.hide();
            }
        });

        /**
         * @listens Electron#BrowserWindow:closed
         */
        this.on('closed', () => {
            logger.debug('preferences-window', 'closed');
        });

        /**
         * @listens Electron#WebContents:dom-ready
         */
        this.webContents.on('dom-ready', () => {
            logger.debug('preferences-window.webContents', '#dom-ready');

            // DEBUG
            if (isDebug) {
                this.webContents.openDevTools({ mode: 'detach' });
            }
            if (isLivereload) {
                electronConnect.client.add();
            }
        });

        /**
         * @listens app#before-quit
         */
        app.on('before-quit', () => {
            logger.debug('preferences-window', 'app#before-quit');

            this.forceQuit = true;
        });
    }
}


/**
 * @listens menubar#ready
 */
app.on('ready', () => {
    logger.debug('preferences-window', 'app#ready');

    preferencesWindow = new PreferencesWindow();

    if (!global.windows) { global.windows = {}; }
    global.windows.preferences = preferencesWindow;
});


/**
 * @exports
 */
module.exports = preferencesWindow;
