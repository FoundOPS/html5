// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview The main class for the application.
 */

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

require(["widgets/navigator", "containers/silverlight", "db/session", "db/models", "lib/kendo.all", "underscore",
    "lib/userVoice", "lib/pubsub", "sections/personalSettings", "sections/businessSettings", "sections/usersSettings",
    "sections/dispatcherSettings", "sections/changePassword", "sections/createPassword", "sections/services",
    "sections/routes", "sections/routeDestinations", "sections/routeDestinationDetails", "sections/routeTask",
    "widgets/contacts", "widgets/serviceDetails"], function (Navigator, silverlight, session) {
    var application, navigator, main = {};

    main.history = [];

    window.history.

    session.load(function (data) {
        //setup the navigator
        navigator = new Navigator(data);
        navigator.hideSearch();

        //reset the images 1.5 seconds after loading to workaround a shared access key buy
        _.delay(function () {
            navigator.changeAvatar(data.avatarUrl);
            navigator.changeBusinessLogo(session.get("role.businessLogoUrl"));
        }, 1500);
    });

    //TODO make sectionSelected a navigator event
    //whenever a section is chosen, choose it in the silverlight app
    $(document).on("sectionSelected", function (e, section) {
        if (!section.isSilverlight) {
            if (section.name === "Support") {
                UserVoice.showPopupWidget();
            }
        }
        else {
            //navigate to silverlight to clear the url
            application.navigate("#silverlight");
        }

        silverlight.setSection(section);
    });

    //fix problems with console not on IE
    if (typeof window.console === "undefined") {
        window.console = {
            log: function () {
            }
        };
    }

    //TODO make roleSelected a navigator event
    //whenever a role is changed
    //1) clear the previous views
    //2) reload the view (if it is not silverlight)
    //3) set the session's role
    $(document).on("roleSelected", function (e, role) {
        //clear previous views
        $('div[data-role=view]').each(function (i, elem) {
            $(elem).remove();
        });

        //reload the current page if it is not on silverlight
        var hash = location.hash;
        if (hash !== "#silverlight") {
            location.hash = "";
            _.delay(function () {
                location.hash = hash;
            }, 200);
        }

        session.setRole(role);
    });

    //when the silverlight plugin loads hook into the silverlight click events, and hide the navigator popup
    $(silverlight).bind('loaded', function () {
        silverlight.plugin.mainPage.addEventListener("Clicked", function () {
            navigator.closePopup();
        });
    });

    //TODO: Create a version of these functions that are integrated with the navigator.
//    //Overrides device's back button navigation - Phonegap
//    application.onBack = function () {
//        if (window.location.hash === "#view/routes.html") {
//            navigator.logout();
//        } else if (window.location.hash === "#view/routeDestinations.html") {
//            navigateToRoutes();
//        } else if (window.location.hash === "#view/routeDestinationDetails.html") {
//            navigateToRouteDestinations();
//    };
//
//    //Fires when Cordova is ready
//    function onDeviceReady() {
//        //The platform of the device running the app - Phonegap
//        application.CONFIG.DEVICE_PLATFORM = device.platform;
//
//        //Listens for back button being pressed on mobile device - Phonegap
//        document.addEventListener("backbutton", application.onBack, false);
//    }
//
//    //Listens for Cordova to load
//    document.addEventListener("deviceready", onDeviceReady, false);

    //hookup remote loading into remoteContent, by using the kendo mobile application
    window.application = application = new kendo.mobile.Application($("#remoteContent"), { initial: "view/updates.html", platform: "ios"});

    //setup page tracking
    try {
        var pageTracker = window._gat._getTracker("UA-25857232-1");
        pageTracker._initData();
        pageTracker._trackPageview();
        window.trackEvent = function (section, action, label) {
            pageTracker._trackEvent(section, action, label);
        };
    } catch (err) { }
});