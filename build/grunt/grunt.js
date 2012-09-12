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
        lint: {
          files: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
        },
        test: {
          files: ['test/**/*.js']
        },
        concat: {
          dist: {
            src: ['<banner:meta.banner>', '<file_strip_banner:lib/FILE_NAME.js>'],
            dest: 'dist/FILE_NAME.js'
          }
        },
        min: {
          dist: {
            src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
            dest: 'dist/FILE_NAME.min.js'
          }
        },
        less: {
          all: {
              src: [
                    '../../app/styles/jquery.jscrollpane.less',
                    '../../app/styles/popup.less',
                    '../../app/styles/main.less'
              ],
              dest: '../main/combined.css',
              options: {
                  compile: true,
                  compress: false,
                  noOverqualifying: false,
                  strictPropertyOrder: false,
                  noUnderscores: false,
                  noUniversalSelectors: false,
                  prefixWhitespace: false,
                  noIDs: false

              }
          }
        },
        watch: {
          files: '<config:lint.files>',
          tasks: 'lint test'
        },
        jshint: {
          options: {
            curly: true,
            eqeqeq: true,
            immed: true,
            latedef: true,
            newcap: true,
            noarg: true,
            sub: true,
            undef: true,
            boss: true,
            eqnull: true
          },
          globals: {}
        },
        uglify: {}
    });

    // Default task.
    grunt.registerTask('default', 'less');

    grunt.loadNpmTasks('grunt-less');

};
