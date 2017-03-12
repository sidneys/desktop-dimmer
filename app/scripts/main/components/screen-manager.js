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
const overlayManager = require(path.join(appRootPath, 'app', 'scripts', 'main', 'components', 'overlay-manager'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ write: true });


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
 * @listens menubar#ready
 */
global.menubar.app.on('ready', () => {
    handleScreenChanges();
});
