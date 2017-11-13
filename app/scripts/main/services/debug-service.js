'use strict';


/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron');
const { webContents } = electron || electron.remote;

/**
 * Modules
 * Configuration
 */
const app = global.menubar.menubar.app;

/**
 * Modules
 * External
 * @constant
 */
const isDebug = require('@sidneys/is-env')('debug');
const isLivereload = require('@sidneys/is-env')('livereload');
const logger = require('@sidneys/logger')({ write: true });
/* eslint-disable no-unused-vars */
const filesize = require('filesize');
const tryRequire = require('try-require');
/* eslint-enable */


/**
 * @constant
 * @default
 */
const defaultTimeout = 5000;

/**
 * Init
 */
let init = () => {
    logger.debug('init');

    let timeout = setTimeout(() => {
        webContents.getAllWebContents().forEach((contents) => {
            /**
             * Open Developer Tools
             */
            if (isDebug) {
                logger.info('opening developer tools:', `"${contents.getURL()}"`);

                contents.openDevTools();
            }

            /**
             * Start Live Reload
             */
            if (isLivereload) {
                logger.info('starting live reload:', `"${contents.getURL()}"`);

                tryRequire('electron-connect')['client'].create();
            }
        });
        clearTimeout(timeout);
    }, defaultTimeout);
};


/**
 * @listens Electron.App#Event:ready
 */
app.once('ready', () => {
    logger.debug('app#ready');

    init();
});
