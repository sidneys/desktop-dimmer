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
const { app, BrowserWindow, Menu } = electron;

/**
 * Modules
 * External
 * @global
 * @const
 */
const appRootPath = require('app-root-path').path;

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const packageJson = require(path.join(appRootPath, 'package.json'));


/**
 * App
 * @global
 * @constant
 */
const appProductName = packageJson.productName || packageJson.name;
const appVersion = packageJson.version;


/**
 * @global
 */
let tray = {};
let trayMenu = {};


/**
 * Tray Menu Template
 * @global
 */
let getTrayMenuTemplate = () => {
    return [
        {
            id: 'productName',
            label: `Show ${appProductName}`,
            click() {
                let mainWindow = global.menubar.window || BrowserWindow.getAllWindows()[0];
                mainWindow.show();
            }
        },
        {
            id: 'currentVersion',
            label: `Version ${appVersion}`,
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
 *  Add Menu to Tray
 */
let registerMenu = (appTray) => {
    logger.debug('tray-menu', 'registerMenu()');

    tray = appTray;
    trayMenu = Menu.buildFromTemplate(getTrayMenuTemplate());

    tray.setContextMenu(trayMenu);
};


/**
 * @exports
 */
module.exports = {
    tray: tray,
    menu: trayMenu,
    registerMenu: registerMenu
};
