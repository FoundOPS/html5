({
	appDir: "../app",
    baseUrl: "js",
	dir: "../app-built",
    paths: {
		lib:"../lib",
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
	modules: [
		{
			name: "main"
		}
	],
    optimize: "uglify",
	optimizeCSS: "none"
})