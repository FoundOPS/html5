/*global module:false*/
module.exports = function (grunt) {
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
                dest: '../main/main-built.css',
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
            almond: true,
            baseUrl: "../../app/js",
            paths: {
                lib: "../lib",
                jquery: "../lib/jquery",
                underscore: "../lib/underscore",
                moment: "../lib/moment",
                kendo: "../lib/kendo.all",
                signals: "../lib/signals",
                hasher: "../lib/hasher",
                crossroads: "../lib/crossroads",
                "underscore.string": "../lib/underscore.string",
                cordova: "../cordova",
                jautosize: "../lib/jquery.autosize",
                jmousewheel: "../lib/jquery.mousewheel",
                jform: "../lib/jquery.form",
                jfilereader: "../lib/jquery.FileReader",
                jmaskmoney: "../lib/jquery.maskMoney",
                jscrollpane: "../lib/jquery.jScrollPane",
                jtooltip: "../lib/jquery.tooltip.min",
                jui: "../lib/jquery-ui-1.8.21.core.min",
                noty: "../lib/noty",
                select2: "../lib/select2",
                colorpicker: "ui/colorPicker"
            },
            include: ["main"],
			wrap: true,
			shim: {
                underscore: {
                    exports: '_'
                },
                moment: {},
                kendo: ['jquery'],
                signals: {},
                cordova: {},
                jautosize: ['jquery'],
                jmousewheel: ['jquery'],
                jfilereader: ['jquery'],
                jform: ['jquery'],
                jmaskmoney: ['jquery'],
                jscrollpane: ['jquery'],
                jtooltip: ['jquery'],
                jui: ['jquery'],
                noty: ['jquery'],
                select2: ['jquery'],
                colorpicker: ['jquery']
            },
            out: "../main/main-built.js"
        }
    });

    // Default task
    grunt.registerTask('default', 'less requirejs');
    //grunt.registerTask('default', 'less');
    //grunt.registerTask('default', 'requirejs');
    grunt.loadNpmTasks('grunt-less');
    grunt.loadNpmTasks('grunt-requirejs');
};
