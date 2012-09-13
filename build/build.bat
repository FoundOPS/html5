COPY C:\FoundOPS\ng\app\styles\jquery.jscrollpane.less main
COPY C:\FoundOPS\ng\app\styles\popup.less main
COPY C:\FoundOPS\ng\app\styles\navigator.less main
COPY C:\FoundOPS\ng\app\styles\mobile.css main
COPY C:\FoundOPS\ng\app\styles\kendo.mobile.all.min.css main
COPY C:\FoundOPS\ng\app\styles\kendo.common.min.css main
COPY C:\FoundOPS\ng\app\styles\kendo.default.min.css main
COPY C:\FoundOPS\ng\app\styles\main.less main

:: Convert less to css
cd  main
CALL lessless
del "*.less"
del "jquery.jscrollpane.less"
del "popup.less"
del "navigator.less"

:: optimize and combine all the css

node ../r.js -o cssIn=main.css out=main-built.css optimizeCss=standard
del "kendo.mobile.all.min.css"
del "kendo.common.min.css"
del "kendo.default.min.css"
del "mobile.css"
del "main.css"

:: Build the project with requirejs
cd ..
node r.js -o main.build.js 

PAUSE