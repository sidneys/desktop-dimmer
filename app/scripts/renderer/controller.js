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
const appRootPath = require('app-root-path').path;
const electronConnect = require('electron-connect');
const electronSettings = require('electron-settings');
const tinycolor = require('tinycolor2');

/**
 * Settings Configuration
 */
electronSettings.configure({ prettify: true });

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ writeToFile: true });
const isLivereload = require(path.join(appRootPath, 'lib', 'is-livereload'));


/**
 * @global
 */
let controller = remote.getGlobal('menubar');
let windows = remote.getGlobal('windows');
let overlays = remote.getGlobal('overlays');


/**
 * DOM Elements
 * @global
 */
let dom = {
    content: document.querySelector('.content'),
    inputList: document.querySelector('.display-control-list'),
    windowControls: {
        disable: document.querySelector('.window-controls .disable'),
        enable: document.querySelector('.window-controls .enable'),
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
 * Get percentage strings from floating point
 */
let formatOutput = (value) => {
    logger.debug('controller', 'formatOutput()');

    return parseInt(100 * value) + ' %';
};

/**
 * Pass Slider changes to overlay
 */
let handleAttributeChange = (displayId, attribute, value) => {
    logger.debug('controller', 'handleAttributeChange()');

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
 * Pass content size changes to native wrapper window
 */
let handleSizeChanges = () => {
    logger.debug('controller', 'handleSizeChanges()');

    let currentWidth = controller.window.getSize()[0];
    let currentHeight = controller.window.getSize()[1];
    let contentHeight = parseInt(dom.content.getBoundingClientRect().height);

    if (contentHeight !== currentHeight) {
        controller.window.setSize(currentWidth, contentHeight);
    }
};

/**
 * Slider Movement
 */
let addDisplaySliders = () => {
    logger.debug('controller', 'addDisplaySliders()');

    let displayList = electron.screen.getAllDisplays();
    let overlayList = [];

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
 * @listens Electron:ipcRenderer#controller-show
 */
ipcRenderer.on('controller-show', () => {
    logger.debug('controller', 'ipcRenderer#controller-show');

    addDisplaySliders();
});

/**
 * Controls: Quit
 * @listens dom.windowControls.exit#MouseEvent:click
 */
dom.windowControls.exit.addEventListener('click', function() {
    logger.debug('controller', 'exit#click');

    remote.app.quit();
}, false);

/**
 * Controls: Open Settings
 * @listens dom.windowControls.settings#MouseEvent:click
 */
dom.windowControls.settings.addEventListener('click', function() {
    logger.debug('controller', 'settings#click');

    windows.preferences.show();
}, false);

/**
 * Controls: Enable
 * @listens dom.windowControls.enable#MouseEvent:click
 */
dom.windowControls.enable.addEventListener('click', function() {
    logger.debug('controller', 'enable#click');

    dom.windowControls.enable.classList.add('hide');
    dom.windowControls.disable.classList.remove('hide');

    electronSettings.set('isEnabled', true).then(() => {
        logger.debug('controller', 'isEnabled', electronSettings.getSync('isEnabled'));

        for (let i in overlays) {
            overlays[i].enable();
        }
    });
}, false);

/**
 * Controls: Disable
 * @listens dom.windowControls.disable#MouseEvent:click
 */
dom.windowControls.disable.addEventListener('click', function() {
    logger.debug('controller', 'disable#click');

    dom.windowControls.enable.classList.remove('hide');
    dom.windowControls.disable.classList.add('hide');

    electronSettings.set('isEnabled', false).then(() => {
        logger.debug('controller', 'isEnabled', electronSettings.getSync('isEnabled'));

        for (let i in overlays) {
            overlays[i].disable();
        }
    });
}, false);


//noinspection JSValidateJSDoc
/**
 * Watch for size changes
 * @listens document#DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function() {
    logger.debug('controller', 'document#DOMContentLoaded');

    addDisplaySliders();

    if (electronSettings.getSync('isEnabled') === true) {
        dom.windowControls.enable.classList.add('hide');
    } else {
        dom.windowControls.disable.classList.add('hide');
    }

    // DEBUG
    if (isLivereload) {
        electronConnect.client.add();
    }
}, false);
