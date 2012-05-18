#foundOPS-ng — the FoundOPS &lt;angular/&gt; app

This is the FoundOPS javascript application. The primary framework is Angular, this is why the repository is called foundOPS ng.

TESTING IS ALSO IMPORTANT. TEST INFO HERE.

## Frameworks

Angular is the primary framework and it is used whenever possible. Please go through the tutorial.

[Angular](http://angularjs.org/) - [API Docs](http://docs.angularjs.org/api) - [Tutorial](http://docs.angularjs.org/tutorial) - [WebStorm plugin](https://groups.google.com/forum/#!topic/angular/GyBSkDxZN9c)

The primary CSS frameworks.

[Bootstrap](http://twitter.github.com/bootstrap/) <br/>
[less](http://lesscss.org/)

Kendo controls are sprinkled in here and there. The Kendo framework is used when Kendo controls are involved. When/if kendo support angular's framework, that will be switched over. (Do not use the Kendo UI Mobile Widgets.)

[Kendo UI](http://demos.kendoui.com/web/overview/index.html) - [Framework](http://demos.kendoui.com/web/mvvm/index.html)

Mobile specific frameworks:

jQuery mobile UI controls are used for applications designed initially for mobile devices.

[jQuery mobile](http://jquerymobile.com/) - [Demos](http://jquerymobile.com/demos/1.1.0/) - [API Docs](http://docs.jquery.com/Main_Page)

PhoneGap is used to get access to mobile native functionality.

[PhoneGap](http://phonegap.com/) - [API Docs](http://docs.phonegap.caom)

### Coding Practices

We follow [google's javascript guidelines](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml) and the [jsLint Code Conventions}(http://javascript.crockford.com/code.html).

We use [Google's Closure Compiler](https://developers.google.com/closure/compiler/) - [Docs](https://developers.google.com/closure/library/docs/overview) - [API Reference](http://closure-library.googlecode.com/svn/docs/index.html) - [Tutorial](https://developers.google.com/closure/library/docs/tutorial "Tutorial")

- All javascript MUST BE [annotated for the Google Closure Compiler](https://developers.google.com/closure/compiler/docs/js-for-compiler)


We use [lowerCamelCase](http://c2.com/cgi/wiki?LowerCamelCase) for acronyms, variables, object properties, etc.


Compressed via [htmlcompressor](http://code.google.com/p/htmlcompressor/).

Closure Linter: To install easy-install on windows 7-64 bit http://www.lfd.uci.edu/~gohlke/pythonlibs/


## Directory Layout

    app/                --> all of the files to be used in production
      css/              --> css files
        app.css         --> default stylesheet
      img/              --> image files
      index.html        --> app layout file (the main html template file of the app)
      js/               --> javascript files
        controllers.js  --> application controllers
        filters.js      --> custom angular filters
        services.js     --> custom angular services
        widgets.js      --> custom angular widgets
      lib/              --> angular and 3rd party javascript libraries
        angular/..      --> the latest angular js
        jquery/..       --> jQuery 1.7.1, jQuery mobile 1.1.0-rc.1, jQuery Mobile angularJS adapter v1.0.7-rc1
        linq/..         --> linq.js 2.2.0.2
        leaflet.js      --> leaflet-0.3.1
      partials/         --> angular view partials (partial html templates)
        partial1.html
        partial2.html

	mobile/             --> mobile application wrappers
      lib/              --> phonegap and 3rd party native mobile libraries
        phonegap/

    config/jsTestDriver.conf    --> config file for JsTestDriver

    logs/               --> JSTD and other logs go here (git-ignored)

    scripts/            --> handy shell/js/ruby scripts
      test-server.bat   --> starts JSTD server (windows)
      test-server.sh    --> starts JSTD server (*nix)
      test.bat          --> runs all unit tests (windows)
      test.sh           --> runs all unit tests (*nix)
      watchr.rb         --> config script for continuous testing with watchr
      web-server.js     --> simple development webserver based on node.js

    test/               --> test source files and libraries
      e2e/              -->
        runner.html     --> end-to-end test runner (open in your browser to run)
        scenarios.js    --> end-to-end specs
      lib/
        angular/                --> angular testing libraries
          angular-mocks.js      --> mocks that replace certain angular services in tests
          angular-scenario.js   --> angular's scenario (end-to-end) test runner library
          version.txt           --> version file
        jasmine/                --> Pivotal's Jasmine - an elegant BDD-style testing framework
        jasmine-jstd-adapter/   --> bridge between JSTD and Jasmine
        jstestdriver/           --> JSTD - JavaScript test runner
      unit/                     --> unit level specs/tests
        controllersSpec.js      --> specs for controllers

### Running the app during development

_Note: While the javascript is client-side-only technology we recommend hosting the project files using a local
webserver during development to avoid issues with security restrictions (sandbox) in browsers. The
sandbox implementation varies between browsers, but quite often prevents things like cookies, xhr,
etc to function properly when an html page is opened via `file://` scheme instead of `http://`._

You can pick one of these options:

* install node.js and run `scripts/web-server.js`

Then navigate your browser to `http://localhost:<port>/app/index.html` to see the app running in
your browser.

### Running unit tests

We recommend using [jasmine](http://pivotal.github.com/jasmine/) and
[JsTestDriver](http://code.google.com/p/js-test-driver/) for your unit tests/specs, but you are free
to use whatever works for you.

Requires java and a local or remote browser.

* start `scripts/test-server.sh` (on windows: `scripts\test-server.bat`)
* navigate your browser to `http://localhost:9876/`
* click on one of the capture links (preferably the "strict" one)
* run `scripts/test.sh` (on windows: `scripts\test.bat`)


### Continuous unit testing

Requires ruby and [watchr](https://github.com/mynyml/watchr) gem.

* start JSTD server and capture a browser as described above
* start watchr with `watchr scripts/watchr.rb`
* in a different window/tab/editor `tail -f logs/jstd.log`
* edit files in `app/` or `src/` and save them
* watch the log to see updates

There are many other ways to achieve the same effect. Feel free to use them if you prefer them over
watchr.

This was edited with [MarkdownPad](http://markdownpad.com/)

