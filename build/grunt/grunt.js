/*global module:false*/
module.exports = function (grunt) {
    var _ = require('underscore');

    var version = "0.031",
        mobileOptimizationTags = '<meta name="HandheldFriendly" content="True">\n\t<meta name="MobileOptimized" content="320">\n\t<meta ' + 'name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>\n\t<link ' + 'rel="apple-touch-icon-precomposed" sizes="114x114" href="@@blobRootimg/Icon-96x96.png">\n\t<link rel="apple-touch-icon-precomposed" ' + 'sizes="72x72" href="@@blobRootimg/Icon-72x72.png">\n\t<link rel="apple-touch-icon-precomposed" href="@@blobRootimg/Icon-36x36.png">\n\t<link ' + 'rel="shortcut icon" href="@@blobRootimg/Icon-36x36.png">\n\t<meta name="apple-mobile-web-app-capable" content="yes">\n\t<meta ' + 'name="apple-mobile-web-app-status-bar-style" content="black">\n\t<script>' + '(function(a,b,c){if(c in b&&b[c]){var d,e=a.location,f=/^(a|html)$/i;a.addEventListener("click",function(a){d=a.target;' + 'while(!f.test(d.nodeName))d=d.parentNode;"href"in d&&(d.href.indexOf("http")||~d.href.indexOf(e.host))&&(a.preventDefault(),e.href=d.href)},!1)}})(document,window.navigator,"standalone")</script>';

    //region setup the copy paths
    var mobileCopyPaths = {},
        loginCopyPaths = {},
        mainPath = "C:/FoundOPS/html5/",
        androidPath = mainPath + "build/mobile/Android/assets/www/",
        iOSPath = mainPath + "build/mobile/iOS/www/",
    //11 common destinations (iOS & android)
        destinationPaths = ["js/main-built.js", "styles/main-built.css", "styles/PTS55F.ttf", "styles/styles.less", "lib/", "img/", "view/", "styles/images/", "styles/textures/", "navigator.html", "index.html"],
    //11 common sources (iOS & android)
        sourcePaths = ["build/main/main-built.js", "build/main/main-built.css", "app/styles/PTS55F.ttf", "login/styles/styles.less", "login/lib/*", "app/img/*", "app/view/*", "app/styles/kendo/images/*", "app/styles/kendo/textures/*", "app/navigator-build.html", "login/login.html"],
        i = 0;
    _.each(destinationPaths, function (destinationPath) {
        mobileCopyPaths[androidPath + destinationPath] = mainPath + sourcePaths[i];
        mobileCopyPaths[iOSPath + destinationPath] = mainPath + sourcePaths[i];
        i++;
    });
    //login paths
    loginCopyPaths[androidPath + "img/"] = mainPath + "login/img/*";
    loginCopyPaths[iOSPath + "img/"] = mainPath + "login/img/*";

    //android specific
    mobileCopyPaths[androidPath] = mainPath + "build/mobile/cordova/android/*";
    mobileCopyPaths[androidPath + "childbrowser/"] = mainPath + "build/mobile/cordova/android/childbrowser/*";

    //iOS specific
    mobileCopyPaths[iOSPath] = mainPath + "build/mobile/cordova/iOS/*";
    //endregion


    // Project configuration.
    grunt.initConfig({
        meta: {
            version: version,
            banner: '/*! PROJECT_NAME - v<%= meta.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '* http://foundops.com \n' + '* Copyright (c) <%= grunt.template.today("yyyy") %> ' + 'FoundOps LLC; Copyright */'
        },
        //https://github.com/jharding/grunt-less
        less: {
            all: {
                src: ['../../app/styles/main.less'],
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
            std: {
                almond: true,
                baseUrl: "../../app/js",
                paths: {
                    //root paths
                    lib: "../lib",
                    //libraries
                    colorpicker: "ui/colorPicker",
                    doT: "../lib/doT.min",
                    hasher: "../lib/hasher",
                    kendo: "../lib/kendo.all",
                    jautosize: "../lib/jquery.autosize",
                    jfilereader: "../lib/jquery.FileReader",
                    jform: "../lib/jquery.form",
                    jmaskmoney: "../lib/jquery.maskMoney",
                    jmousewheel: "../lib/jquery.mousewheel",
                    jquery: "../lib/jquery",
                    jscrollpane: "../lib/jquery.jScrollPane",
                    jtooltip: "../lib/jquery.tooltip.min",
                    jui: "../lib/jquery-ui-1.8.21.core.min",
                    moment: "../lib/moment",
                    noty: "../lib/noty",
                    select2: "../lib/select2",
                    signals: "../lib/signals",
                    totango: "../lib/totango",
                    underscore: "../lib/underscore",
                    "underscore.string": "../lib/underscore.string",
                    uservoice: "../lib/userVoice"
                },
                shim: {
                    underscore: {
                        exports: '_'
                    },
                    colorpicker: ['jquery'],
                    hasher: ['signals'],
                    jautosize: ['jquery'],
                    jfilereader: ['jquery'],
                    jform: ['jquery'],
                    jmaskmoney: ['jquery'],
                    jmousewheel: ['jquery'],
                    jscrollpane: ['jquery'],
                    jtooltip: ['jquery'],
                    jui: ['jquery'],
                    kendo: ['jquery'],
                    moment: {},
                    noty: ['jquery'],
                    select2: ['jquery'],
                    uservoice: {},
                    totango: {}
                },
                include: ["main"],
                //cannot wrap or else there will be bugs with external libraries (AKA UserVoice closing bug)
                wrap: false,
                out: "../main/main-built.js"
            }
        },
        //delete the directories before recreating them
        clean: ["C:/FoundOPS/html5/build/main", "C:/FoundOPS/html5/build/mobile/Android/assets/www", "C:/FoundOPS/html5/build/mobile/iOS/www"],
        copy: {
            browser: {
                files: {
                    // Browser files
                    "C:/FoundOPS/html5/build/main/login/": "../../login/**",
                    "C:/FoundOPS/html5/build/main/img/": "C:/FoundOPS/html5/app/img/*",
                    "C:/FoundOPS/html5/build/main/navigator.html": "../../app/navigator-build.html",
                    "C:/FoundOPS/html5/build/main/map.css": "../../app/styles/map.css"
                }
            },
            login: {
                files: loginCopyPaths
            },
            mobile: {
                files: mobileCopyPaths
            }
        },
        replace: {
            browser: {
                files: {
                    "C:/FoundOPS/html5/build/main/navigator.html": "C:/FoundOPS/html5/build/main/navigator.html",
                    "C:/FoundOPS/html5/build/main/login/login.html": "C:/FoundOPS/html5/build/main/login/login.html"
                },
                options: {
                    variables: {
                        mobileOptimization: mobileOptimizationTags,
                        blobRoot: "@Model['BlobRoot']../",
                        CSSblobRoot: "@Model['BlobRoot']main-built.css?cb=" + version,
                        JSblobRoot: "@Model['BlobRoot']main-built.js?cb=" + version,
                        cordova: '',
                        appLocation: '"http://app.foundops.com"'
                    }
                }
            },
            android: {
                files: {
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/navigator.html": "C:/FoundOPS/html5/build/mobile/Android/assets/www/navigator.html",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/index.html": "C:/FoundOPS/html5/build/mobile/Android/assets/www/index.html"
                },
                options: {
                    variables: {
                        mobileOptimization: mobileOptimizationTags,
                        blobRoot: "",
                        CSSblobRoot: "styles/main-built.css",
                        JSblobRoot: "js/main-built.js",
                        cordova: '<script type="text/javascript" charset="utf-8" src="cordova-2.1.0.js"></script>\n' + '<script type="text/javascript" charset="utf-8" src="statusbarnotification.js"></script>\n' + '<script type="text/javascript" charset="utf-8" src="childbrowser.js"></script>',
                        appLocation: '"navigator.html"'
                    }
                }
            },
            iOS: {
                files: {
                    "C:/FoundOPS/html5/build/mobile/iOS/www/navigator.html": "C:/FoundOPS/html5/build/mobile/iOS/www/navigator.html",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/index.html": "C:/FoundOPS/html5/build/mobile/iOS/www/index.html"
                },
                options: {
                    variables: {
                        mobileOptimization: mobileOptimizationTags,
                        blobRoot: "",
                        CSSblobRoot: "styles/main-built.css",
                        JSblobRoot: "js/main-built.js",
                        cordova: '<script type="text/javascript" charset="utf-8" src="cordova-2.1.0.js"></script>',
                        appLocation: '"navigator.html"'
                    }
                }
            }
        }
    });

    //Order of loadNpmTasks is important.
    grunt.registerTask('default', 'clean less requirejs copy replace'); //watch
    grunt.loadNpmTasks('grunt-contrib');
    grunt.loadNpmTasks('grunt-less');
    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-replace');
};