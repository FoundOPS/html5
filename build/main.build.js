({
    appDir: "../app",
    baseUrl: "js",
    dir: "../builds",
    paths: {
        lib: '../lib',
        jquery: 'empty:',
        underscore: "../lib/underscore"
    },
    shim: {
        underscore: {
            exports: '_'
        }
    },
    optimize: "uglify",
    optimizeCss: "standard",
    modules: [
        {
            name: "main"
        }
    ]
})