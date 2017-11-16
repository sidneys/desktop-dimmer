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
const { systemPreferences } = electron;

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path')['path'];
const electronMenubar = require('menubar');

/**
 * Modules
 * Internal
 * @constant
 */
const isDebug = require('@sidneys/is-env')('debug');
const logger = require('@sidneys/logger')({ write: false });
const platformTools = require('@sidneys/platform-tools');


/**
 * Filesystem
 * @constant
 * @default
 */
const windowHtml = path.join(appRootPath, 'app', 'html', 'controller.html');

/**
 * Application
 * @constant
 * @default
 */
const windowUrl = url.format({ protocol: 'file:', pathname: windowHtml });


/**
 * Tray icons
 * @constant
 */
const trayIconDefault = path.join(appRootPath, 'app', 'images', `${platformTools.type}-tray-icon-default${platformTools.templateImageExtension(platformTools.type)}`);


/**
 * Adapt BrowserWindow to OS theme
 * @param {BrowserWindow} browserWindow - Target window
 */
let handleThemeChange = (browserWindow) => {
    logger.debug('handleThemeChange');

    const isDarkTheme = systemPreferences.isDarkMode();

    isDarkTheme ? browserWindow.setVibrancy('dark') : browserWindow.setVibrancy('light');
};

/**
 * @class Menubar
 * @property {electronMenubar} menubar - electronMenubar
 * @property {Electron.App} app - Menubar App
 */
class Menubar {
    /**
     * @constructor
     */
    constructor() {
        logger.debug('constructor');

        this.menubar = electronMenubar({
            alwaysOnTop: isDebug,
            backgroundColor: platformTools.isMacOS ? void 0 : '#404040',
            frame: false,
            hasShadow: false,
            height: 48,
            maxWidth: 256,
            minHeight: 48,
            minWidth: 256,
            resizable: false,
            transparent: Boolean(platformTools.isMacOS),
            vibrancy: platformTools.isMacOS ? 'dark' : void 0,
            width: 256,
            icon: trayIconDefault,
            index: windowUrl,
            preloadWindow: true,
            showDockIcon: isDebug
        });

        this.app = this.menubar.app;

        this.init();
    }

    /**
     * Init
     */
    init() {
        logger.debug('init');

        /**
         * Linux
         */
        if (platformTools.isLinux) {
            this.app.commandLine.appendSwitch('enable-transparent-visuals');
            this.app.commandLine.appendSwitch('disable-gpu');
        }

        /**
         * @listens Menubar.menubar#create-window
         */
        this.menubar.on('create-window', () => {
            logger.debug('Menubar.menubar#create-window');
        });

        /**
         * @listens Electron.App#before-quit
         */
        this.app.on('before-quit', () => {
            logger.debug('app#before-quit');

            global.state.isQuitting = true;
        });

        /**
         * @listens Electron.App#Event:ready
         */
        this.app.once('ready', () => {
            logger.debug('app#ready');
        });

        /**
         * @listens Menubar.menubar#after-create-window
         */
        this.menubar.on('after-create-window', () => {
            logger.debug('Menubar#after-create-window');

            if (isDebug) {
                this.menubar.window.openDevTools({ mode: 'undocked' });
            }

            /**
             * @listens Menubar.window#show
             */
            this.menubar.window.on('show', () => {
                logger.debug('Menubar.window#show');

                /**
                 * @fires Menubar.window.webContents#controller-show
                 */
                this.menubar.window.webContents.send('controller-show');

                /**
                 * Linux
                 */
                if (platformTools.isLinux) {
                    const cursorPosition = electron.screen.getCursorScreenPoint();
                    const targetPosition = {
                        x: cursorPosition.x - (this.menubar.window.getBounds().width + 20),
                        y: cursorPosition.y
                    };

                    this.menubar.window.setPosition(targetPosition.x, targetPosition.y);
                }
            });

            /**
             * @listens Menubar.window#hide
             */
            this.menubar.window.on('hide', () => {
                logger.debug('Menubar.window#hide');

                /**
                 * @fires Menubar.window.webContents#controller-hide
                 */
                this.menubar.window.webContents.send('controller-hide');
            });

            /**
             * @listens Menubar.window.webContents#dom-ready
             */
            this.menubar.window.webContents.on('dom-ready', () => {
                logger.debug('Menubar.window.webContents#dom-ready');

                if (isDebug) {
                    this.menubar.window.openDevTools({ mode: 'undocked' });
                }
            });
        });

        /**
         * @listens systemPreferences:AppleInterfaceThemeChangedNotification
         */
        if (platformTools.isMacOS) {

            systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
                logger.debug('systemPreferences#AppleInterfaceThemeChangedNotification');

                handleThemeChange(this.menubar.window);
            });
        }
    }
}

/**
 * Init
 */
let init = () => {
    logger.debug('init');

    // Ensure single instance
    if (!global.menubar) {
        global.menubar = new Menubar();
    }
};


init();


/**
 * @exports
 */
module.exports = global.menubar;
