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
        moment: "../lib/moment",
        signals: "../lib/signals",
        hasher: "../lib/hasher",
        crossroads: "../lib/crossroads"
    },
    shim: {
        underscore: {
            exports: '_'
        },
        moment: {},
        signals: {}
    }
});

require(["widgets/navigator", "containers/silverlight", "db/session", "hasher", "crossroads", "db/models", "lib/kendo.all", "underscore",
    "lib/userVoice", "moment", "sections/personalSettings", "sections/businessSettings", "sections/usersSettings",
    "sections/dispatcherSettings", "sections/changePassword", "sections/createPassword", "sections/services",
    "sections/routes", "sections/routeDetails", "sections/routeDestinationDetails", "sections/routeTask",
    "widgets/contacts", "widgets/serviceDetails"], function (Navigator, silverlight, session, hasher, crossroads) {
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

    //setup hasher and crossroads

    /**
     * Call this in every view's show method
     */
    main.parseHash = function () {
        crossroads.parse(hasher.getHash());
    };

    hasher.prependHash = '';
    hasher.init();

    main.route = crossroads.addRoute("view/{section}.html:?query:");
    main.route.greedy = true;

    main.setHash = function (section, parameters) {
        var query = "view/" + section + ".html?";

        var first = true;
        _.each(parameters, function (value, key) {
            if (!first) {
                query += "&";
            } else {
                first = false;
            }
            query += key + "=" + value;
        });

        hasher.setHash(query);
    };

    //TODO REFACTOR
    //Overrides phone's back button navigation - Phonegap
    main.onBack = function () {
        var currentHash = window.location.hash, params;
        // Use of substring function allows us to ignore url params to determine app location.
        if (currentHash.substring(0, "#view/updates.html".length) === "#view/updates.html") {
            var r = confirm("Are you sure you would like to log out?");
            if (r) {
                hasher.setHash("view/logout.html");
            }
        } else if (currentHash.substring(0, "#view/routes.html".length) === "#view/routes.html") {
            hasher.setHash("view/updates.html");
        } else if (currentHash.substring(0, "#view/routeDetails.html".length) === "#view/routeDetails.html") {
            main.setHash("routes", params);
        } else if (currentHash.substring(0, "#view/routeDestinationDetails.html".length) === "#view/routeDestinationDetails.html") {
            params = {routeId: routeDetails.vm.get("selectedRoute.Id")};
            main.setHash("routeDetails", params);
        } else if (currentHash.substring(0, "#view/routeTask.html".length) === "#view/routeTask.html") {
            params = {routeId: routeDetails.vm.get("selectedRoute.Id"), routeDestinationId: routeDestinationDetails.vm.get("selectedDestination.Id")};
            /* If user has already selected a status -> go back
             otherwise open the task status popup */
            if (routeTask.vm.statusUpdated) {
                main.setHash("routeDestinationDetails", params);
            } else {
                routeTask.vm.openTaskStatuses("backButton");
            }
        } else if (currentHash.substring(0, "#view/services.html".length) === "#view/services.html") {
            hasher.setHash("view/updates.html");
        } else if (currentHash.substring(0, "#view/personalSettings.html".length) === "#view/personalSettings.html") {
            hasher.setHash("view/updates.html");
        } else if (currentHash.substring(0, "#view/businessSettings.html".length) === "#view/businessSettings.html") {
            hasher.setHash("view/updates.html");
        } else if (currentHash.substring(0, "#view/personalSettings.html".length) === "#view/personalSettings.html") {
            hasher.setHash("view/updates.html");
        } else if (currentHash.substring(0, "#view/usersSettings.html".length) === "#view/usersSettings.html") {
            hasher.setHash("view/updates.html");
        } else if (currentHash.substring(0, "#view/dispatcherSettings.html".length) === "#view/dispatcherSettings.html") {
            hasher.setHash("view/updates.html");
        } else if (currentHash.substring(0, "#view/changePassword.html".length) === "#view/changePassword.html") {
            hasher.setHash("view/personalSettings.html");
        } else if (currentHash.substring(0, "#silverlight".length) === "#silverlight") {
            hasher.setHash("view/updates.html");
            // Reload is necessary when coming from silverlight section.
            document.location.reload();
        }
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
    } catch (err) {
    }

    return main;
});