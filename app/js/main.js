require.config({
    baseUrl: 'js',
    paths: {
        lib: "../lib"
    }
});

require(["containers/navigator", "lib/kendo.all.min", "view/silverlight"], function (Navigator) {
    //setup the navigator
    var n = new Navigator(window.initializeConfig);
    n.hideSearch();

    //for debugging navigator
    // var application = new kendo.mobile.Application($("#content"), { initial: "view/testContent.html"});

    //for release

    //setup page tracking
    try {
        var pageTracker = window._gat._getTracker("UA-25857232-1");
        pageTracker._initData();
        pageTracker._trackPageview();
        function trackEvent(section, action, label) {
            pageTracker._trackEvent(section, action, label);
        }
    }
    catch (err) {
    }

    //initially load silverlight (so it starts loading)
    var application = new kendo.mobile.Application($("#content"), { initial: "home/silverlight"});

//    application.navigate("view/updates.html");
});