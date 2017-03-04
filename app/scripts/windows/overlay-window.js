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

/**
 * Modules
 * External
 * @global
 * @constant
 */
const appRootPath = require('app-root-path').path;
const electronConnect = require('electron-connect');
const electronSettings = require('electron-settings');
const _ = require('lodash');

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
const isDebug = require(path.join(appRootPath, 'lib', 'is-debug'));
const isLivereload = require(path.join(appRootPath, 'lib', 'is-livereload'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));


/**
 * Paths
 * @global
 * @constant
 */
const appTrayIconDefault = path.join(appRootPath, 'icons', platformHelper.type, `icon-tray-default${platformHelper.templateImageExtension(platformHelper.name)}`);
const appTrayIconTransparent = path.join(appRootPath, 'icons', platformHelper.type, `icon-tray-transparent${platformHelper.templateImageExtension(platformHelper.name)}`);
const windowUrl = url.format({ protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'overlay.html') });


/**
 * Overlay Window
 * @constructor
 * @extends Electron.BrowserWindow
 * @class
 */
class OverlayWindow extends BrowserWindow {
    constructor(display) {
        super({
            show: false,
            transparent: true,
            enableLargerThanScreen: true,
            frame: false,
            focusable: false
        });
        this.setIgnoreMouseEvents(true);

        // Add display reference to every overlay Window
        this.display = display;
        this.displayId = this.display.id;

        // Set default icon
        global.menubar.tray.setImage(appTrayIconTransparent);

        this.init(display);
    }

    init() {
        logger.debug('overlay-window', 'init()');

        this.setColor('transparent');
        this.setAlpha(0);
        this.setFullscreen();
        this.setForeground();
        this.loadURL(windowUrl);

        /** @listens Electron#BrowserWindow:closed */
        this.on('closed', () => {
            logger.debug('overlay-window', 'overlay:closed');
        });

        /** @listens Electron#WebContents:dom-ready */
        this.webContents.on('dom-ready', () => {
            logger.debug('overlay-window', 'overlay:dom-ready');

            this.show();

            electronSettings.get('isEnabled').then((isEnabled) => {
                logger.debug('overlay-window', 'isEnabled', isEnabled);

                if (isEnabled) {
                    this.enable();
                } else {
                    this.disable();
                }
            });

            this.restoreSettings();

            // DEBUG
            if (isDebug) {
                this.webContents.openDevTools({ mode: 'detach' });
            }
            if (isLivereload) {
                electronConnect.client.create();
            }
        });

        /** @listens Electron#BrowserWindow:update */
        this.on('update', () => {
            logger.debug('overlay-window', 'overlay:update');

            let pristineOverlays = _.filter(global.overlays, function(overlay) {
                return (overlay.alpha === 0);
            });

            if (pristineOverlays.length !== Object.keys(global.overlays).length) {
                global.menubar.tray.setImage(appTrayIconDefault);
            } else {
                global.menubar.tray.setImage(appTrayIconTransparent);
            }
        });
    }

    setFullscreen() {
        logger.debug('overlay-window', 'setFullscreen()');

        this.setBounds({
            x: this.display.bounds.x,
            y: this.display.bounds.y,
            width: (this.display.bounds.width + 1),
            height: (this.display.bounds.height + 1)
        }, false);
    }

    setHidden() {
        logger.debug('overlay-window', 'setHidden()');

        this.setBounds({
            x: 0,
            y: 0,
            width: 1,
            height: 1
        }, false);
    }

    setForeground() {
        logger.debug('overlay-window', 'setForeground()');

        this.setAlwaysOnTop(true, 'screen-saver');
    }

    setBackground() {
        logger.debug('overlay-window', 'setBackground()');

        this.setAlwaysOnTop(false, 'screen-saver');
    }

    restoreSettings() {
        logger.debug('overlay-window', 'restoreSettings()');

        electronSettings.get('overlays').then((savedOverlays) => {
            if (savedOverlays[this.displayId]) {
                this.setAlpha(savedOverlays[this.displayId].alpha);
                this.setColor(savedOverlays[this.displayId].color);
            }
        });
    }

    setAlpha(value) {
        logger.debug('overlay-window', 'setAlpha()');

        this.alpha = parseFloat(value);
        this.webContents.send('overlay-update', this.id, 'alpha', value);
        this.emit('update', this.id, 'alpha', value);
    }

    setColor(value) {
        logger.debug('overlay-window', 'setColor()');

        this.color = value;
        this.webContents.send('overlay-update', this.id, 'color', value);
        this.emit('update', this.id, 'color', value);
    }

    enable() {
        logger.debug('overlay-window', 'enable()');

        this.setForeground();
        this.setFullscreen();
    }

    disable() {
        logger.debug('overlay-window', 'disable()');

        this.setHidden();
    }
}

/**
 * @exports
 */
module.exports = OverlayWindow;
