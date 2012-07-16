'use strict';

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

require(["containers/navigator", "silverlight", "ui/personalSettings", "ui/businessSettings", "ui/usersSettings", "underscore", "lib/kendo.all", "lib/userVoice"], function (Navigator, silverlight) {
    //setup the navigator
    var navigator = new Navigator(window.navigatorConfig);
    navigator.hideSearch();
    var application;

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
            //navigate to silverlight to clear the url
            application.navigate("#silverlight");
            silverlight.navigate(section);
        }
    });

    window.onhashchange = function () {
        //Hide the silverlight control when settings is chosen
        if (!location || !location.hash) {
            return;
        }
        if (location.hash.indexOf("Settings") != -1) {
            silverlight.hide();
        }
    };

    //a workaround for opening the importer
    //this is called when the importer view is shown
    window.openImporter = function () {
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
    application = new kendo.mobile.Application($("#remoteContent"), { initial: "view/updates.html"});

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

    //TODO replace with events
    window.personal = function () {
        application.navigate("view/personalSettings.html");
    };
    window.business = function () {
        application.navigate("view/businessSettings.html");
    };
    window.users = function () {
        application.navigate("view/usersSettings.html");
    };
    window.changePassword = function () {
        application.navigate("view/changePassword.html");
    };
});