({
    appDir: "../app",
    baseUrl: "js",
    dir: "../builds",
    paths: {
        lib: '../lib',
        jquery: '../lib/jquery',

        // Libraries
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
            name: "containers/map"
        }
    ]
})