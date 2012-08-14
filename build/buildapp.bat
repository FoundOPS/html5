COPY C:\FoundOPS\ng\app\styles\jquery.jscrollpane.less C:\FoundOPS\ng\app-built\styles
COPY C:\FoundOPS\ng\app\styles\popup.less C:\FoundOPS\ng\app-built\styles
COPY C:\FoundOPS\ng\app\styles\navigator.less C:\FoundOPS\ng\app-built\styles
COPY C:\FoundOPS\ng\app\styles\mobile.css C:\FoundOPS\ng\app-built\styles
COPY C:\FoundOPS\ng\app\styles\kendo.mobile.all.min.css C:\FoundOPS\ng\app-built\styles
COPY C:\FoundOPS\ng\app\styles\kendo.common.min.css C:\FoundOPS\ng\app-built\styles
COPY C:\FoundOPS\ng\app\styles\kendo.default.min.css C:\FoundOPS\ng\app-built\styles
COPY C:\FoundOPS\ng\app\styles\main.less C:\FoundOPS\ng\app-built\styles

PAUSE

:: Convert less to css
cd  ../app-built/styles
CALL lessless
del "*.less"
del "jquery.jscrollpane.css"
del "popup.css"
del "navigator.css"

PAUSE

:: Build the project with requirejs
cd ../../build
node r.js -o app.build.js
cd ..
cd app-built/styles
del "kendo.mobile.all.min.css"
del "kendo.common.min.css"
del "kendo.default.min.css"
del "mobile.css"
del "main.css"

PAUSE