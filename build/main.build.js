({
    appDir: "../app",
    baseUrl: "js",
    dir: "../builds",
    paths: {
        lib: '../lib',
        jquery: 'empty:'
    },
    optimize: "uglify",
    optimizeCss: "standard",
    modules: [
        {
            name: "main"
        }
    ]
})