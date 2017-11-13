'use strict';


/**
 * Modules
 * Node
 * @constant
 */
const EventEmitter = require('events');
const path = require('path');

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path');
const platformTools = require('@sidneys/platform-tools');

/**
 * Modules
 * Electron
 * @constant
 */
/* eslint-disable no-unused-vars */
const menubar = require(path.join(appRootPath['path'], 'app', 'scripts', 'main', 'components', 'menubar'));
/* eslint-enable */

/**
 * Modules
 * Configuration
 */
EventEmitter.defaultMaxListeners = Infinity;
appRootPath['setPath'](path.join(__dirname, '..', '..', '..', '..'));
if (platformTools.isLinux) {
    process.env.XDG_CURRENT_DESKTOP = 'Unity';
}

/**
 * Modules
 * Internal
 * @constant
 */
/* eslint-disable no-unused-vars */
const globals = require(path.join(appRootPath['path'], 'app', 'scripts', 'main', 'components', 'globals'));
const updaterService = require(path.join(appRootPath['path'], 'app', 'scripts', 'main', 'services', 'updater-service'));
const debugService = require(path.join(appRootPath['path'], 'app', 'scripts', 'main', 'services', 'debug-service'));
const configurationManager = require(path.join(appRootPath['path'], 'app', 'scripts', 'main', 'managers', 'configuration-manager'));
const overlayManager = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'managers', 'overlay-manager'));
const trayMenu = require(path.join(appRootPath['path'], 'app', 'scripts', 'main', 'menus', 'tray-menu'));
const preferencesWindow = require(path.join(appRootPath.path, 'app', 'scripts', 'main', 'windows', 'preferences-window'));
/* eslint-enable */
