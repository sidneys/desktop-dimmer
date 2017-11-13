'use strict';


/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron');
const { ipcRenderer, remote } = electron;

/**
 * Modules
 * External
 * @constant
 */
const domTools = require('@sidneys/dom-tools');
const logger = require('@sidneys/logger')({ write: true });


/**
 * Get controller window
 * @return {Electron.BrowserWindow}
 */
let getControllerWindow = () => remote.getGlobal('menubar').menubar.window;

/**
 * Get overlayManager
 * @return {OverlayManager}
 */
let getOverlayManager = () => remote.getGlobal('overlayManager');

/**
 * Get preferencesWindow
 * @return {PreferencesWindow}
 */
let getPreferencesWindow = () => remote.getGlobal('preferencesWindow');


/**
 * DOM Elements
 * @global
 */
const contentElement = document.querySelector('.content');
const controllerListElement = document.querySelector('.display-control-list');
const exitButtonElement = document.querySelector('.window-controls .exit');
/* eslint-disable no-unused-vars */
const preferencesButtonElement = document.querySelector('.window-controls .settings');
/* eslint-enable */


/**
 * Get percentage string for fraction
 * @param {OverlayAlpha} alpha - Fraction
 * @return {String} percentage
 */
let getPercentage = (alpha) => `${Math.floor(100 * parseFloat(alpha))} %`;

/**
 * Pass content size changes to native wrapper window
 */
let handleSizeChanges = () => {
    logger.debug('handleSizeChanges');

    const controllerWindow = getControllerWindow();

    let currentWidth = controllerWindow.getSize()[0];
    let currentHeight = controllerWindow.getSize()[1];
    let contentHeight = contentElement.getBoundingClientRect().height;

    if (contentHeight !== currentHeight) {
        controllerWindow.setSize(currentWidth, contentHeight);
    }
};

/**
 * Register Controllers
 */
let registerControllers = () => {
    logger.debug('registerControllers');

    const overlayManager = getOverlayManager();
    const overlayWindowList = overlayManager.getAll();

    while (controllerListElement.firstChild) {
        controllerListElement.removeChild(controllerListElement.firstChild);
    }

    overlayWindowList.forEach((overlayWindow) => {
        const id = overlayWindow.overlayId;

        let displayControlElement = document.createElement('form');
        displayControlElement.classList.add('display-control-list__display-control');
        displayControlElement.dataset.displayId = id;
        controllerListElement.appendChild(displayControlElement);

        /**
         * Visibility
         */
        const visibility = overlayWindow.overlayConfiguration.visibility;

        const visibilityInputElement = document.createElement('input');
        visibilityInputElement.classList.add('visibility');
        visibilityInputElement.type = 'checkbox';
        visibilityInputElement.checked = visibility;
        displayControlElement.appendChild(visibilityInputElement);

        /**
         * @listens visibilityInputElement:MouseEvent#click
         */
        visibilityInputElement.addEventListener('click', () => {
            logger.debug('visibilityInputElement#click ');

            overlayWindow.setConfiguration({ visibility: visibilityInputElement.checked });
        });

        overlayWindow.setConfiguration({ visibility: visibility });

        /**
         * Alpha
         */
        const alpha = overlayWindow.overlayConfiguration.alpha;

        const alphaOutputElement = document.createElement('output');
        alphaOutputElement.classList.add('alpha');
        alphaOutputElement.value = getPercentage(alpha);
        displayControlElement.appendChild(alphaOutputElement);

        const alphaInputElement = document.createElement('input');
        alphaInputElement.classList.add('alpha');
        alphaInputElement.type = 'range';
        alphaInputElement.max = '0.92';
        alphaInputElement.min = '0.01';
        alphaInputElement.step = '0.01';
        alphaInputElement.value = alpha;
        displayControlElement.appendChild(alphaInputElement);

        /**
         * @listens alphaInputElement:MouseEvent#click
         */
        alphaInputElement.addEventListener('input', () => {
            logger.debug('alphaInputElement#input');

            alphaOutputElement.value = getPercentage(alphaInputElement.value);
            overlayWindow.setConfiguration({ alpha: alphaInputElement.value });
        });

        overlayWindow.setConfiguration({ alpha: alpha });
    });

    handleSizeChanges();
    controllerListElement.style.opacity = '1';
};


/**
 * @listens ipcRenderer#controller-show
 */
ipcRenderer.on('controller-show', () => {
    logger.debug('ipcRenderer#controller-show');

    registerControllers();
});


/**
 * @listens exitButtonElement:MouseEvent#click
 */
exitButtonElement.addEventListener('click', () => {
    logger.debug('exitButtonElement#click');

    remote.app.quit();
});

/**
 * @listens preferencesButtonElement:MouseEvent#click
 */
preferencesButtonElement.addEventListener('click', () => {
    logger.debug('preferencesButtonElement#click');

    const preferencesWindow = getPreferencesWindow();

    preferencesWindow.isVisible() ? preferencesWindow.hide() : preferencesWindow.show();
});

/**
 * @listens document:DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    logger.debug('document#DOMContentLoaded');

    // Add platform name to <html>
    domTools.addPlatformClass();

    // Add slider controls
    registerControllers();
});
