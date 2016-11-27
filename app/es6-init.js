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
 * External
 * @global
 * @constant
 */
const appRootPath = require('app-root-path').path;
const electronCompile = require('electron-compile');


/**
 * Get Name of active NPM Script
 *  @global
 */
let npmScript = process.env['npm_lifecycle_event'];

if (npmScript && npmScript.includes('dev')) {
    process.env.NODE_ENV = 'dev';
}

if (npmScript && npmScript.includes('livereload')) {
    process.env.NODE_ENV = 'livereload';
}

electronCompile.init(appRootPath, './scripts/components/application');
