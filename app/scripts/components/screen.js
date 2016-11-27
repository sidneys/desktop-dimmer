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


/**
 *  Adapt to changes in Display configuration
 */
let handleScreenChanges = () => {
    ['display-metrics-changed', 'display-added', 'display-removed'].forEach(function(ev) {
        electron.screen.on(ev, () => {
            overlayManager.reset();
        });
    });
};

/**
 * @listens app#ready
 */
app.on('ready', () => {
    handleScreenChanges();
});
