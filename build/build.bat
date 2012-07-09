:: Build the project with requirejs
node r.js -o main.build.js
:: Convert less to css
cd  ../builds
CALL lessless
PAUSE