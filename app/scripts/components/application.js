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
const preferencesWindow = require(path.join(appRootPath, 'app', 'scripts', 'windows', 'preferences-window'));

/**
 * URLS
 * @global
 */
const controllerUrl = url.format({ protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'controller.html') });

/**
 * Debug Mode
 * @global
 */
const liveReload = global.liveReload = (process.env.NODE_ENV === 'livereload');
const devMode = global.devMode = ((process.env.NODE_ENV === 'dev') || liveReload);

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
    alwaysOnTop: devMode === true,
    backgroundColor: platformHelper.isMacOS ? null : '#404040',
    vibrancy: 'dark',
    hasShadow: false
});

/**
 * Init Settings
 */
let initializeSettings = () => {
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

    console.log('Initialized Settings Database', electronSettings.getSettingsFilePath());
    console.log(util.inspect(electronSettings.getSync(), true, null, true));
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
    },
    user: {
        launchOnStartup: false
    }
};


/**
 * @listens app#quit
 */
app.on('quit', () => {
    console.log('Updated Settings', util.inspect(electronSettings.getSync(), true, null, true));
});

/**
 * @listens app#ready
 */
app.on('ready', () => {
    global.appMenubar = appMenubar;

    initializeSettings();
    overlayManager.create();
    //preferencesWindow.create();

    if (platformHelper.isLinux) {
        trayMenu.add(appMenubar.tray);
    }

    // DEBUG
    if (devMode) {
        appMenubar.window.webContents.openDevTools({ mode: 'undocked' });
    }
    if (liveReload) {
        appMenubar.window.webContents.openDevTools({ mode: 'undocked' });
        const electronConnectClient = electronConnect.client;
        electronConnectClient.add();
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
    console.log(message);
});
