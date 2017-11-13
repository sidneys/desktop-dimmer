'use strict';


/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron');
const { ipcRenderer } = electron;

/**
 * Modules
 * External
 * @constant
 */
const tinycolor = require('tinycolor2');

/**
 * Modules
 * Internal
 * @constant
 */
const logger = require('@sidneys/logger')({ write: true });


/**
 * @global
 */
let dom = {
    container: document.querySelector('html')
};

/**
 * Get color
 * @return {tinycolor} Color
 */
let getColor = () => tinycolor(dom.container.style.backgroundColor);

/**
 * Get alpha
 * @return {OverlayAlpha} Alpha
 */
let getAlpha = () => (getColor()).getAlpha();


/**
 * @listens Electron:ipcRenderer#overlay-change
 */
ipcRenderer.on('update-overlay', (event, overlayConfiguration) => {
    logger.debug('ipcRenderer#overlay-change');

    /**
     * Alpha
     */
    if (overlayConfiguration.alpha) {
        const targetColor = getColor();
        targetColor.setAlpha(parseFloat(overlayConfiguration.alpha));
        dom.container.style.backgroundColor = targetColor.toRgbString();
    }

    /**
     * Color
     */
    if (overlayConfiguration.color) {
        const targetColor = tinycolor(overlayConfiguration.color);
        targetColor.setAlpha(getAlpha());
        dom.container.style.backgroundColor = targetColor.toRgbString();
    }
});
