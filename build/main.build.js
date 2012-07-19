({
    baseUrl: "../app/js",
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
    optimizeCss: "none",
	
	name: "main",
	out: "../app/built/main-built.js"
})