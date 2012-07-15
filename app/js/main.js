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

require(["containers/navigator", "silverlight", "underscore", "lib/kendo.all.min", "lib/userVoice"], function (Navigator, silverlight) {
    //setup the navigator
    var navigator = new Navigator(window.navigatorConfig);
    navigator.hideSearch();

    //TODO make sectionSelected a navigator event
    //whenever a section is chosen, choose it in the silverlight app
    $(document).on("sectionSelected", function (e, section) {
        if (!section.isSilverlight) {
            if (section.name === "Feedback and Support") {
                UserVoice.showPopupWidget();
            }
            else {
                silverlight.hide();
            }
        }
        else {
            silverlight.navigate(section);
        }
    });

    //a workaround for opening the importer
    //this is called when the importer view is shown
    window.openImporter = function(){
        silverlight.navigate("Importer");
    };

    //TODO make roleSelected a navigator event
    //whenever a role is changed, choose it in the silverlight app
    $(document).on("roleSelected", function (e, role) {
        silverlight.setRole(role);
    });

    //when the silverlight plugin loads:
    $(silverlight).bind('loaded', function () {
        //a) hook into the silverlight click events, and hide the navigator popup
        silverlight.plugin.mainPage.addEventListener("Clicked", function () {
            navigator.closePopup();
        });

        //b) set the initial roleId
        silverlight.setRole(window.navigatorConfig.roles[0]);
    });

    //hookup remote loading into remoteContent, by using the kendo mobile application
    var application = new kendo.mobile.Application($("#remoteContent"), { initial: "view/updates.html"});

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
});