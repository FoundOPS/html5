/*global module:false*/
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        meta: {
          version: '0.1.0',
          banner: '/*! PROJECT_NAME - v<%= meta.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '* http://foundops.com \n' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
            'FoundOps LLC; Licensed MIT */'
        },
        //https://github.com/jharding/grunt-less
        less: {
            all: {
                src: [
                    '../../app/styles/main.less'
                ],
                dest: '../main/main-build.css',
                options: {
                  compile: true,
                  yuicompress: true,
                  noOverqualifying: false,
                  strictPropertyOrder: false,
                  noUnderscores: false,
                  noUniversalSelectors: false,
                  prefixWhitespace: false,
                  noIDs: false

                }
            }
        },
        requirejs: {
            dir: '../main',
            appDir: "../../app",
            baseUrl: "js",
            paths: {
                lib: '../../lib',
                jquery: 'empty:',
                underscore: "../../lib/underscore",
                moment: "../../lib/moment",
                signals: "../../lib/signals",
                hasher: "../../lib/hasher",
                crossroads: "../../lib/crossroads"
            },
            shim: {
                underscore: {
                    exports: '_'
                },
                moment: {},
                signals: {}
            },
            optimize: "uglify",
            findNestedDependencies: true,
            out: "../main/main-build.js",
            modules: [
                {
                    name: "main"
                }
            ]
        }
    });

    // Default task.
    //grunt.registerTask('default', 'less requirejs');
    grunt.registerTask('default', 'requirejs');
    //grunt.loadNpmTasks('grunt-less');
    grunt.loadNpmTasks('grunt-requirejs');
};
