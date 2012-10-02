/*global module:false*/
module.exports = function (grunt) {

    var version = "0.021",
        mobileOptimizationTags = '<meta name="HandheldFriendly" content="True">\n\t<meta name="MobileOptimized" content="320">\n\t<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>\n\t<link rel="apple-touch-icon-precomposed" sizes="114x114" href="@@blobRootimg/Icon-96x96.png">\n\t<link rel="apple-touch-icon-precomposed" sizes="72x72" href="@@blobRootimg/Icon-72x72.png">\n\t<link rel="apple-touch-icon-precomposed" href="@@blobRootimg/Icon-36x36.png">\n\t<link rel="shortcut icon" href="@@blobRootimg/Icon-36x36.png">\n\t<meta name="apple-mobile-web-app-capable" content="yes">\n\t<meta name="apple-mobile-web-app-status-bar-style" content="black">\n\t<script>(function(a,b,c){if(c in b&&b[c]){var d,e=a.location,f=/^(a|html)$/i;a.addEventListener("click",function(a){d=a.target;while(!f.test(d.nodeName))d=d.parentNode;"href"in d&&(d.href.indexOf("http")||~d.href.indexOf(e.host))&&(a.preventDefault(),e.href=d.href)},!1)}})(document,window.navigator,"standalone")</script>';

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
                //root paths
                lib: "../lib",
                //libraries
                colorpicker: "ui/colorPicker",
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
            wrap: true,
            out: "../main/main-built.js"
        },
        clean: ["C:/FoundOPS/html5/build/mobile/Android/assets/www", "C:/FoundOPS/html5/build/mobile/iOS/www"],
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
                files: {
                    // Android
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/img/": "C:/FoundOPS/html5/login/img/*",
                    // iOS
                    "C:/FoundOPS/html5/build/mobile/iOS/www/img/": "C:/FoundOPS/html5/login/img/*"
                }
            },
            mobile: {
                files: {
                    // Android files
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/js/main-built.js": "C:/FoundOPS/html5/build/main/main-built.js",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/styles/main-built.css": "C:/FoundOPS/html5/build/main/main-built.css",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/styles/PTS55F.ttf": "C:/FoundOPS/html5/app/styles/PTS55F.ttf",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/styles/styles.less": "C:/FoundOPS/html5/login/styles/styles.less", // Login page files
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/lib/": "C:/FoundOPS/html5/login/lib/*", // Login page files
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/img/": "C:/FoundOPS/html5/app/img/*",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/view/": "C:/FoundOPS/html5/app/view/*",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/styles/images/": "C:/FoundOPS/html5/app/styles/kendo/images/*",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/styles/textures/": "C:/FoundOPS/html5/app/styles/kendo/textures/*",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/navigator.html": "C:/FoundOPS/html5/app/navigator-build.html",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/index.html": "C:/FoundOPS/html5/login/login.html",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/": "C:/FoundOPS/html5/build/mobile/cordova/android/*",
                    "C:/FoundOPS/html5/build/mobile/Android/assets/www/childbrowser/": "C:/FoundOPS/html5/build/mobile/cordova/android/childbrowser/*",
                    // iOS Files
                    "C:/FoundOPS/html5/build/mobile/iOS/www/js/main-built.js": "C:/FoundOPS/html5/build/main/main-built.js",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/styles/main-built.css": "C:/FoundOPS/html5/build/main/main-built.css",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/styles/PTS55F.ttf": "C:/FoundOPS/html5/app/styles/PTS55F.ttf",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/styles/styles.less": "C:/FoundOPS/html5/login/styles/styles.less", // Login page files
                    "C:/FoundOPS/html5/build/mobile/iOS/www/lib/": "C:/FoundOPS/html5/login/lib/*", // Login page files
                    "C:/FoundOPS/html5/build/mobile/iOS/www/img/": "C:/FoundOPS/html5/app/img/*",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/view/": "C:/FoundOPS/html5/app/view/*",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/styles/images/": "C:/FoundOPS/html5/app/styles/kendo/images/*",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/styles/textures/": "C:/FoundOPS/html5/app/styles/kendo/textures/*",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/navigator.html": "C:/FoundOPS/html5/app/navigator-build.html",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/index.html": "C:/FoundOPS/html5/login/login.html",
                    "C:/FoundOPS/html5/build/mobile/iOS/www/": "C:/FoundOPS/html5/build/mobile/cordova/iOS/*"
                }
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
                        blobRoot: '@Model["BlobRoot"]../',
                        CSSblobRoot: '@Model["BlobRoot"]main-built.css?cb=' + version,
                        JSblobRoot: '@Model["BlobRoot"]main-built.js?cb=' + version,
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
                        cordova: '<script type="text/javascript" charset="utf-8" src="cordova-2.1.0.js"></script>\n' +
                            '<script type="text/javascript" charset="utf-8" src="statusbarnotification.js"></script>\n' +
                            '<script type="text/javascript" charset="utf-8" src="childbrowser.js"></script>',
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

    //Must run this first with the bottom three lines commented out
    //grunt.registerTask('default', 'less requirejs');
    //grunt.loadNpmTasks('grunt-less');
    //grunt.loadNpmTasks('grunt-requirejs');

    //Then run this with the above three lines commented out
    grunt.registerTask('default', 'clean copy replace');
    grunt.loadNpmTasks('grunt-contrib');
    grunt.loadNpmTasks('grunt-replace');
};
