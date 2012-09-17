// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview The main class for the application.
 */

'use strict';

require.config({
    baseUrl: 'js/',
    paths: {
        lib: "../lib",
        jquery: "../lib/jquery",
        underscore: "../lib/underscore",
        moment: "../lib/moment",
        kendo: "../lib/kendo.all",
        signals: "../lib/signals",
        hasher: "../lib/hasher",
        crossroads: "../lib/crossroads",
        "underscore.string": "../lib/underscore.string",
        cordova: "../cordova",
        jautosize: "../lib/jquery.autosize",
        jmousewheel: "../lib/jquery.mousewheel",
        jform: "../lib/jquery.form",
        jfilereader: "../lib/jquery.FileReader",
        jmaskmoney: "../lib/jquery.maskMoney",
        jscrollpane: "../lib/jquery.jScrollPane",
        jtooltip: "../lib/jquery.tooltip.min",
        jui: "../lib/jquery-ui-1.8.21.core.min",
        noty: "../lib/noty",
        select2: "../lib/select2",
        colorpicker: "ui/colorPicker"
    },
    shim: {
        underscore: {
            exports: '_'
        },
        moment: {},
        kendo: ['jquery'],
        signals: {},
        cordova: {},
        jautosize: ['jquery'],
        jmousewheel: ['jquery'],
        jfilereader: ['jquery'],
        jform: ['jquery'],
        jmaskmoney: ['jquery'],
        jscrollpane: ['jquery'],
        jtooltip: ['jquery'],
        jui: ['jquery'],
        noty: ['jquery'],
        select2: ['jquery'],
        colorpicker: ['jquery']
    }
});

require(["jquery", "widgets/navigator", "db/developer", "db/services", "db/session", "containers/silverlight", "tools", "hasher", "crossroads", "db/models", "kendo", "underscore",
    "lib/userVoice", "moment", "sections/personalSettings", "sections/businessSettings", "sections/usersSettings",
    "sections/dispatcherSettings", "sections/changePassword", "sections/services",
    "sections/routes", "sections/routeDetails", "sections/routeDestinationDetails", "sections/routeTask", "sections/mapView",
    "widgets/serviceDetails"], function ($, Navigator, developer, dbServices, session, silverlight, tools, hasher, crossroads) {
    /**
     * application = The app object.
     * navigator = The navigator object.
     * main = A wrapper for methods that should be exposed throughout the app.
     * initialized = Detects whether the app is being loaded for the first time (useful for refreshing functionality).
     */
    var application, navigator, main = {}, initialized = false;
    window.main = main;

    // Setup Hasher
    hasher.prependHash = '';
    hasher.init();

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
     * @param replace (Optional) If set, it will replace the current hash (and not add it to history).
     */
    main.setHash = function (section, parameters, replace) {
        if (section === null) {
            section = tools.getCurrentSection();
        }

        var query = section ? "view/" + section + ".html?" : "?";
        query += tools.buildQuery(parameters);

        crossroads.resetState();
        if (replace) {
            hasher.replaceHash(query);
        }
        else {
            hasher.setHash(query);
        }
    };

    //Overrides phone's back button navigation - Phonegap
    main.onBack = function () {
        var sectionName = tools.getCurrentSection();
        var section = window[sectionName];

        //if the section overrode the onBack function, trigger it
        //otherwise use the standard history
        if (section && section.onBack) {
            section.onBack();
        } else {
            history.back();
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
        var query = tools.getParameters();
        //if the disableNavigator param is not set to true: setup the navigator
        if (!query.disableNavigator) {
            var frame = developer.CURRENT_FRAME;

            //setup the silverlight div for the proper frames
            if (frame === developer.Frame.SILVERLIGHT || frame === developer.Frame.SILVERLIGHT_PUBLISHED) {
                var silverlightElement = '<div id="silverlightControlHost">' +
                    '<object id="silverlightPlugin" data="data:application/x-silverlight-2," type="application/x-silverlight-2" style="height: 1px; width: 1px">' +
                    '<param name="onSourceDownloadProgressChanged" value="onSourceDownloadProgressChanged"/>';
                if (frame === developer.Frame.SILVERLIGHT) {
                    silverlightElement += '<param name="splashscreensource" value="http://localhost:31820/ClientBin/SplashScreen.xaml"/>' +
                        '<param name="source" value="http://localhost:31820/ClientBin/FoundOps.SLClient.Navigator.xap"/>';
                } else if (frame === developer.Frame.SILVERLIGHT_PUBLISHED) {
                    //TODO centralize blobUrl to developer or dbServices
                    var blobUrl = "http://bp.foundops.com/";
                    silverlightElement += '<param name="splashscreensource" value="' + blobUrl + 'xaps/SplashScreen.xap" />' +
                        '<param name="source" value="' + blobUrl + 'xaps/FoundOps.SLClient.Navigator.xap?ignore=' + developer.SILVERLIGHT_VERSION + '/>';
                }
                silverlightElement +=
                    '<param name="onError" value="onSilverlightError"/>' +
                        '<param name="background" value="#ff333335"/>' +
                        '<param name="windowless" value="true"/>' +
                        '<param name="minRuntimeVersion" value="5.0.61118.0"/>' +
                        '<param name="enableHtmlAccess" value="true"/>' +
                        '<param name="autoUpgrade" value="true"/>' +
                        '<a href="http://go.microsoft.com/fwlink/?LinkID=149156&v=5.0.61118.0" style="text-decoration: none">' +
                        '<img src="http://go.microsoft.com/fwlink/?LinkId=161376" alt="Get Microsoft Silverlight" style="border-style: none"/>' +
                        '</a>' +
                        '</object>' +
                        '<iframe id="_sl_historyFrame" style="visibility: hidden; height: 0; width: 0; z-index: -1; border: 0"></iframe>' +
                        '</div>';

                $(silverlightElement).insertAfter("#remoteContent");
            }

            //setup the navigator
            //navigator = new Navigator(data);
            //navigator.hideSearch();
            $(document).navigator(data);
            $(document).navigator('hideSearch');

            //reset the images 1.5 seconds after loading to workaround a shared access key buy
            _.delay(function () {
                if (navigator) {
                    navigator.changeAvatar(data.avatarUrl);
                    navigator.changeBusinessLogo(session.get("role.businessLogoUrl"));
                }
            }, 1500);
        } else {
            //clear the padding for the navigator if it is disabled
            $("#content").attr("style", "padding:0");
        }
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