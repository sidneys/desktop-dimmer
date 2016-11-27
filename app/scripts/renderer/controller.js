'use strict';

/**
 * Modules
 * Electron
 * @global
 * @constant
 */
const electron = require('electron');
const { ipcRenderer, remote } = electron;
const path = require('path');

/**
 * Modules
 * External
 * @global
 * @constant
 */
const tinycolor = require('tinycolor2');

/**
 * Electron Global Objects
 * @global
 */
let controller = remote.getGlobal('appMenubar');
let preferencesWindow = remote.getGlobal('preferencesWindow');
let overlays = remote.getGlobal('overlays');

/**
 * Live Reload
 * @global
 */
if (remote.getGlobal('liveReload')) {
    const electronConnect = require('electron-connect');
    const electronConnectClient = electronConnect.client;
    electronConnectClient.add();
}


/**
 * DOM Elements
 * @global
 */
let dom = {
    content: document.querySelector('.content'),
    inputList: document.querySelector('.display-control-list'),
    windowControls: {
        exit: document.querySelector('.window-controls .exit'),
        settings: document.querySelector('.window-controls .settings')
    },
    output: {
        alpha: document.querySelector('#alpha-output-id'),
        color: document.querySelector('#color-output-id'),
        displayId: document.querySelector('#value-displayid'),
    },
    input: {
        container: document.querySelector('.input-container'),
        display: document.querySelector('.display-container'),
        alpha: document.querySelector('input.alpha'),
        color: document.querySelector('input.color')
    }
};

/**
 * @listens Electron:ipcRenderer#controller-show
 */
ipcRenderer.on('controller-show', () => {
    addControls();
});

/**
 * Slider Movement
 */
let addControls = () => {
    let displayList = electron.screen.getAllDisplays(),
        overlayList = [];

    for (let o in overlays) {
        for (let d in displayList) {
            if (overlays[o].displayId === displayList[d].id) {
                overlayList.push(overlays[o]);
            }
        }
    }

    while (dom.inputList.firstChild) {
        dom.inputList.removeChild(dom.inputList.firstChild);
    }

    for (let i in overlayList) {

        let overlay = overlayList[i];

        let elControl = document.createElement('form');
        elControl.classList.add('display-control-list__display-control');
        elControl.dataset.displayId = overlay.displayId;
        dom.inputList.appendChild(elControl);

        let elOutput = document.createElement('output');
        elOutput.classList.add('alpha');
        elOutput.value = formatOutput(overlay.alpha);
        elControl.appendChild(elOutput);

        let elInputAlpha = document.createElement('input');
        elInputAlpha.classList.add('alpha');
        elInputAlpha.max = 0.92;
        elInputAlpha.min = 0;
        elInputAlpha.type = 'range';
        elInputAlpha.step = 0.01;
        elInputAlpha.value = overlay.alpha;
        elInputAlpha.addEventListener('input', function() {
            handleAttributeChange(overlay.displayId, 'alpha', elInputAlpha.value);
        }, false);
        elControl.appendChild(elInputAlpha);
    }

    handleSizeChanges();
    dom.inputList.style.opacity = 1;
};

/**
 * Pass content size changes to native wrapper window
 */
let handleSizeChanges = () => {

    let currentWidth = controller.window.getSize()[0],
        currentHeight = controller.window.getSize()[1],
        contentHeight = parseInt(dom.content.getBoundingClientRect().height);

    if (contentHeight != currentHeight) {
        controller.window.setSize(currentWidth, contentHeight);
    }
};

/**
 * Get percentage strings from floating point
 */
let formatOutput = (value) => {
    return parseInt(100 * value) + ' %';
};

/**
 * Pass Slider changes to overlay
 */
let handleAttributeChange = (displayId, attribute, value) => {
    let elControlList = document.querySelectorAll('.display-control-list__display-control');
    elControlList.forEach(function(elControl) {
        if (parseInt(elControl.dataset.displayId) === parseInt(displayId)) {
            // Update alpha percentage label
            if (attribute === 'alpha') {
                elControl.querySelector('form > output.alpha').value = formatOutput(value);
            }
        }
    });

    let overlay = remote.getGlobal('overlays')[displayId];

    if (overlay) {
        if (attribute === 'alpha') {
            overlay.setAlpha(value);
        }
        if (attribute === 'color') {
            overlay.setColor(tinycolor(value).toRgbString());
        }
    }
};

/**
 * Window Controls:
 * Quit
 * @listens quit:click
 */
dom.windowControls.exit.addEventListener('click', function() {
    remote.app.quit();
}, false);

/**
 * Window Controls:
 * Settings
 * @listens settings:click
 */
dom.windowControls.settings.addEventListener('click', function() {
    preferencesWindow.show();
}, false);

/**
 * Watch for size changes
 * @listens document#HTMLEvent:DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", function() {
    addControls();
}, false);
