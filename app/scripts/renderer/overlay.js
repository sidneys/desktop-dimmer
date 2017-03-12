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
const { ipcRenderer } = electron;

/**
 * Modules
 * External
 * @global
 * @constant
 */
const tinycolor = require('tinycolor2');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const appRootPath = require('app-root-path').path;
const logger = require(path.join(appRootPath, 'lib', 'logger'))({ write: true });


/**
 * @global
 */
let dom = {
    container: document.querySelector('html')
};


/**
 * @listens Electron:ipcRenderer#overlay-update
 */
ipcRenderer.on('overlay-update', (ev, displayId, action, value) => {
    logger.debug('ipcRenderer#overlay-update');

    let currentColor = tinycolor(dom.container.style.backgroundColor);

    switch (action) {
        case 'alpha':
            dom.container.style.backgroundColor = currentColor.setAlpha(parseFloat(value)).toRgbString();
            break;
        case 'color':
            let color = tinycolor(value);
            color.setAlpha((currentColor.getAlpha()));
            dom.container.style.backgroundColor = color.toRgbString();
            break;
    }
});


//noinspection JSValidateJSDoc
/**
 * Watch for size changes
 * @listens document#DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function() {
    logger.debug('document#DOMContentLoaded');
}, false);
