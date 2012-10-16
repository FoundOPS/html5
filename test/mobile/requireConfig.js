require.config({
    baseUrl: '../../app/js',
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
    }
});