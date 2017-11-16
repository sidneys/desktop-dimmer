'use strict';


/**
 * Modules
 * Node
 * @constant
 */
const path = require('path');

/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron');
const { Menu } = electron || electron.remote;

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
const appRootPath = require('app-root-path')['path'];

/**
 * Modules
 * Internal
 * @constant
 */
const logger = require('@sidneys/logger')({ write: true });
const platformTools = require('@sidneys/platform-tools');


/**
 * Application
 * @constant
 */
const appCurrentVersion = global.manifest.version;
const appProductName = global.manifest.productName;


/**
 * Get controller window
 * @return {Electron.BrowserWindow}
 */
let getControllerWindow = () => global.menubar.menubar.window;

/**
 * Get tray
 * @return {Electron.Tray}
 */
let getTray = () => global.menubar.menubar.tray;


/**
 * Tray, Dock Menu Template
 * @return {Electron.MenuItemConstructorOptions[]}
 */
let createTrayMenuTemplate = () => {
    return [
        {
            id: 'appProductName',
            label: `Show ${appProductName}`,
            click() {
                getControllerWindow().show();
            }
        },
        {
            id: 'appCurrentVersion',
            label: `v${appCurrentVersion}`,
            type: 'normal',
            enabled: false
        },
        {
            type: 'separator'
        },
        {
            label: `Quit ${appProductName}`,
            click() {
                app.quit();
            }
        }
    ];
};

/**
 * @class TrayMenu
 * @property {Electron.MenuItemConstructorOptions[]} template - Template
 * @property {Electron.Tray} tray - Tray
 * @property {Electron.Menu} menu - Menu
 */
class TrayMenu {
    /**
     * @param {Electron.MenuItemConstructorOptions[]} template - Menu template
     * @constructor
     */
    constructor(template) {
        logger.debug('constructor');

        this.template = template;
        this.tray = getTray();
        this.menu = Menu.buildFromTemplate(this.template);

        this.init();
    }

    /**
     * Init
     */
    init() {
        logger.debug('init');

        this.tray.setContextMenu(this.menu);

        /**
         * @listens Electron.Tray#click
         */
        this.tray.on('click', () => {
            logger.debug('TrayMenu#click');

            const controllerWindow = getControllerWindow();

            if (!controllerWindow) { return; }

            controllerWindow.isVisible() ? controllerWindow.hide() : controllerWindow.show();
        });
    }
}


/**
 * Init
 */
let init = () => {
    logger.debug('init');

    // Ensure single instance
    if (!global.trayMenu) {
        global.trayMenu = new TrayMenu(createTrayMenuTemplate());
    }
};


/**
 * @listens Electron.App#Event:ready
 */
app.once('ready', () => {
    logger.debug('app#ready');

    if (!platformTools.isLinux) { return; }

    init();
});


/**
 * @exports
 */
module.exports = global.trayMenu;
