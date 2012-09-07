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

require(["widgets/navigator", "containers/silverlight", "db/session", "tools", "hasher", "crossroads", "db/models", "lib/kendo.all", "underscore",
    "lib/userVoice", "moment", "sections/personalSettings", "sections/businessSettings", "sections/usersSettings",
    "sections/dispatcherSettings", "sections/changePassword", "sections/createPassword", "sections/services",
    "sections/routes", "sections/routeDetails", "sections/routeDestinationDetails", "sections/routeTask",
    "widgets/contacts", "widgets/serviceDetails"], function (Navigator, silverlight, session, tools, hasher, crossroads) {
    /**
     * application = The app object.
     * navigator = The navigator object.
     * main = A wrapper for methods that should be exposed throughout the app.
     * initialized = Detects whether the app is being loaded for the first time (useful for refreshing functionality).
     */
    var application, navigator, main = {}, initialized = false;
    window.main = main;

    // Array to keep track of the hash changes within the app.
    main.history = [];

//region History and navigation objects
    if (!initialized) {
        // App is just being loaded. Set starting location.
        if (location.hash !== "") {
            main.history.push(location.hash);
        }
        initialized = true;
    }

    // Listens to changes in the URL's hash and adds them to the history.
    window.onhashchange = function () {
        main.history.push(location.hash);
    };

    main.route = crossroads.addRoute("view/{section}.html:?query:");
    main.route.greedy = true;

    //setup hasher and crossroads
    crossroads.bypassed.add(function (request) {
        console.log(request);
    });

    // Used to parse the URL on refresh
    main.parseURLParams = function (url) {
        var queryStart = url.indexOf("?") + 1,
            query = url.slice(queryStart),
            params = {},
            param = query.split("&"),
            i;

        for (i = 0; i < param.length; i++) {
            var nameValue = param[i].split("=");
            var name = nameValue[0];
            var value = nameValue[1];
            if (!params.hasOwnProperty(name)) {
                params[name] = value;
            }
        }
        return params;
    };

    /**
     * Call this to force calling the parser.
     * It should be called at least in every view's show method.
     */
    main.parseHash = function () {
        //resetting the state forces crossroads to trigger route.matched again on parse
        crossroads.resetState();
        crossroads.parse(hasher.getHash());
//        console.log("Crossroads.parse:")
//        console.log(crossroads.parse(hasher.getHash()));
//
//        console.log("parseURLParams:");
//        console.log(main.parseURLParams(hasher.getHash()));
    };
    hasher.prependHash = '';
    hasher.init();

    //whenever the hash is changed, parse it with cross roads - this is redundant since main.parseHash() gets called in view's show methods.
//    hasher.changed.add(main.parseHash);

    // Builds a hash for the URL and navigates to it.
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
        crossroads.resetState();
        hasher.setHash(query);
    };

    //TODO REFACTOR
    //Overrides phone's back button navigation - Phonegap
    main.onBack = function () {
        var currentView = window.location.hash.slice(location.hash.indexOf("/") + 1, location.hash.indexOf(".")), params;
        if (currentView === "updates") {
            var r = confirm("Are you sure you would like to log out?");
            if (r) {
                hasher.setHash("view/logout.html");
            }
        } else if (currentView === "routeDetails") {
            hasher.setHash("view/routes.html");
        } else if (currentView === "routeDestinationDetails") {
            params = {routeId: routeDetails.vm.get("selectedRoute.Id")};
            main.setHash("routeDetails", params);
        } else if (currentView === "routeTask") {
            params = {routeId: routeDetails.vm.get("selectedRoute.Id"), routeDestinationId: routeDestinationDetails.vm.get("selectedDestination.Id")};
            /* If user has already selected a status -> go back
             otherwise open the task status popup */
            if (routeTask.vm.statusUpdated) {
                main.setHash("routeDestinationDetails", params);
            } else {
                routeTask.vm.openTaskStatuses("backButton");
            }
        } else if (currentView === "changePassword") {
            hasher.setHash("view/personalSettings.html");
        } else if (currentView === "#silverligh") {
            hasher.setHash("view/updates.html");
            // Reload is necessary when coming from silverlight section.
            document.location.reload();
        } else {
            hasher.setHash("view/updates.html");
        }
    };

//endregion

//region Cordova Objects
    // Fires when Cordova is ready
    function onDeviceReady() {
        main.DevicePlatform = device.platform;
        //Listens for back button being pressed on a mobile device.
        document.addEventListener("backbutton", main.onBack, false);
    }

    // Listens for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);
//endregion

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

    //TODO: Change initial view to routes.html if mobile session (need to look at object getSession returns).
    //Hookup remote loading into remoteContent, by using the kendo mobile application
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