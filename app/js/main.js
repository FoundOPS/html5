require.config({
    baseUrl: 'js',
    paths: {
        lib: "../lib"
    }
});

require(["containers/navigator", "lib/kendo.all.min"], function (Navigator) {
    //setup the navigator
    var n = new Navigator(window.initializeConfig);
    n.hideSearch();

    //setup the application
    new kendo.mobile.Application($("#content"), { initial: "view/testContent.html"});
});