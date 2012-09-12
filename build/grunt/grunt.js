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
//        lint: {
//          files: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
//        },
//        test: {
//          files: ['test/**/*.js']
//        },
//        concat: {
//          dist: {
//            src: ['<banner:meta.banner>', '<file_strip_banner:lib/FILE_NAME.js>'],
//            dest: 'dist/FILE_NAME.js'
//          }
//        },
//        min: {
//          dist: {
//            src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
//            dest: 'dist/FILE_NAME.min.js'
//          }
//        },
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
            baseUrl: "../../app/js",
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
            modules: [
                {
                    name: "main"
                }
            ],
            optimize: "uglify",
            findNestedDependencies: true,
            out: "../main/main-built.js"
        }//,
//        watch: {
//          files: '<config:lint.files>',
//          tasks: 'lint test'
//        },
//        jshint: {
//          options: {
//            curly: true,
//            eqeqeq: true,
//            immed: true,
//            latedef: true,
//            newcap: true,
//            noarg: true,
//            sub: true,
//            undef: true,
//            boss: true,
//            eqnull: true
//          },
//          globals: {}
//        },
//        uglify: {}
    });

    // Default task.
    grunt.registerTask('default', 'less requirejs');
    grunt.loadNpmTasks('grunt-less');
    grunt.loadNpmTasks('grunt-requirejs');
};
