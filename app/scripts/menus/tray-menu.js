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
const { Menu } = electron;

/**
 * Modules
 * External
 * @global
 * @constant
 */
const menubar = require('menubar');
const appRootPath = require('app-root-path').path;

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
const appProductName = packageJson.productName || packageJson.name;
const appVersion = packageJson.version;


/**
 * Tray Menu Template
 */
let trayMenuTemplate = [
    {
        type: 'normal',
        enabled: false,
        label: appProductName + ' v' + appVersion
    },
    {
        label: 'Show',
        enabled: true,
        click() {
            global.appMenubar.window.show();
        }
    },
    {
        label: 'Quit',
        enabled: true,
        click() {
            global.appMenubar.app.quit();
        }
    }
];

/**
 *  Add Menu to Tray
 */
let addTrayMenu = (trayReference) => {
    let appTrayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    trayReference.setContextMenu(appTrayMenu);
    return appTrayMenu;
};


/**
 * @exports
 */
module.exports = {
    add: addTrayMenu
};
