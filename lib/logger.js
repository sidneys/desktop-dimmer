'use strict';


/**
 * Modules
 * Node
 * @global
 * @constant
 */
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

/**
 * Modules
 * External
 * @global
 * @constant
 */
const _ = require('lodash');
const chalk = require('chalk');
const appdirectory = require('appdirectory');

let log = console.log;

/**
 * Modules
 * External
 * @global
 * @const
 */
const appRootPath = require('app-root-path').path;

/**
 * Modules
 * Internal
 * @global
 * @const
 */
const packageJson = require(path.join(appRootPath, 'package.json'));

/**
 * App
 * @global
 */
let appName = packageJson.name;

/**
 * @global
 */
let appLogDirectory = (new appdirectory(appName)).userLogs();
let appLogFile = path.join(appLogDirectory, appName + '.log');

/**
 * Styles
 */
let writeToFile = false;
let styleDefault = chalk['cyan'];
let styleError = chalk['red'];
let styleDebug = chalk['yellow'];

/**
 * Check for Debug Environemnts
 * @return {Boolean}
 */
let isDebugEnvironment = () => {
    let NODE_ENV = process.env.NODE_ENV || '';
    let npm_lifecycle_event = process.env.npm_lifecycle_event || '';

    return Boolean(process.env['DEBUG']) ||
        NODE_ENV.includes('dev') || NODE_ENV.includes('debug') ||
        npm_lifecycle_event.includes('dev') || npm_lifecycle_event.includes('debug');
};

/**
 * Log to console and file
 * @param {*} entry - Log Message
 */
let write = function(entry) {
    if (!writeToFile) {
        return;
    }

    let date = (new Date()),
        dateString = date.toISOString().replace(/Z|T|\..+/gi, ' ').trim().split(' ').reverse().join(' '),
        logString = entry,
        logEntry = '[' + dateString + '] ' + logString;

    // Create Directory
    fs.mkdirp(path.dirname(appLogFile), (err) => {
        if (err) {
            return console.error('log', 'fs.mkdirp', err);
        }
        // Append Log
        fs.appendFile(appLogFile, (logEntry + '\r\n'), function(err) {
            if (err) {
                return console.error('log', 'fs.appendFile', err);
            }
        });
    });
};

/**
 * Format log messages
 * @param {Array} messageList - Messages or entities to print.
 * @returns {Object}
 */
let parseLogEntry = function(messageList) {
    let prefix = _.toUpper(path.basename(module.parent.filename)),
        label = messageList.shift(),
        messageString;

    for (let message in messageList) {
        if (messageList[message] !== null && typeof messageList[message] === 'object') {
            messageList[message] = '\r\n' + util.inspect(messageList[message], {
                    colors: false, depth: null, showProxy: true, showHidden: true
                });
        }
    }

    messageString = messageList.join(' ');

    return {
        prefix: prefix,
        label: label,
        message: messageString
    };
};

/**
 * Log Message
 * @param {...*} arguments - Messages or entities to print.
 */
let printCliMessage = function() {
    if (arguments.length === 0) { return; }

    let args = Array.from(arguments);

    let style = styleDefault,
        parameters = parseLogEntry(args);

    log(util.format('[%s] [%s] %s', style.bold.inverse(parameters.prefix), style.bold(parameters.label), style(parameters.message)));
    write(util.format('[%s] [%s] %s', parameters.prefix, parameters.label, parameters.message));
};


/**
 * Log Error Message
 * @param {...*} arguments - Error Messages or entities to print.
 */
let printCliErrorMessage = function() {
    if (arguments.length === 0) { return; }

    let args = Array.from(arguments);

    let style = styleError,
        parameters = parseLogEntry(args);

    log(util.format('[%s] [%s] %s', style.bold.inverse(parameters.prefix), style.bold(parameters.label), style(parameters.message)));
    write(util.format('[ERROR] [%s] [%s] %s', parameters.prefix, parameters.label, parameters.message));
};

/**
 * Log Debug Message
 * @param {...*} arguments - Error Messages or entities to print.
 */
let printCliDebugMessage = function() {
    if (arguments.length === 0) { return; }

    if (!isDebugEnvironment()) { return; }

    let args = Array.from(arguments);

    let style = styleDebug,
        parameters = parseLogEntry(args);

    log(util.format('[%s] [%s] %s', style.bold.inverse(parameters.prefix), style.bold(parameters.label), style(parameters.message)));
    write(util.format('[DEBUG] [%s] [%s] %s', parameters.prefix, parameters.label, parameters.message));
};


/**
 * Logger
 */
let printDevtoolsMessage = function() {
    if (arguments.length === 0) { return; }

    if (!isDebugEnvironment()) { return; }

    let self = this,
        args = Array.from(arguments),
        messageListFormatted = util.format.apply(null, args),
        parameters = parseLogEntry(args);

    // Show in console
    log.apply(self, [
        '%c%s%c%s%c %c%s', 'font-weight: bold; background: #4AB367; color: white;', parameters.prefix,
        'background: #4AB367; color: white; padding: 0 2px 0 0', parameters.label, '', 'font-weight: bold',
        messageListFormatted
    ]);

    write(util.format('[%s] [%s] %s', parameters.prefix, parameters.label, parameters.message));
};


/**
 * @exports
 */
module.exports = (options) => {

    writeToFile = options && options.writeToFile;

    if (writeToFile) {
        fs.mkdirpSync(appLogDirectory);
    }

    return {
        log: printCliMessage,
        error: printCliErrorMessage,
        debug: printCliDebugMessage,
        devtools: printDevtoolsMessage
    };
};
