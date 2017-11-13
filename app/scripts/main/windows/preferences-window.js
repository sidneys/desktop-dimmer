'use strict';

/**
 * Modules
 * Node
 * @constant
 */
const path = require('path');
const url = require('url');

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
const app = global.menubar.menubar.app;


/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path').path;
const logger = require('@sidneys/logger')({ write: true });


/**
 * Filesystem
 * @constant
 * @default
 */
const windowHtml = path.join(appRootPath, 'app', 'html', 'preferences.html');

/**
 * Application
 * @constant
 * @default
 */
const windowTitle = global.manifest.productName;
const windowUrl = url.format({ protocol: 'file:', pathname: windowHtml });


/**
 * @class PreferencesWindow
 * @extends Electron.BrowserWindow
 * @namespace Electron
 */
class PreferencesWindow extends BrowserWindow {
    constructor() {
        super({
            acceptFirstMouse: true,
            alwaysOnTop: false,
            autoHideMenuBar: true,
            fullscreenable: false,
            maximizable: false,
            minimizable: false,
            height: 128,
            minHeight: 128,
            maxHeight: 256,
            resizable: false,
            show: false,
            title: `${windowTitle} Preferences`,
            type: 'textured',
            width: 320,
            minWidth: 320,
            maxWidth: 640
        });

        this.init();
    }

    /**
     * Init
     */
    init() {
        logger.debug('init');

        /**
         * @listens PreferencesWindow#close
         */
        this.on('close', (event) => {
            logger.debug('AppWindow#close');

            if (global.state.isQuitting === false) {
                event.preventDefault();
                this.hide();
            }
        });


        this.loadURL(windowUrl);
    }
}


/**
 * Init
 */
let init = () => {
    logger.debug('init');

    // Ensure single instance
    if (!global.preferencesWindow) {
        global.preferencesWindow = new PreferencesWindow();
    }
};


/**
 * @listens Electron.App#on
 */
app.once('ready', () => {
    logger.debug('app#ready');

    init();
});


/**
 * @exports
 */
module.exports = global.preferencesWindow;
