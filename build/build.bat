:: Build the project with requirejs

node r.js -o main.build.js 

:: optimize and combine all the css
node r.js -o cssIn=../app/styles/main.less out=../app/built/main.less

:: Convert less to css
cd  ../app/built
CALL lessless
del "main.less"
PAUSE