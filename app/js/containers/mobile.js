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
            exports: '_'
        }
    }
});

require(["jquery", "lib/kendo.mobile.min", "developer", "db/services"], function ($, m, developer, services) {
    var mobile = {};
    /**
     * The configuration object for the mobile application.
     * @const
     * @type {Array.<Object>}
     */
    mobile.CONFIG = {
        /**
         * The frequency to collect trackPoints in seconds.
         * @const
         * @type {number}
         */
        TRACKPOINT_COLLECTION_FREQUENCY_SECONDS: 1,

        /**
         * The accuracy threshold that determines whether to record a trackPoint (in meters).
         * @const
         * @type {number}
         */
        ACCURACY_THRESHOLD: 50
    };

    var app;
    var selectedRoute = null;

    var selectRoute = function (route) {
        selectedRoute = route;
        app.navigate("views/routedestinations.html");
    };

    mobile.setupRoutesList = function () {
        $("#routes-listview").kendoMobileListView({
            dataSource: services.routesDataSource,
            pullToRefresh: true,
            selectable: true,
            style: "inset",
            template: $("#routeListViewTemplate").html(),
            click: function (e) {
                selectRoute(e.dataItem);
            }
        });
    };

    mobile.setupRouteDestinationsList = function () {
        $("#routedestinations-listview").kendoMobileListView({
            dataSource: selectedRoute.RouteDestinations,
            selectable: true,
            style: "inset",
            template: $("#routeDestinationsViewTemplate").html()
        });
    };

    //set mobile to a global function, so the functions are accessible from the HTML element
    window.mobile = mobile;

    //Start the mobile application
    app = new kendo.mobile.Application($(document.body), {platform: "ios"});

    //navigate to routes
    app.navigate("views/routes.html");
});