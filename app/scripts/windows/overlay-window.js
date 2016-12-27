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
const electronConnect = require('electron-connect');
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const isDebug = require(path.join(appRootPath, 'lib', 'is-debug'));
const isLivereload = require(path.join(appRootPath, 'lib', 'is-livereload'));

/**
 * URLS
 * @global
 */
let overlayUrl = url.format({ protocol: 'file:', pathname: path.join(appRootPath, 'app', 'html', 'overlay.html') });


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

        // Add Display reference to every Overlay Window
        this.display = display;
        this.displayId = this.display.id;

        this.init(display);
    }

    init() {
        this.setColor('transparent');
        this.setAlpha(0);
        this.setSize();
        this.setLayer();
        this.loadURL(overlayUrl);

        /** @listens mainPage:dom-ready */
        this.webContents.on('dom-ready', () => {
            this.show();
            this.restoreSettings();

            // DEBUG
            if (isDebug) {
                this.webContents.openDevTools({ mode: 'detach' });
            }
            if (isLivereload) {
                this.webContents.openDevTools({ mode: 'detach' });
                const electronConnectClient = electronConnect.client;
                electronConnectClient.create();
            }
        });

        this.on('closed', () => {
            logger.log('overlay-window', 'closed');
        });
    }

    setSize() {
        this.setBounds({
            x: this.display.bounds.x,
            y: this.display.bounds.y,
            width: this.display.bounds.width,
            height: this.display.bounds.height,
        }, true);
    }

    setLayer() {
        this.setAlwaysOnTop(true, 'screen-saver');
    }

    restoreSettings() {
        electronSettings.get('internal.overlays').then((savedOverlays) => {
            if (savedOverlays[this.displayId]) {
                this.setAlpha(savedOverlays[this.displayId].alpha);
                this.setColor(savedOverlays[this.displayId].color);
            }
        });
    }

    setAlpha(value) {
        this.alpha = parseFloat(value);
        this.webContents.send('overlay-update', this.displayId, 'alpha', value);
        this.emit('update', this.displayId, 'alpha', value);
    }

    setColor(value) {
        this.color = value;
        this.webContents.send('overlay-update', this.displayId, 'color', value);
        this.emit('update', this.displayId, 'color', value);
    }
}

/**
 * @exports
 */
module.exports = OverlayWindow;
