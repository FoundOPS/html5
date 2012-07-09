({
    appDir: "../app",
    baseUrl: "js",
    dir: "../buildsnavigator",
    paths: {
        lib: '../lib',
        jquery: 'empty:'
    },
    optimize: "uglify",
    optimizeCss: "standard",
    modules: [
        {
            name: "containers/navigator"
        }
    ]
})