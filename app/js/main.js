require.config({
    baseUrl: 'js',
    paths: {
        lib: "../lib",
        underscore: "../lib/underscore"
    },
    shim: {
        underscore: {
            exports: '_'
        }
    }
});

require(["containers/navigator", "silverlight", "underscore", "lib/kendo.all.min"], function (Navigator, silverlight) {
    //setup page tracking
    try {
        var pageTracker = window._gat._getTracker("UA-25857232-1");
        pageTracker._initData();
        pageTracker._trackPageview();
        window.trackEvent = function (section, action, label) {
            pageTracker._trackEvent(section, action, label);
        };
    }
    catch (err) {
    }

    //setup the navigator
    var n = new Navigator(window.navigatorConfig);
    n.hideSearch();

    $(document).on('click', ".sideBarElement", function(){
        console.log("sideBarElement event fired!: "+$(this));
    });

    var application = new kendo.mobile.Application($("#remoteContent"), { initial: "view/updates.html"});
    silverlight.show();
//    _.delay(silverlight.show, 3000);
});