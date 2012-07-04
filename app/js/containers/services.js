// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold mobile models/logic.
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
            exports: "_"
        }
    }
});

require(["jquery", "lib/kendo.all.min", "developer", "db/services", "db/models"], function ($, k, developer, dbServices, models) {
    var services = {};

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;

    services.initialize = function () {
        $("#grid").kendoGrid({
            dataSource: dbServices.servicesDataSource()
        });
    };

    //for debugging
    dbServices.setRoleId(developer.GOTGREASE_ROLE_ID);

    //Start the mobile application - must be at the bottom of the code.
    var app = new kendo.mobile.Application($(document.body));
});