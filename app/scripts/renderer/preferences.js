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
const { ipcRenderer, remote } = electron;

/**
 * Modules
 * External
 * @global
 * @constant
 */
const _ = require('lodash');
const appRootPath = require('app-root-path').path;
const autoLaunch = require('auto-launch');
const electronSettings = require('electron-settings');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));


/**
 * App
 * @global
 */
const appProductName = packageJson.productName || packageJson.name;


/**
 * @global
 */
let autoLauncher = new autoLaunch({
    name: appProductName,
    isHidden: true,
    mac: {
        useLaunchAgent: true
    }
});

/**
 * Debug Mode
 * @global
 */
const devMode = remote.getGlobal('devMode');

/**
 * DOM Elements
 * @global
 */
let dom = {
    form: document.querySelector('form'),
    settingsList: document.querySelector('.settingsList')
};

/**
 * Apply setting changes
 */
let applySetting = (keyPath, value) => {
    if (keyPath === 'user.launchOnStartup') {
        if (value === true) {
            autoLauncher.enable();
        } else {
            autoLauncher.disable();
        }
    }
};

/**
 * Handle Input to Setting change
 */
let handleSettingChange = (keyPath, value) => {
    electronSettings.setSync(keyPath, value);

    // DEBUG
    if (devMode) {
        ipcRenderer.send('log', 'handleSettingChange: ' + keyPath + ': ' + value);
    }
};

/**
 * Register Settings as Inputs
 */
let registerSettings = () => {
    let settings = electronSettings.getSync('user');
    let keys = Object.keys(settings);

    keys.forEach(function(keyName) {
        let keyPath = 'user.' + keyName;
        let elInput = document.createElement('input');
        let elLabel = document.createElement('label');

        elInput.id = keyName;
        elInput.type = 'checkbox';
        elInput.dataset[keyName] = '';
        elInput.checked = settings[keyName];
        elInput.addEventListener('change', function() {
            handleSettingChange(keyPath, elInput.checked);
        }, false);

        elLabel.appendChild(elInput);
        elLabel.appendChild(document.createTextNode(_.startCase(keyName)));
        dom.settingsList.appendChild(elLabel);

        applySetting(keyPath, settings[keyName]);
        electronSettings.observe(keyPath, function(ev) {
            applySetting(keyPath, ev.newValue);
        });
    });
};


/**
 * @listens document#HTMLEvent:DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function() {
    registerSettings();
    ipcRenderer.send('log', 'preferences', 'DOMContentLoaded');
}, false);
