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
const electronSettings = require('electron-settings');
const _ = require('lodash');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const isDebug = require(path.join(appRootPath, 'lib', 'is-env'))('debug');
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ write: true });
const platformHelper = require(path.join(appRootPath, 'lib', 'platform-helper'));


/**
 * Paths
 * @global
 * @constant
 */
const appTrayIconDefault = path.join(appRootPath, 'icons', platformHelper.type, `icon-tray-default${platformHelper.templateImageExtension(platformHelper.name)}`);
const appTrayIconTranslucent = path.join(appRootPath, 'icons', platformHelper.type, `icon-tray-translucent${platformHelper.templateImageExtension(platformHelper.name)}`);
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
        global.menubar.tray.setImage(appTrayIconTranslucent);

        this.init(display);
    }

    init() {
        logger.debug('init');

        this.setColor('transparent');
        this.setAlpha(0);
        this.setFullscreen();
        this.setForeground();
        this.loadURL(windowUrl);

        /** @listens Electron#BrowserWindow:closed */
        this.on('closed', () => {
            logger.debug('overlay:closed');
        });

        /** @listens Electron#WebContents:dom-ready */
        this.webContents.on('dom-ready', () => {
            logger.debug('overlay:dom-ready');

            this.show();

            let isEnabled = electronSettings.get('isEnabled');
            logger.debug('isEnabled', isEnabled);

            if (isEnabled) {
                this.enable();
            } else {
                this.disable();
            }

            this.restoreSettings();
        });

        /** @listens Electron#BrowserWindow:update */
        this.on('update', () => {
            logger.debug('overlay:update');

            let pristineOverlays = _.filter(global.overlays, function(overlay) {
                return (overlay.alpha === 0);
            });

            if (pristineOverlays.length !== Object.keys(global.overlays).length) {
                global.menubar.tray.setImage(appTrayIconDefault);
            } else {
                global.menubar.tray.setImage(appTrayIconTranslucent);
            }
        });
    }

    setFullscreen() {
        logger.debug('setFullscreen');

        this.setBounds({
            x: this.display.bounds.x,
            y: this.display.bounds.y,
            width: isDebug ? parseInt(this.display.bounds.width/4) : (this.display.bounds.width + 1),
            height: isDebug ? parseInt(this.display.bounds.height/4) : (this.display.bounds.height + 1),
        }, false);
    }

    setHidden() {
        logger.debug('setHidden');

        this.setBounds({
            x: 0,
            y: 0,
            width: 1,
            height: 1
        }, false);
    }

    setForeground() {
        logger.debug('setForeground');

        isDebug ? this.setAlwaysOnTop(false) : this.setAlwaysOnTop(true, 'screen-saver', 2);
    }

    setBackground() {
        logger.debug('setBackground');

        this.setAlwaysOnTop(false);
    }

    restoreSettings() {
        logger.debug('restoreSettings');

        let savedOverlays = electronSettings.get('overlays');
        if (savedOverlays[this.displayId]) {
            this.setAlpha(savedOverlays[this.displayId].alpha);
            this.setColor(savedOverlays[this.displayId].color);
        }
    }

    setAlpha(value) {
        logger.debug('setAlpha');

        let debounced = _.debounce(() => {
            this.alpha = parseFloat(value);
            this.webContents.send('overlay-update', this.id, 'alpha', value);
            this.emit('update', this.id, 'alpha', value);
        }, 150);

        debounced();
    }

    setColor(value) {
        logger.debug('setColor');

        this.color = value;
        this.webContents.send('overlay-update', this.id, 'color', value);
        this.emit('update', this.id, 'color', value);
    }

    enable() {
        logger.debug('enable');

        this.setForeground();
        this.setFullscreen();
    }

    disable() {
        logger.debug('disable');

        this.setHidden();
    }
}

/**
 * @exports
 */
module.exports = OverlayWindow;
