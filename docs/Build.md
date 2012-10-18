## Setup ##

1. Install [Node](http://nodejs.org/)
- Make sure it is in your system path.
2. Run `npm install` from the grunt folder (this works with the package.json file).
- The following are the project dependencies:
 2. grunt (global)
 2. grunt-require
 2. grunt-less
 2. grunt-contrib
 2. grunt-replace
 2. underscore
 2. grunt-jasmine-runner (for testing)
<br/> *Note: Installing packages with a URL requires a tarball URL (Github Repo -> Downloads -> Right click Download as tar.gz -> Copy link address).
3. Install PhantomJS - [Troubleshooting](https://github.com/gruntjs/grunt/blob/master/docs/faq.md#why-does-grunt-complain-that-phantomjs-isnt-installed)
- Download from [here](http://phantomjs.org/download.html).
- Place files anywhere locally.
- Add phantomjs to system Path.
4. Modify jasmine.js
- In html5/build/grunt/node_modules/grunt-jasmine-runner/tasks/lib/jasmine.js
- Find "`getRelativeFileList`" function and replace the `return` statement with 
> `var finalPath = path.resolve(file).replace(base,'').replace(/\\/g,'/');` <br/>
>  `return finalPath.charAt(0) === "/" ? finalPath.substring(1) : finalPath;`

## Building

	cd C:\FoundOPS\html5\build\grunt
	grunt.cmd

Run test cases

	grunt.cmd jasmine-server

* Note: After copying files to grunt directory you must remove require.config from the copied main.js

## Organization

Cordova and it's javascript plugins are kept in `C:\FoundOPS\html5\build\mobile\cordova`

The platform specific plugin code is kept in it's respective platform project (Eclipse, Xcode)