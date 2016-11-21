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

/**
 * Set DEBUG Environment Variable
 * @global
 */
if (npmScript === 'debug') {
    if (!process.env['DEBUG']) { process.env['DEBUG'] = true; }
}

/**
 * Set LIVERELOAD Environment Variable
 * @global
 */
if (npmScript === 'livereload') {
    if (!process.env['DEBUG']) { process.env['DEBUG'] = true; }
    process.env['livereload'] = true;
}


electronCompile.init(appRootPath, './scripts/components/application');