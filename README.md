#HTML5 — the FoundOPS HTML5 app

This is the FoundOPS javascript application.

TESTING IS ALSO IMPORTANT. TEST INFO HERE.

## Frameworks

The primary CSS frameworks.

[Bootstrap](http://twitter.github.com/bootstrap/) <br/>
[less](http://lesscss.org/)

The module loader we use to organize the project.

[RequireJS](http://requirejs.org/docs/api.html)

A commonly used javascript utility.

[Underscore Docs](http://underscorejs.org/) -
[(the requirejs compatible fork we use)](http://tagneto.blogspot.com/2012/01/amd-support-for-underscore-and-backbone.html)


Kendo controls are used a majority of the time along with the Kendo MVVM framework. When/if kendo support angular's framework, that will be switched over.

[Kendo UI](http://demos.kendoui.com/web/overview/index.html) - [Framework](http://demos.kendoui.com/web/mvvm/index.html)

Mobile specific frameworks:

PhoneGap is used to get access to mobile native functionality.

[PhoneGap](http://phonegap.com/) - [API Docs](http://docs.phonegap.caom)

### Coding Practices

We follow [google's javascript guidelines](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml) and the [jsLint Code Conventions](http://javascript.crockford.com/code.html).

- All javascript MUST BE [annotated for the Google Closure Compiler](https://developers.google.com/closure/compiler/docs/js-for-compiler) (even though we don't use the compiler)

We use [lowerCamelCase](http://c2.com/cgi/wiki?LowerCamelCase) for acronyms, variables, object properties, etc.

## Debugging ##

For Android use [Remote Debugging with Chrome](https://developers.google.com/chrome/mobile/docs/debugging)

The webserver.js is already built to work on the intranet. To mirror the local API server use [TcpTrace](http://www.pocketsoap.com/tcpTrace/)

This was edited with [MarkdownPad](http://markdownpad.com/)

