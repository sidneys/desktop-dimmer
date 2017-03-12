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
const AutoLaunch = require('auto-launch');
const electronSettings = require('electron-settings');
const _ = require('lodash');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ write: true });

/**
 * App
 * @global
 * @constant
 */
const appName = packageJson.name;
const appProductName = packageJson.productName || packageJson.name;
const appVersion = packageJson.version;

/**
 * Modules
 * Configuration
 */
let autoLauncher = new AutoLaunch({ name: appName, mac: { useLaunchAgent: true } });

/**
 * DOM Elements
 * @global
 */
let dom = {
    form: document.querySelector('form'),
    settingsList: document.querySelector('.settingsList'),
    version: document.querySelector('.version'),
    name: document.querySelector('.name')
};

/**
 * Set version string
 */
let setVersion = (version) => {
    dom.version.innerText = version.trim();
};

/**
 * Set name
 */
let setName = (name) => {
    dom.name.innerText = name.trim();
};

/**
 * Apply setting changes
 */
let applySetting = (keypath, value) => {
    logger.debug('applySetting', 'keypath:', keypath, 'value:', value);

    let keyname = (keypath.split('.').reverse())[0];
    switch (keyname) {
        case 'launchOnStartup':
            if (!!value) {
                return autoLauncher.enable();
            }

            autoLauncher.disable();
    }
};

/**
 * Handle Input to Setting change
 */
let handleSettingChange = (keypath, value) => {
    logger.debug('handleSettingChange', 'keypath', keypath, 'value', value);

    electronSettings.set(keypath, value);
};

/**
 * Reads electron-settings and generates HTML form
 */
let registerUserSettings = () => {
    logger.debug('registerUserSettings ');

    let settings = electronSettings.getAll();
    let keyList = [ 'launchOnStartup' ];

    keyList.forEach(function(keyname) {
        let keypath = keyname;
        let elInput = document.createElement('input');
        let elLabel = document.createElement('label');

        elInput.id = keyname;
        elInput.type = 'checkbox';
        elInput.dataset[keyname] = '';
        elInput.checked = settings[keyname];
        elInput.addEventListener('change', function() {
            handleSettingChange(keypath, elInput.checked);
        }, false);

        elLabel.appendChild(elInput);
        elLabel.appendChild(document.createTextNode(_.startCase(keyname)));
        dom.settingsList.appendChild(elLabel);

        applySetting(keypath, settings[keyname]);
        electronSettings.watch(keypath, (newValue) => {
            applySetting(keypath, newValue);
        });
    });
};

//noinspection JSValidateJSDoc
/**
 * @listens window#load
 */
window.addEventListener('load', function() {
    logger.debug('window#load');

    setName(appProductName);
    setVersion(appVersion);
}, false);

//noinspection JSValidateJSDoc
/**
 * @listens document#DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function() {
    logger.debug('document#DOMContentLoaded');
    registerUserSettings();
}, false);
