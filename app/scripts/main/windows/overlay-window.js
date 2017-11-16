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
const { BrowserWindow } = electron || electron.remote;

/**
 * Modules
 * External
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path').path;
const isDebug = require('@sidneys/is-env')('debug');
const logger = require('@sidneys/logger')({ write: true });
const platformTools = require('@sidneys/platform-tools');


/**
 * Modules
 * Internal
 * @constant
 */
const OverlayConfiguration = require(path.join(appRootPath, 'app', 'scripts', 'main', 'windows', 'overlay-configuration'));


/**
 * Tray icons
 * @constant
 */
const trayIconDefault = path.join(appRootPath, 'app', 'images', `${platformTools.type}-tray-icon-default${platformTools.templateImageExtension(platformTools.type)}`);
const trayIconTranslucent = path.join(appRootPath, 'app', 'images', `${platformTools.type}-tray-icon-translucent${platformTools.templateImageExtension(platformTools.type)}`);

/**
 * Filesystem
 * @constant
 * @default
 */
const windowHtml = path.join(appRootPath, 'app', 'html', 'overlay.html');

/**
 * Application
 * @constant
 * @default
 */
const windowUrl = url.format({ protocol: 'file:', pathname: windowHtml });


/**
 * Get overlayManager
 * @return {OverlayManager}
 */
let getOverlayManager = () => global.overlayManager;

/**
 * Get TrayMenu
 * @return {TrayMenu}
 */
let getTrayMenu = () => global.menubar.menubar.tray;



/**
 * @typedef {Electron.Display} OverlayDisplay - Target display
 */

/**
 * @typedef {Electron.Display.id} OverlayId - Unique identifier
 */


/**
 * @class OverlayWindow
 * @property {OverlayDisplay} overlayDisplay
 * @property {OverlayId} overlayId
 * @property {OverlayConfiguration} overlayConfiguration
 * @extends Electron.BrowserWindow
 * @namespace Electron
 */
class OverlayWindow extends BrowserWindow {

    /**
     * @param {Electron.Display} display - Display
     * @constructor
     */
    constructor(display) {
        logger.debug('constructor');

        super({
            enableLargerThanScreen: true,
            frame: false,
            focusable: false,
            hasShadow: false,
            height: 1,
            show: false,
            transparent: true,
            width: 1,
            x: 0,
            y: 0
        });

        // BrowserWindow
        this.setIgnoreMouseEvents(true);

        if (isDebug) {
            this.setAlwaysOnTop(false);
        } else {
            this.setAlwaysOnTop(true, 'screen-saver', 2);
        }

        // Display assignment
        this.overlayDisplay = display;
        this.overlayId = display.id;

        // Initial configuration
        this.overlayConfiguration = new OverlayConfiguration();

        this.init();
    }

    /**
     * Init
     */
    init() {
        logger.debug('init');

        /**
         * @listens OverlayWindow.WebContents#dom-ready
         */
        this.webContents.on('dom-ready', () => {
            logger.debug('OverlayWindow.WebContents#dom-ready');

            // Apply configuration
            this.applyConfiguration();

            this.show();
        });

        /**
         * @listens OverlayWindow#dom-ready
         */
        this.on('update-overlay', () => {
            logger.debug('overlay:update');

            const overlayManager = getOverlayManager();
            const isVisible = overlayManager.isVisible();

            isVisible ? getTrayMenu().setImage(trayIconDefault) : getTrayMenu().setImage(trayIconTranslucent);
        });

        this.loadURL(windowUrl);
    }

    /**
     * @fires OverlayWindow#Event:update-overlay
     */
    updateRenderer() {
        logger.debug('updateRenderer');

        this.emit('update-overlay', this.overlayId, this.overlayConfiguration);
        this.webContents.send('update-overlay', this.overlayConfiguration);
    }

    /**
     * applyAlpha
     *
     * @private
     */
    applyAlpha() {
        logger.debug('applyAlpha');

        let debounced = _.debounce(() => this.updateRenderer(), 150);
        debounced();
    }

    /**
     * applyColor
     *
     * @private
     */
    applyColor() {
        logger.debug('applyColor');

        let debounced = _.debounce(() => this.updateRenderer(), 150);
        debounced();
    }

    /**
     * applyVisibility
     *
     * @private
     */
    applyVisibility() {
        logger.debug('applyVisibility');

        const bounds = this.overlayDisplay.bounds;

        if (this.overlayConfiguration.visibility) {
            this.setBounds({
                x: bounds.x,
                y: bounds.y,
                width: isDebug ? Math.floor(bounds.width / 4) : (bounds.width + 1),
                height: isDebug ? Math.floor(bounds.height / 4) : (bounds.height + 1)
            }, false);
        } else {
            this.setBounds({ x: 0, y: 0, width: 1, height: 1 }, false);
        }
    }

    /**
     * Apply configuration
     *
     * @private
     */
    applyConfiguration() {
        logger.debug('applyConfiguration');

        this.applyAlpha();
        this.applyColor();
        this.applyVisibility();
    }

    /**
     * Set configuration
     * @param {OverlayConfiguration|Object} configuration - Overlay configuration
     *
     * @public
     */
    setConfiguration(configuration) {
        logger.debug('setConfiguration');

        this.overlayConfiguration = Object.assign({}, this.overlayConfiguration, configuration);
        this.applyConfiguration();
    }
}

/**
 * @exports
 */
module.exports = OverlayWindow;
