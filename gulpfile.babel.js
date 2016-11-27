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
const gulp = require('gulp');
const electron = require('electron');
const appRootPath = require('app-root-path').path;
const electronConnect = require('electron-connect');

/**
 * Modules
 * Internal
 * @global
 * @constant
 */
const packageJson = require(path.join(appRootPath, 'package.json'));


/**
 * Paths
 * @global
 */
let appMain = path.join(appRootPath, packageJson.main);

/**
 * Electron Connect
 * @global
 */
let electronConnectServer = electronConnect.server.add({
    electron: electron,
    path: appMain,
    useGlobalElectron: false,
    verbose: false,
    stopOnClose: false,
    logLevel: 2
});

/**
 * App Sources
 * @global
 * @constant
 */
let appSources = {
    main: [
        path.join(appRootPath, 'app', 'scripts', '**', '*.*'),
        path.join(appRootPath, 'app', 'html', '*.*'),
        path.join(appRootPath, 'icons', '**', '*.*'),
        path.join(appRootPath, 'app', 'styles', '*.*'),
        path.join(appRootPath, 'app', 'fonts', '*.*')
    ],
    renderer: []
};

          console.log(appSources)
/**
 * Task
 * Start Livereload Server
 */
gulp.task('livereload', function() {
    electronConnectServer.start();
    gulp.watch(appSources.main, ['restart:main']);
    gulp.watch(appSources.renderer, ['reload:renderer']);
});

/**
 * Task
 * Restart Main Process
 */
gulp.task('restart:main', function(done) {
    electronConnectServer.restart();
    done();
});

/**
 * Task
 * Restart Renderer Process
 */
gulp.task('reload:renderer', function(done) {
    electronConnectServer.reload();
    done();
});


gulp.task('default', ['livereload']);

