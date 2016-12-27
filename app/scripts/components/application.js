'use strict';

/**
 * Modules
 * Node
 * @global
 * @constant
 */
const os = require('os');
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
const { app, ipcMain } = electron;

/**
 * Chrome Commandline Switches
 */
if ((os.platform() === 'linux')) {
    app.commandLine.appendSwitch('enable-transparent-visuals');
    app.commandLine.appendSwitch('disable-gpu');
}

/**
 * Modules
 * External
 * @global
 * @constant
 */
const menubar = require('menubar');
const appRootPath = require('app-root-path').path;
const electronSettings = require('electron-settings');
const electronConnect = require('electron-connect');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */

const packageJson = require(path.join(appRootPath, 'package.json'));
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));
const overlayManager = require(path.join(appRootPath, 'app', 'scripts', 'components', 'overlay-manager'));
const trayMenu = require(path.join(appRootPath, 'app', 'scripts', 'menus', 'tray-menu'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const isDebug = require(path.join(appRootPath, 'lib', 'is-debug'));
const isLivereload = require(path.join(appRootPath, 'lib', 'is-livereload'));
/* jshint ignore:start */
const screenManager = require(path.join(appRootPath, 'app', 'scripts', 'components', 'screen-manager'));
const preferencesWindow = require(path.join(appRootPath, 'app', 'scripts', 'windows', 'preferences-window'));
const updaterService = require(path.join(appRootPath, 'app', 'scripts', 'services', 'updater-service'));
/* jshint ignore:end */

/**
 * URLS
 * @global
 */
const controllerUrl = url.format({
    protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'controller.html')
});

/**
 * App
 * @global
 */
const appVersion = packageJson.version;

/**
 * Paths
 * @global
 */
const appTrayIconEnabled = path.join(appRootPath, 'icons', platformHelper.type, 'icon-tray-enabled' + platformHelper.templateImageExtension(platformHelper.name));

/**
 * Create reference for App Menubar Controller (Menubar)
 * @global
 * @constant
 */
const appMenubar = menubar({
    width: 256,
    minWidth: 256,
    maxWidth: 256,
    height: 48,
    minHeight: 48,
    preloadWindow: true,
    icon: appTrayIconEnabled,
    index: controllerUrl,
    alwaysOnTop: isDebug === true,
    backgroundColor: platformHelper.isMacOS ? null : '#404040',
    vibrancy: 'dark',
    hasShadow: false
});

/**
 * Settings Defaults
 * @property {String} internal.currentVersion - Application Version
 * @property {Boolean} internal.updatePending - Hashmap
 * @property {Object} internal.overlays - Hashmap
 * @property {Number} display.id- Play Notification Sound
 * @property {Number} display.alpha - Autostart
 * @property {String} display.color - Show recent pushes
 */
let settingsDefaults = {
    internal: {
        currentVersion: appVersion,
        overlays: {}
    },
    user: {
        launchOnStartup: false
    }
};

/**
 * Init Settings
 */
let initializeSettings = () => {
    // Settings Defaults
    electronSettings.defaults(settingsDefaults);
    electronSettings.applyDefaultsSync();

    // Settings Configuration
    electronSettings.configure({
        prettify: true,
        atomicSaving: true
    });

    logger.log('settings', `settingsFilePath: '${electronSettings.getSettingsFilePath()}'`);
    logger.debug('settings', util.inspect(electronSettings.getSync()));
};


/**
 * @listens app#quit
 */
app.on('quit', () => {
    logger.log('settings', `settingsFilePath: '${electronSettings.getSettingsFilePath()}'`);
    logger.debug('settings', util.inspect(electronSettings.getSync()));
});

/**
 * @listens app#ready
 */
app.on('ready', () => {
    global.appMenubar = appMenubar;

    initializeSettings();
    overlayManager.create();

    if (platformHelper.isLinux) {
        trayMenu.add(appMenubar.tray);
    }

    // DEBUG
    logger.log('application', 'ready');

    // DEBUG
    if (isDebug) {
        appMenubar.window.webContents.openDevTools({ mode: 'detach' });
    }
    if (isLivereload) {
        appMenubar.window.webContents.openDevTools({ mode: 'detach' });
        const electronConnectClient = electronConnect.client;
        electronConnectClient.create();
    }
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
    logger.log('renderer', message);
});
