'use strict';


/**
 * Modules
 * External
 * @constant
 */
const logger = require('@sidneys/logger')({ write: true });


/**
 * @typedef {String} OverlayAlpha - Floating-point alpha value
 * @example '0.23'
 */

/**
 * @typedef {String} OverlayColor - Overlay color hexadecimal
 * @example '#404040' 
 */

/**
 * @typedef {Boolean} OverlayVisibility - Overlay visibility
 * @example true 
 */


/**
 * @type {OverlayAlpha}
 * @const
 * @default
 */
const defaultAlpha = '0.0';

/**
 * @type {OverlayColor}
 * @const
 * @default
 */
const defaultColor = '#000000';

/**
 * @type {OverlayVisibility}
 * @const
 * @default
 */
const defaultVisibility = true;


/**
 * @class OverlayConfiguration
 * @property {OverlayAlpha} alpha
 * @property {OverlayColor} color
 * @property {OverlayVisibility} visibility
 */
class OverlayConfiguration {
    /**
     * @param {OverlayAlpha=} alpha - Overlay alpha
     * @param {OverlayColor=} color - Overlay color
     * @param {OverlayVisibility=} visibility - Overlay visibility
     * @constructor
     */
    constructor(alpha = defaultAlpha, color = defaultColor, visibility = defaultVisibility) {
        logger.debug('constructor');

        this.alpha = alpha;
        this.color = color;
        this.visibility = visibility;
    }
}


/**
 * @exports
 */
module.exports = OverlayConfiguration;
