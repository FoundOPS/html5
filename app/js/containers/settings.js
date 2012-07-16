// Copyright 2012 FoundOPS LLC. All Rights Reserved.
/**
 * @fileoverview Class to hold settings logic.
 */
'use strict';

require.config({
    waitSeconds: 10,
    baseUrl: 'js',
    paths: {
        // JavaScript folders
        lib: "../lib",
        ui: "ui",
        db: "db",

        // Libraries
        underscore: "../lib/underscore"
    },
    shim: {
        underscore: {
            exports: '_'
        }
    }
});

require(["jquery", "session", "lib/kendo.all.min", "ui/personalSettings", "ui/businessSettings", "ui/usersSettings", "ui/changePassword", "lib/jquery-ui-1.8.21.core.min",
    "lib/cordova", "lib/jquery.FileReader", "lib/swfobject"], function ($, session) {
    var app;
    var settings = {};

    //settings list selector
    var li1 = $('#settingsList li:nth-child(1)');
    var li2 = $('#settingsList li:nth-child(2)');
    var li3 = $('#settingsList li:nth-child(3)');

    //Show all settings if user is admin
    if (session.RoleType === "Administrator") {
        li2.css("display", "block");
        li3.css("display", "block");
    }

    settings.personal = function () {
        app.navigate("views/personalSettings.html");
        li2.removeClass('active');
        li3.removeClass('active');
        li1.addClass('active');
    };
    settings.business = function () {
        app.navigate("views/businessSettings.html");
        li1.removeClass('active');
        li3.removeClass('active');
        li2.addClass('active');
    };
    settings.users = function () {
        app.navigate("views/usersSettings.html");
        li1.removeClass('active');
        li2.removeClass('active');
        li3.addClass('active');
    };
    settings.changePassword = function () {
        app.navigate("views/changePassword.html");
    };

    window.settings = settings;

    //Start the application
    app = new kendo.mobile.Application($(document.body), {initial: "views/personalSettings.html"});
});