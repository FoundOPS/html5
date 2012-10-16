## Setup ##

1. Install [Node](http://nodejs.org/)
2. Install Grunt globally 
- npm install -g grunt
3. Install Grunt Modules (in grunt folder).
- npm install grunt-requirejs
- npm install grunt-less
- npm install grunt-contrib
- npm install grunt-replace
- npm install grunt-jasmine-runner
4. Install underscore (in grunt folder).
- npm install underscore
5. Install PhantomJS - [Troubleshooting](https://github.com/gruntjs/grunt/blob/master/docs/faq.md#why-does-grunt-complain-that-phantomjs-isnt-installed)
- Download from [here](http://phantomjs.org/download.html).
- Place files anywhere locally.
- Add phantomjs to system Path.
6. Modify jasmine.js
- html5/build/grunt/node_modules/grunt-jasmine-runner/tasks/lib/jasmine.js
- In "`getRelativeFileList()`" add "`.replace(/\\/g,'/')`" to the end of "`path.resolve(file).replace(base,'')`" for windows compatibility.

## Building

	cd C:\FoundOPS\html5\build\grunt
	grunt.cmd

Run test cases

	grunt.cmd jasmine

## Organization

Cordova and it's javascript plugins are kept in `C:\FoundOPS\html5\build\mobile\cordova`

The platform specific plugin code is kept in it's respective platform project (Eclipse, Xcode)