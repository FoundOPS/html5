// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview The main class for the application.
 */

'use strict';

require.config({
    baseUrl: 'js/',
    paths: {
        lib: "../lib",
        underscore: "../lib/underscore",
        moment: "../lib/moment"
    },
    shim: {
        underscore: {
            exports: '_'
        },
        moment: {}
    }
});

require(["widgets/navigator", "containers/silverlight", "db/session", "db/models", "lib/kendo.all", "underscore",
    "lib/userVoice", "lib/pubsub", "moment", "sections/personalSettings", "sections/businessSettings", "sections/usersSettings",
    "sections/dispatcherSettings", "sections/changePassword", "sections/createPassword", "sections/services",
    "sections/routes", "sections/routeDetails", "sections/routeDestinationDetails", "sections/routeTask",
    "widgets/contacts", "widgets/serviceDetails"], function (Navigator, silverlight, session) {
    var application, navigator, main = {}, initialized = false;

    window.main = main;

    // Array to keep track of the hash changes within the app.
    main.history = [];

    if (!initialized) {
        // App is just being loaded. Set starting location.
        if (location.hash !== "") {
            main.history.push(location.hash);
        }
        initialized = true;
    }

    window.onhashchange = function () {
        main.history.push(location.hash);

        main.history.previousPage = main.history[main.history.length - 2];
        main.history.currentPage = main.history[main.history.length - 1];
        main.history.publish = {"comingFrom": main.history.previousPage, "goingTo": main.history.currentPage};

        $.publish("hashChange", [main.history.publish]);
    };

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
        } else {
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

    //Overrides phone's back button navigation - Phonegap
    main.onBack = function () {
        $('#backButtonContainer').toggleClass("clicked");
        if (window.location.hash === "#view/updates.html") {
            var r = confirm("Are you sure you would like to log out?");
            if (r) { application.navigate("view/logout.html"); }
        } else if (window.location.hash === "#view/routes.html") {
            application.navigate("view/updates.html");
        } else if (window.location.hash === "#view/routeDetails.html") {
            application.navigate("view/routes.html");
        } else if (window.location.hash === "#view/routeDestinationDetails.html") {
            application.navigate("view/routeDetails.html");
        } else if (window.location.hash === "#view/routeTask.html") {
            application.navigate("view/routeDestinationDetails.html");
        } else if (window.location.hash === "#view/personalSettings.html") {
            application.navigate("view/updates.html");
        } else if (window.location.hash === "#view/businessSettings.html") {
            application.navigate("view/updates.html");
        } else if (window.location.hash === "#view/personalSettings.html") {
            application.navigate("view/updates.html");
        } else if (window.location.hash === "#view/usersSettings.html") {
            application.navigate("view/updates.html");
        } else if (window.location.hash === "#view/dispatcherSettings.html") {
            application.navigate("view/updates.html");
        } else if (window.location.hash === "#view/changePassword.html") {
            application.navigate("view/personalSettings.html");
        }
        setTimeout(function () {
            $('#backButtonContainer').toggleClass("clicked");
        }, 100);
    };

    // Fires when Cordova is ready
    function onDeviceReady() {
        main.DevicePlatform = device.platform;
        //Listens for back button being pressed on a mobile device.
        document.addEventListener("backbutton", main.onBack, false);
    }

    // Listens for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);

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