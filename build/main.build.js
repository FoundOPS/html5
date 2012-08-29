({
    baseUrl: "../app/js",
    paths: {
        lib: '../lib',
        jquery: 'empty:',
        underscore: "../lib/underscore",
        moment: "../lib/moment",
        signals: "../lib/signals",
        hasher: "../lib/hasher",
        crossroads: "../lib/crossroads"
    },
    shim: {
        underscore: {
            exports: '_'
        },
        moment: {},
        signals: {}
    },
    optimize: "uglify",

    name: "main",
    out: "main/main-built.js"
})