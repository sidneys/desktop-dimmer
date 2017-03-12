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

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ write: true });


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
        logger.debug('init');

        this.loadURL(windowUrl);

        /**
         * @listens Electron#BrowserWindow:close
         */
        this.on('close', (ev) => {
            logger.debug('close');

            if (!this.forceQuit) {
                ev.preventDefault();
                this.hide();
            }
        });

        /**
         * @listens Electron#BrowserWindow:closed
         */
        this.on('closed', () => {
            logger.debug('closed');
        });

        /**
         * @listens Electron#WebContents:dom-ready
         */
        this.webContents.on('dom-ready', () => {
            logger.debug('webContents#dom-ready');
        });

        /**
         * @listens app#before-quit
         */
        app.on('before-quit', () => {
            logger.debug('app#before-quit');

            this.forceQuit = true;
        });
    }
}


/**
 * @listens menubar#ready
 */
app.on('ready', () => {
    logger.debug('app#ready');

    preferencesWindow = new PreferencesWindow();

    if (!global.windows) { global.windows = {}; }
    global.windows.preferences = preferencesWindow;
});


/**
 * @exports
 */
module.exports = preferencesWindow;
