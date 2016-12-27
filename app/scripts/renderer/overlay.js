'use strict';


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
 * @global
 */
let dom = {
    container: document.querySelector('html')
};


/**
 * @listens Electron:ipcRenderer#set-color
 */
ipcRenderer.on('overlay-update', (ev, displayId, action, value) => {
    let currentColor = tinycolor(dom.container.style.backgroundColor);

    if (action === 'alpha') {
        dom.container.style.backgroundColor = currentColor.setAlpha(parseFloat(value)).toRgbString();
    }

    if (action === 'color') {
        let color = tinycolor(value);
        color.setAlpha((currentColor.getAlpha()));
        dom.container.style.backgroundColor = color.toRgbString();
    }
});


/**
 * Watch for size changes
 * @listens document#HTMLEvent:DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', function() {
    ipcRenderer.send('log', 'overlay', 'DOMContentLoaded');
}, false);
