({
    appDir: "../app",
    baseUrl: "js",
    dir: "../mobilebuild",
    paths: {
        // JavaScript folders
        lib: "../lib",

        // Libraries
        underscore: "../lib/underscore",
		jquery: "../lib/jquery"
    },
    shim: {
        underscore: {
            exports: "_"
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