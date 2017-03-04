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
const { systemPreferences } = electron;
const Menubar = require('menubar');


/**
 * Modules
 * External
 * @global
 * @constant
 */
const appRootPath = require('app-root-path').path;
const electronConnect = require('electron-connect');
const electronSettings = require('electron-settings');

/**
 * Settings Configuration
 */
electronSettings.configure({ prettify: true });

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const isDebug = require(path.join(appRootPath, 'lib', 'is-debug'));
const isLivereload = require(path.join(appRootPath, 'lib', 'is-livereload'));


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
const appTrayIconEnabled = path.join(appRootPath, 'icons', platformHelper.type, `icon-tray-default${platformHelper.templateImageExtension(platformHelper.name)}`);

/**
 * Menubar Controller (Menubar)
 * @global
 * @constant
 */
const menubar = Menubar({
    alwaysOnTop: isDebug,
    backgroundColor: platformHelper.isMacOS ? null : '#404040',
    hasShadow: false,
    height: 48,
    icon: appTrayIconEnabled,
    index: controllerUrl,
    maxWidth: 256,
    minHeight: 48,
    minWidth: 256,
    preloadWindow: true,
    resizable: false,
    showDockIcon: isDebug,
    vibrancy: systemPreferences.isDarkMode() ? 'dark' : 'light',
    width: 256
});
global.menubar = menubar;

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const trayMenu = require(path.join(appRootPath, 'app', 'scripts', 'menus', 'tray-menu'));
const overlayManager = require(path.join(appRootPath, 'app', 'scripts', 'components', 'overlay-manager')); // jshint ignore:line
const screenManager = require(path.join(appRootPath, 'app', 'scripts', 'components', 'screen-manager')); // jshint ignore:line
const updaterService = require(path.join(appRootPath, 'app', 'scripts', 'services', 'updater-service'));  // jshint ignore:line
const preferencesWindow = require(path.join(appRootPath, 'app', 'scripts', 'windows', 'preferences-window'));  // jshint ignore:line


/**
 * GPU Settings
 * @global
 */
menubar.app.disableHardwareAcceleration();
if (platformHelper.isLinux) {
    menubar.app.commandLine.appendSwitch('enable-transparent-visuals');
}


/**
 * Settings Defaults
 * @property {String} currentVersion - Application Version
 * @property {Boolean} launchOnStartup - Auto launch
 * @property {Boolean} isEnabled - Overlays are enabled
 * @property {Object} overlays - Overlay hashmap
 */
let settingsDefaults = {
    currentVersion: appVersion,
    launchOnStartup: false,
    isEnabled: true,
    overlays: {}
};

/**
 * Init Settings
 */
let initializeSettings = () => {
    logger.debug('application', 'initializeSettings()');

    // Settings Defaults
    electronSettings.defaults(settingsDefaults);
    electronSettings.applyDefaultsSync();
};


/**
 * @listens menubar.app#before-quit
 */
menubar.app.on('before-quit', () => {
    logger.debug('application', electronSettings.getSettingsFilePath());
    logger.debug('application', util.inspect(electronSettings.getSync()));
});

/**
 * @listens menubar#after-create-window
 */
menubar.on('after-create-window', () => {
    logger.debug('application', 'menubar:after-create-window');

    initializeSettings();

    /** Linux */
    if (platformHelper.isLinux) {
        trayMenu.registerMenu(menubar.tray);
    }

    /**
     * @listens menubar.window.on#show
     */
    menubar.window.on('show', () => {
        logger.debug('application', 'menubar.window.on:show');

        menubar.window.webContents.send('controller-show');

        /** Linux */
        if (platformHelper.isLinux) {
            const cursorPosition = electron.screen.getCursorScreenPoint();
            const targetPosition = {
                x: cursorPosition.x - (menubar.window.getBounds().width + 20),
                y: cursorPosition.y
            };

            menubar.window.setPosition(targetPosition.x, targetPosition.y);

            // DEBUG
            logger.debug('application', 'targetPosition', util.inspect(targetPosition));
        }
    });

    /**
     * @listens menubar.window#hide
     */
    menubar.window.on('hide', () => {
        logger.debug('application', 'menubar.window:hide');

        menubar.window.webContents.send('controller-hide');
    });

    /**
     * @listens Electron#WebContents:dom-ready
     */
    menubar.window.webContents.on('dom-ready', () => {
        logger.debug('application', 'menubar.window.webContents:dom-ready');

        // DEBUG
        if (isDebug) {
            menubar.window.webContents.openDevTools({ mode: 'detach' });
        }
        if (isLivereload) {
            electronConnect.client.create();
        }
    });
});

/**
 * @listens menubar.app#before-quit
 */
menubar.app.on('before-quit', () => {
    logger.debug('application', 'menubar.app:before-quit');

    // DEBUG
    logger.debug('application', electronSettings.getSettingsFilePath());
    logger.debug('application', util.inspect(electronSettings.getSync()));
});


/**
 * macOS
 */
if (platformHelper.isMacOS) {
    // Adapt to dark / light mode
    systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
        logger.debug('application', 'systemPreferences.isDarkMode()', systemPreferences.isDarkMode());

        if (systemPreferences.isDarkMode()) {
            menubar.window.setVibrancy('dark');
        } else {
            menubar.window.setVibrancy('light');
        }
    });
}
