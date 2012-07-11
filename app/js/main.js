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

    //whenever a section is chosen, choose it in the silverlight app
    $(document).on("sectionSelected", function(e, section){
        silverlight.plugin.navigationVM.NavigateToView(section.name);
    });

    //whenever a role is changed, choose it in the silverlight app
    $(document).on("roleSelected", function(e, role){
        silverlight.plugin.navigationVM.ChangeRole(role.id);
    });

    var application = new kendo.mobile.Application($("#remoteContent"), { initial: "view/updates.html"});
    silverlight.show();
//    _.delay(silverlight.show, 3000);
});