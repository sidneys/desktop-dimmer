'use strict';

/**
 * Modules
 * Node
 * @global
 * @constant
 */
const path = require('path');

/**
 * Modules
 * Electron
 * @global
 * @constant
 */
const electron = require('electron');
const { app } = electron;

/**
 * Modules
 * External
 * @global
 * @constant
 */
const appRootPath = require('app-root-path').path;

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const overlayManager = require(path.join(appRootPath, 'app', 'scripts', 'components', 'overlay-manager'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });


/**
 *  Handle display changes
 */
let handleScreenChanges = () => {
    ['display-metrics-changed', 'display-added', 'display-removed'].forEach(function(ev) {
        electron.screen.on(ev, () => {
            overlayManager.reset();

            // DEBUG
            logger.debug('handleScreenChanges', ev);
        });
    });
};

/**
 * @listens app#ready
 */
app.on('ready', () => {
    handleScreenChanges();
});
