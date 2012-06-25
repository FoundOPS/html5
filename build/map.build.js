({
    appDir: "../app",
    baseUrl: "js",
    dir: "../buildsmap",
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