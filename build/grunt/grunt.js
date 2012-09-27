/*global module:false*/
module.exports = function (grunt) {
    var buildTypes = {
        iOS: 0,
        android: 1,
        browser: 2
    };

    // String to be used in replace function.
    var mobileOptimizationTags = '<meta name="HandheldFriendly" content="True">\n\t<meta name="MobileOptimized" content="320">\n\t<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>\n\t<link rel="apple-touch-icon-precomposed" sizes="114x114" href="@@blobRootimg/Icon-96x96.png">\n\t<link rel="apple-touch-icon-precomposed" sizes="72x72" href="@@blobRootimg/Icon-72x72.png">\n\t<link rel="apple-touch-icon-precomposed" href="@@blobRootimg/Icon-36x36.png">\n\t<link rel="shortcut icon" href="@@blobRootimg/Icon-36x36.png">\n\t<meta name="apple-mobile-web-app-capable" content="yes">\n\t<meta name="apple-mobile-web-app-status-bar-style" content="black">\n\t<script>(function(a,b,c){if(c in b&&b[c]){var d,e=a.location,f=/^(a|html)$/i;a.addEventListener("click",function(a){d=a.target;while(!f.test(d.nodeName))d=d.parentNode;"href"in d&&(d.href.indexOf("http")||~d.href.indexOf(e.host))&&(a.preventDefault(),e.href=d.href)},!1)}})(document,window.navigator,"standalone")</script>';

    var buildType = buildTypes.iOS;
    var version = "0.01";

    var files, replace, cordovaIncludes;
    if (buildType === buildTypes.iOS || buildType === buildTypes.android) {
        files = {
            "C:/FoundOPS/html5/build/mobile/app/js": "C:/FoundOPS/html5/build/main/main-built.js",
            "C:/FoundOPS/html5/build/mobile/app/css": "C:/FoundOPS/html5/build/main/main-built.css",
            "C:/FoundOPS/html5/build/mobile/app/img/": "C:/FoundOPS/html5/app/img/*",
            "C:/FoundOPS/html5/build/mobile/app/view/": "C:/FoundOPS/html5/app/view/*",
            "C:/FoundOPS/html5/build/mobile/app/css/images/": "C:/FoundOPS/html5/app/styles/kendo/images/*",
            "C:/FoundOPS/html5/build/mobile/app/css/textures/": "C:/FoundOPS/html5/app/styles/kendo/textures/*"
        };
        if (buildType === buildTypes.android) {
            files["C:/FoundOPS/html5/build/mobile/app"] = ["C:/FoundOPS/html5/app/login.html", "C:/FoundOPS/html5/app/navigator-build.html"];
            files["C:/FoundOPS/html5/build/mobile/app/"] = ["C:/FoundOPS/html5/build/mobile/cordova/android/*"];
            files["C:/FoundOPS/html5/build/mobile/app/childbrowser/"] = ["C:/FoundOPS/html5/build/mobile/cordova/android/childbrowser/*"];
            cordovaIncludes = '<script type="text/javascript" charset="utf-8" src="cordova-2.1.0.js"></script>\n' +
                                '<script type="text/javascript" charset="utf-8" src="statusbarnotification.js"></script>\n' +
                                '<script type="text/javascript" charset="utf-8" src="childbrowser.js"></script>';
        } else if (buildType === buildTypes.iOS) {
            files["C:/FoundOPS/html5/build/mobile/app"] = ["C:/FoundOPS/html5/app/login.html", "C:/FoundOPS/html5/app/navigator-build.html"];
            files["C:/FoundOPS/html5/build/mobile/app/"] = ["C:/FoundOPS/html5/build/mobile/cordova/iOS/cordova-2.1.0.js"];
            cordovaIncludes = '<script type="text/javascript" charset="utf-8" src="cordova-2.1.0.js"></script>';
        }
        replace = {
            src: ["C:/FoundOPS/html5/build/mobile/app/navigator.html"],
            dest: "C:/FoundOPS/html5/build/mobile/app",
            variables: {
                mobileOptimization: mobileOptimizationTags,
                blobRoot: "",
                CSSblobRoot: "css/main-built.css",
                JSblobRoot: "js/main-built.js",

                cordova: cordovaIncludes
            }
        };
    } else {
        files = {
            "C:/FoundOPS/html5/build/main": "C:/FoundOPS/html5/app/navigator-build.html",
            "C:/FoundOPS/html5/build/main/login": "C:/FoundOPS/html5/login"
        };
        replace = {
            src: ["C:/FoundOPS/html5/build/main/navigator.html"],
            dest: "C:/FoundOPS/html5/build/main",
            variables: {
                mobileOptimization: mobileOptimizationTags,
                blobRoot: '@Model["BlobRoot"]../',
                CSSblobRoot: '@Model["BlobRoot"]main-built.css?cb=' + version,
                JSblobRoot: '@Model["BlobRoot"]main-built.js?cb=' + version,
                cordova: ''
            }
        };
    }


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
                "underscore.string": "../lib/underscore.string",
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
                colorpicker: "ui/colorPicker",
                uservoice: "../lib/userVoice"
            },
            shim: {
                underscore: {
                    exports: '_'
                },
                moment: {},
                kendo: ['jquery'],
                hasher: ['signals'],
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
                colorpicker: ['jquery'],
                uservoice: {}
            },
            include: ["main"],
            wrap: true,
            out: "../main/main-built.js"
        },
        clean: ["C:/FoundOPS/html5/build/mobile/app"],
        copy: {
            dist: {
                files: files,
                options: {
                    processName: function (filename) {
                        if (filename === "login.html") {
                            filename = "index.html";
                        } else if (filename === "navigator-build.html") {
                            filename = "navigator.html";
                        }
                        return filename;
                    }
                }
            }
        },
        replace: {
            dist: replace
        }
    });

    //Must run this first with the bottom three lines commented out
//    grunt.registerTask('default', 'less requirejs');
//    grunt.loadNpmTasks('grunt-less');
//    grunt.loadNpmTasks('grunt-requirejs');

    //Then run this with the above three lines commented out
    grunt.registerTask('default', 'clean copy replace');
    grunt.loadNpmTasks('grunt-contrib');
    grunt.loadNpmTasks('grunt-replace');
};
