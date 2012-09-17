({
    baseUrl: "../app/js",
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
    optimize: "uglify",

    name: "main",
    out: "main/main-built.js"
})