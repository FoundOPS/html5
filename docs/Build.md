## Setup ##

Install Node

Install Grunt globally 

`npm install -g grunt`

[Install PhantomJS](https://github.com/gruntjs/grunt/blob/master/docs/faq.md#why-does-grunt-complain-that-phantomjs-isnt-installed)

## Building

	cd C:\FoundOPS\html5\build\grunt
	grunt.cmd

Run test cases

`grunt.cmd jasmine`

## Organization

Cordova and it's javascript plugins are kept in `C:\FoundOPS\html5\build\mobile\cordova`

The platform specific plugin code is kept in it's respective platform project (Eclipse, Xcode)