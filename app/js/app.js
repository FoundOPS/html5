// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview The main class for the application.
 */

'use strict';

require.config({
    baseUrl: 'js/',
    paths: {
        //root paths
        lib: "vendor"
    }
});

require(["developer", "db/services", "db/session", "tools/parameters", "tools/silverlight", "tools/generalTools", "vendor/hasher", "db/models",
    "sections/settings/personalSettings", "sections/settings/businessSettings", "sections/settings/usersSettings", "sections/settings/dispatcherSettings",
    "sections/settings/changePassword", "sections/settings/privacyPolicy", "sections/settings/termsOfService", "sections/services", "sections/routes", "sections/importerUpload",
    "sections/importerSelect", "sections/importerReview", "sections/routeDetails", "sections/routeDestinationDetails", "sections/routeTask", "sections/mapView",
    "sections/routes", "sections/routeDetails", "sections/routeDestinationDetails", "sections/routeTask", "sections/signature", "sections/mapView",
    "widgets/serviceDetails"], function (developer, dbServices, session, parameters, silverlight, generalTools, hasher) {
    /**
     * application = The app object.
     * navigator = The navigator object.
     * main = A wrapper for methods that should be exposed throughout the app.
     * initialized = Detects whether the app is being loaded for the first time (useful for refreshing functionality).
     */
    var application, main = {};
    window.main = main;

    //setup empty view functions
    (function () {
        var emptySections = ["updates"];

        for (var s in emptySections) {
            var section = emptySections[s];
            window[section] = {
                initialize: function () {
                },
                show: function () {
                }
            };
        }
    })();

    //Overrides phone's back button navigation - Phonegap
    main.onBack = function () {
        var sectionName = parameters.getSection().name;
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
        //Listens for back button being pressed on a mobile device and overrides it.
        document.addEventListener("backbutton", main.onBack, false);
        //Listens for menu button being pressed on a mobile device and overrides it.
        function onMenuKeyPressed() {
            application.navigate('personalSettings');
        }

        document.addEventListener("menubutton", onMenuKeyPressed, false);
    }

    // Listens for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);
//endregion

    session.load(function (data) {
        //setup local view url's
        data.settingsUrl = "#personalSettings";
        for (var s in data.sections) {
            var section = data.sections[s];
            if (!section.isSilverlight) {
                section.url = "#" + section.name.toLowerCase();
            }
        }

        var query = parameters.get();
        //if the disableNavigator param is not set to true: setup the navigator
        if (query.disableNavigator) {
            //clear the padding for the navigator if it is disabled
            $("#content").attr("style", "padding:0");
            return;
        }

        //only show silverlight if the frame is auto and the platform supports it
        if (developer.CURRENT_FRAME !== developer.Frame.DISABLE_SL && !developer.IS_MOBILE) {
            var silverlightElement = '<div id="silverlightControlHost">' +
                '<object id="silverlightPlugin" data="data:application/x-silverlight-2," type="application/x-silverlight-2" style="height: 1px; width: 1px">' +
                '<param name="onSourceDownloadProgressChanged" value="onSourceDownloadProgressChanged"/>';
            if (developer.DEPLOY) {
                //TODO centralize blobUrl to developer or dbServices
                var blobUrl = "http://bp.foundops.com/";
                silverlightElement += '<param name="splashscreensource" value="' + blobUrl + 'xaps/SplashScreen.xaml" />' +
                    '<param name="source" value="' + blobUrl + 'xaps/FoundOps.SLClient.Navigator.xap?ignore=' + developer.CURRENT_SILVERLIGHT_VERSION + '"/>';
            } else {
                //if debugging update version to random
                developer.CURRENT_SILVERLIGHT_VERSION = Math.floor((Math.random() * 1000) + 1);
                silverlightElement += '<param name="splashscreensource" value="http://localhost:31820/ClientBin/SplashScreen.xaml"/>' +
                    '<param name="source" value="http://localhost:31820/ClientBin/FoundOps.SLClient.Navigator.xap?ignore=' + developer.CURRENT_SILVERLIGHT_VERSION + '"/>';
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
        data.enableBackButton = developer.IS_MOBILE;

        $(document).navigator(data);
        $(document).navigator('hideSearch');
        window.statuses = $("#navContainer").statuses({
            undoLast: function () {
                saveHistory.undo(false);
            },
            undoAll: function () {
                saveHistory.undo(true);
            }
        }).data("statuses");

        //reset the images 1.5 seconds after loading to workaround a shared access key bug
        _.delay(function () {
            $(document).navigator('changeAvatar', data.avatarUrl);
            $(document).navigator('changeBusinessLogo', session.get("role.businessLogoUrl"));
        }, 1500);

        if (!parameters.getSection()) {
            var initialSection = {name: developer.IS_MOBILE ? "routes" : "updates" };
            parameters.set({section: initialSection, replace: true});
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
            parameters.set({section: section});
        }
    });

    //fix problems with console not on IE
    if (typeof window.console === "undefined") {
        window.console = {
            log: function () {
            }
        };
    }

    //TODO make roleSelected a navigator event
    //set the the roleId parameter whenever the navigator chooses one
    $(document).on("roleSelected", function (e, role) {
        parameters.setOne("roleId", role.id);
    });

    var firstLoad = true;
    //whenever a role is changed
    //1) clear the previous views
    //2) reload the view (if it is not silverlight)
    parameters.roleId.changed.add(function () {
        //do not clear and reload for the first views
        if (firstLoad) {
            firstLoad = false;
            return;
        }
        //clear previous views
        $('div[data-role=view]').each(function (i, elem) {
            $(elem).remove();
        });

        var currentSection = parameters.getSection();
        //reload the current page: if there is a section (not silverlight)
        if (currentSection && !currentSection.isSilverlight) {
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
            //navigator.closePopup();
            $(document).navigator("closePopup");
        });
    });

    //Hookup remote loading into remoteContent, by using the kendo mobile application
    window.application = application = new kendo.mobile.Application($("#remoteContent"), { platform: "ios"});
});