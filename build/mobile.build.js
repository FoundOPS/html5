({
    appDir: "../app",
    baseUrl: "js",
    dir: "../buildsmobile",
    paths: {
        // JavaScript folders
        lib: "../lib",
        ui: "ui",
        db: "db",

        // Libraries
        cordova: "../lib/cordova-1.8.1",
        jquery: '../lib/jquery',
        underscore: "../lib/underscore"
    },
    shim: {
        cordova: {
            exports: "c"
        },
        underscore: {
            exports: "_"
        }
    },
    optimize: "uglify",
    optimizeCss: "standard",
    modules: [
        {
            name: "containers/mobile"
        }
    ]
})