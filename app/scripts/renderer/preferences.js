'use strict';


/**
 * Modules
 * Node
 * @constant
 */
const path = require('path');

/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron');
const { remote } = electron;

/**
 * Modules
 * External
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path').path;
const logger = require('@sidneys/logger')({ write: true });

/**
 * Modules
 * Internal
 * @constant
 */
const configurationManager = remote.require(path.join(appRootPath, 'app', 'scripts', 'main', 'managers', 'configuration-manager'));


/**
 * App
 * @global
 * @constant
 */
const appVersion = remote.getGlobal('manifest').version;


/**
 * DOM Elements
 * @global
 */
const preferencesListElement = document.querySelector('.preferencesList');
const versionTextElement = document.querySelector('.version');

/**
 * Set version
 * @param {String} version - Version
 * @return {void}
 */
let setVersion = (version) => versionTextElement.innerText = version.trim();


/**
 * Reads electron-settings and generates HTML form
 */
let renderPreferences = () => {
    logger.debug('registerPreferences');

    let preferenceKeyList = [
        'appAutoUpdate',
        'appLaunchOnStartup'
    ];

    preferenceKeyList.forEach((keyName) => {
        const preferenceInputElement = document.createElement('input');
        preferenceInputElement.id = keyName;
        preferenceInputElement.type = 'checkbox';
        preferenceInputElement.checked = configurationManager(keyName).get();

        const preferenceLabelElement = document.createElement('label');
        preferenceLabelElement.appendChild(preferenceInputElement);
        preferenceLabelElement.appendChild(document.createTextNode(_.startCase(keyName)));
        preferencesListElement.appendChild(preferenceLabelElement);

        /**
         * @listens preferenceInputElement:MouseEvent#click
         */
        preferenceInputElement.addEventListener('click', () => {
            logger.debug('preferenceInputElement#click ');

            configurationManager(keyName).set(preferenceInputElement.checked);
        });
    });
};

/**
 * @listens window#load
 */
window.addEventListener('load', () => {
    logger.debug('window#load');

    setVersion(appVersion);
});

/**
 * @listens document:DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    logger.debug('document#DOMContentLoaded');

    renderPreferences();
});
