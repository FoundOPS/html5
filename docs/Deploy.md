In "Gruntfile.js" comment / uncomment the 2 places it says too for deploying


Build the application and call the cleanup step (need to manually until yeoman has a [cleanup hook](https://github.com/yeoman/yeoman/issues/258)

`cd C:\yourdirectory  
yeoman build
grunt --config "Gruntfile.js" cleanupDist
`