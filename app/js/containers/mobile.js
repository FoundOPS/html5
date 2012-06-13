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

require(["jquery", "lib/kendo.all.min", "developer", "db/services"], function ($, m, developer, services) {
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

    var viewModel = kendo.observable({
        routesSource: services.routesDataSource,
        selectedRoute: null,
        selectedDestination: null,
        /**
         * Select a route
         * @param e The event args from a list view click event
         */
        selectRoute: function (e) {
            this.set("selectedRoute", e.dataItem);
            this.set("routeDestinationsSource", new kendo.data.DataSource({data: this.get("selectedRoute").RouteDestinations}));
            app.navigate("views/routeDestinations.html");
        },
        /**
         * Select a route destination
         * @param e The event args from a list view click event
         */
        selectRouteDestination: function (e) {
            this.set("selectedDestination", e.dataItem);
            this.set("routeDestinationDetailsContactInfoSource", new kendo.data.DataSource({data: this.get("selectedDestination").Location.ContactInfoSet}));
            app.navigate("views/routeDestinationDetails.html");
        }
    });

    mobile.setupRouteBindings = function () {
        kendo.bind($("#routes-listview"), viewModel, kendo.mobile.ui);
    };

    mobile.setupRouteDestinationsBindings = function () {
        kendo.bind($("#routeDestinations-listview"), viewModel, kendo.mobile.ui);
    };

    mobile.setupRouteDestinationDetailsBindings = function () {
        kendo.bind($("#navInfo"), viewModel, kendo.mobile.ui);
        kendo.bind($("#routeDestinationDetailsContactInfo-listview"), viewModel, kendo.mobile.ui);
    };


//    mobile.setupRoutesList = function () {
//        $("#routes-listview").kendoMobileListView({
//            dataSource: services.routesDataSource,
//            pullToRefresh: true,
//            selectable: true,
//            style: "inset",
//            template: $("#routeListViewTemplate").html(),
//            click: function (e) {
//                selectRoute(e.dataItem);
//            }
//        });
//    };
//
//    mobile.setupRouteDestinationsList = function () {
//        var dataSource = new kendo.data.DataSource({data: selectedRoute.RouteDestinations});
//
//        $("#routeDestinations-listview").kendoMobileListView({
//            dataSource: dataSource,
//            selectable: true,
//            style: "inset",
//            template: $("#routeDestinationsViewTemplate").html(),
//            click: function (e) {
//                selectDestination(e.dataItem);
//            }
//        });
//    };
//
//    mobile.setupRouteDestinationDetailsList = function () {
//        $('#routeDestinationDetails-listview').kendoMobileListView({
//            dataSource: selectedDestination.Location,
//            selectable: true,
//            style: "inset",
//            template: $("#routeDestinationDetailsViewTemplate").html()
//        });
//    };


    //set mobile to a global function, so the functions are accessible from the HTML element
    window.mobile = mobile;

    //Start the mobile application
    app = new kendo.mobile.Application($(document.body), {});

    //navigate to routes (for development purposes)
    app.navigate("views/routes.html");
});