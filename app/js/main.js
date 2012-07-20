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

require(["containers/navigator", "silverlight", "session", "lib/kendo.all", "ui/personalSettings", "ui/businessSettings", "ui/usersSettings",
    "ui/changePassword", "ui/createPassword", "underscore", "lib/userVoice"], function (Navigator, silverlight, session) {
    var application, navigator;

    session.get(function (data) {
        //setup the navigator
        navigator = new Navigator(data);
        navigator.hideSearch();

        //set the role
        silverlight.updateRole();
    });

    //TODO make sectionSelected a navigator event
    //whenever a section is chosen, choose it in the silverlight app
    $(document).on("sectionSelected", function (e, section) {
        if (!section.isSilverlight) {
            if (section.name === "Feedback and Support") {
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
    //whenever a role is changed, choose it in the silverlight app
    $(document).on("roleSelected", function (e, role) {
        session.setRole(role);
        silverlight.updateRole();
    });

    //when the silverlight plugin loads hook into the silverlight click events, and hide the navigator popup
    $(silverlight).bind('loaded', function () {
        silverlight.plugin.mainPage.addEventListener("Clicked", function () {
            navigator.closePopup();
        });
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

    window.navigateToPersonal = function () {
        application.navigate("view/personalSettings.html");
    };
    window.navigateToBusiness = function () {
        application.navigate("view/businessSettings.html");
    };
    window.navigateToUsers = function () {
        application.navigate("view/usersSettings.html");
    };
    window.navigateToChangePassword = function () {
        application.navigate("view/changePassword.html");
    };
});