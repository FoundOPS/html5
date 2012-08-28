:: Build the project with requirejs
node r.js -o app.build.js

:: Convert less to css
cd  ..
cd app-built/styles
CALL lessless

:: optimize and combine all the css

cd ..
cd ..
node build/r.js -o cssIn=app-built/styles/main.css out=app-built/styles/main-built.css optimizeCss=standard

cd app-built/styles
del "*.less"
del "jquery.jscrollpane.css"
del "popup.css"
del "navigator.css"
del "kendo.metro.min.css"
del "leaflet.css"
del "leaflet.ie.css"
del "map.css"
del "mapIE.css"
del "PTS55F.eot"
::del "select2.css"
del "kendo.mobile.all.min.css"
del "kendo.common.min.css"
del "kendo.default.min.css"
del "mobile.css"
del "main.css"

cd ..
rd /s /q "lib"
mkdir "lib\images"
COPY C:\FoundOPS\ng\app\lib\require-jquery.js C:\FoundOPS\ng\app-built\lib
COPY C:\FoundOPS\ng\app\lib\images C:\FoundOPS\ng\app-built\lib\images

cd js
del "tools.js"
rd /s /q "widgets"
rd /s /q "ui"
rd /s /q "sections"
rd /s /q "db"
rd /s /q "containers"

cd..
del "navigator.html"
ren "navigator-built.html" "navigator.html"
ren "login.html" "index.html"

del "build.txt"
rd /s /q ".idea"

PAUSE