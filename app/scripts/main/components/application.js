'use strict';

/**
 * Modules
 * Node
 * @global
 * @constant
 */
const EventEmitter = require('events');
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
const _ = require('lodash');
const appRootPath = require('app-root-path');
const electronSettings = require('electron-settings');

/**
 * Modules
 * Configuration
 */
EventEmitter.defaultMaxListeners = Infinity;
appRootPath.setPath(path.join(__dirname, '..', '..', '..', '..'));

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath.path, 'package.json'));
const platformHelper = require(path.join(appRootPath.path, 'lib', 'platform-helper'));
const logger = require(path.join(appRootPath.path, 'lib', 'logger'))({ write: true });
const isDebug = require(path.join(appRootPath.path, 'lib', 'is-env'))('debug');


/**
 * URLS
 * @global
 */
const controllerUrl = url.format({
    protocol: 'file:', pathname: path.join(appRootPath.path, 'app', 'html', 'controller.html')
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
const appTrayIconEnabled = path.join(appRootPath.path, 'icons', platformHelper.type, `icon-tray-default${platformHelper.templateImageExtension(platformHelper.name)}`);

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
const trayMenu = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'menus', 'tray-menu'));
const overlayManager = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'components', 'overlay-manager')); // jshint ignore:line
const screenManager = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'components', 'screen-manager')); // jshint ignore:line
const updaterService = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'services', 'updater-service'));  // jshint ignore:line
const preferencesWindow = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'windows', 'preferences-window'));  // jshint ignore:line
const debugService = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'services', 'debug-service')); // jshint ignore:line


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
 */
let settingsDefaults = {
    internalVersion: appVersion,
    launchOnStartup: false,
    isEnabled: true,
    releaseNotes: '',
    overlays: {}
};

/**
 * Init Settings
 */
let initializeSettings = () => {
    logger.debug('initializeSettings');
    
    let configuration = electronSettings.getAll();
    let configurationDefaults = settingsDefaults;

    electronSettings.setAll(_.defaultsDeep(configuration, configurationDefaults));

    logger.debug(electronSettings.getAll());
};


/**
 * @listens menubar.app#before-quit
 */
menubar.app.on('before-quit', () => {
    logger.info('settings', electronSettings.getAll());
    logger.info('file', electronSettings.file());
});

/**
 * @listens menubar#after-create-window
 */
menubar.on('after-create-window', () => {
    logger.debug('menubar:after-create-window');

    initializeSettings();

    /** Linux */
    if (platformHelper.isLinux) {
        trayMenu.registerMenu(menubar.tray);
    }

    /**
     * @listens menubar.window.on#show
     */
    menubar.window.on('show', () => {
        logger.debug('menubar.window.on:show');

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
            logger.debug('targetPosition', util.inspect(targetPosition));
        }
    });

    /**
     * @listens menubar.window#hide
     */
    menubar.window.on('hide', () => {
        logger.debug('menubar.window:hide');

        menubar.window.webContents.send('controller-hide');
    });

    /**
     * @listens Electron#WebContents:dom-ready
     */
    menubar.window.webContents.on('dom-ready', () => {
        logger.debug('menubar.window.webContents:dom-ready');
    });
});


/**
 * macOS
 */
if (platformHelper.isMacOS) {
    // Adapt to dark / light mode
    systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
        logger.debug('systemPreferences.isDarkMode()', systemPreferences.isDarkMode());

        if (systemPreferences.isDarkMode()) {
            menubar.window.setVibrancy('dark');
        } else {
            menubar.window.setVibrancy('light');
        }
    });
}
