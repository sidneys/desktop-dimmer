'use strict';


/**
 * Modules
 * Node
 * @constant
 */
const path = require('path');

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path');

/**
 * Modules
 * Internal
 * @constant
 */
const packageJson = require(path.join(appRootPath['path'], 'package.json'));


/**
 * Manifest
 * @global
 * @constant
 */
global.manifest = {
    homepage: packageJson.homepage,
    name: packageJson.name,
    productName: packageJson.productName || packageJson.name,
    version: packageJson.version
};

/**
 * State
 * @global
 */
global.state = {
    isQuitting: false
};

