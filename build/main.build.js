({
    baseUrl: "../app/js",
    paths: {
        lib: '../lib',
        jquery: 'empty:',
        underscore: "../lib/underscore",
        moment: "../lib/moment"
    },
    shim: {
        underscore: {
            exports: '_'
        },
        moment: {}
    },
    optimize: "uglify",

    name: "main",
    out: "main/main-built.js"
})