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
        crossroads: "../lib/crossroads",
        "underscore.string": "../lib/underscore.string",
        cordova: "../cordova"
    },
    shim: {
        underscore: {
            exports: '_'
        },
        moment: {},
        signals: {},
        cordova: {}
    }
});

require(["widgets/navigator", "containers/silverlight", "db/session", "tools", "hasher", "crossroads", "db/models", "lib/kendo.all", "underscore",
    "lib/userVoice", "moment", "sections/personalSettings", "sections/businessSettings", "sections/usersSettings",
    "sections/dispatcherSettings", "sections/changePassword", "sections/services",
    "sections/routes", "sections/routeDetails", "sections/routeDestinationDetails", "sections/routeTask", "sections/mapView",
    "widgets/serviceDetails"], function (Navigator, silverlight, session, tools, hasher, crossroads) {
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
        var hash = location.hash;
        if (hash !== "") {
            main.history.push(hash);
        }
        initialized = true;
    }

    // Setup Hasher
    hasher.prependHash = '';
    hasher.init();
    // Listens to changes in the URL's hash and adds them to the history.
    hasher.changed.add(function () {
        main.history.push(hasher.getHash());
    });

    main.route = crossroads.addRoute("view/{section}.html:?query:");
    main.route.greedy = true;

    /**
     * Call this to force calling the parser.\
     */
    main.parseHash = function () {
        //resetting the state forces crossroads to trigger route.matched again on parse
        crossroads.resetState();
        crossroads.parse(hasher.getHash());
    };

    //whenever the hash is changed, parse it with cross roads
    hasher.changed.add(main.parseHash);

    /**
     * Builds a hash for the URL and navigates to it
     * @param section (Optional) If null it will keep the current section
     * @param parameters The parameters to set
     */
    main.setHash = function (section, parameters) {
        if (section == null) {
            section = tools.getCurrentSection();
        }

        var query = section ? "view/" + section + ".html?" : "?";
        query += tools.buildQuery(parameters);

        crossroads.resetState();
        hasher.setHash(query);
    };

    //Overrides phone's back button navigation - Phonegap
    main.onBack = function () {
        var currentView = hasher.getHash().slice(hash.indexOf("/"), hasher.getHash().indexOf("."));
        if (currentView === "routes" || currentView === "routeDetails" || currentView === "routeDestinationDetails" || currentView === "routeTask" || currentView === "changePassword") {
            window[currentView].onBack();
        } else {
            hasher.setHash("view/routes.html");
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
        //check if disableNavigator param exists
        var query = tools.getParameters();
        //if not, create navigator
        if (!query.disableNavigator) {
            navigator = new Navigator(data);
            navigator.hideSearch();
            //TODO disable other sections, disable silverlight
        }

        //reset the images 1.5 seconds after loading to workaround a shared access key buy
        _.delay(function () {
            if (navigator) {
                navigator.changeAvatar(data.avatarUrl);
                navigator.changeBusinessLogo(session.get("role.businessLogoUrl"));
            }
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

        session.setRole(role);

        //reload the current page if it is not on silverlight
        if (hash !== "#silverlight") {
            var hash = hasher.getHash();
            hasher.setHash('');
            _.delay(function () {
                hasher.replaceHash(hash);
            }, 100);
        }
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
    } catch (err) {
    }
});