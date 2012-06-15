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

require(["jquery", "lib/kendo.all.min", "lib/cordova-1.8.1", "developer", "db/services", "db/models"], function ($, m, c, developer, services, models) {
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

    // Wait for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is ready
    function onDeviceReady() {
        var element = document.getElementById('deviceProperties');

        /**
         * OS of the device running the app.
         */
        mobile.CONFIG.DEVICE_PLATFORM = device.platform;
        console.log("TEST " + device.platform);
    }

    var app;
    var routeId = null, routeInProgress = null;
    var serviceDate, intervalId = null, routeStartTime, routeEndTime, routeTotalTime;
    var trackPoints = [];

    mobile.viewModel = kendo.observable({
        routesSource: services.routesDataSource,
        /**
         * Select a route
         * @param e The event args from a list view click event
         */
        selectRoute: function (e) {
            this.set("selectedRoute", e.dataItem);
            this.set("routeDestinationsSource",
                new kendo.data.DataSource({
                    data: this.get("selectedRoute").RouteDestinations
                }));
            this.set("routeId", this.get("selectedRoute").Id);
            app.navigate("views/routeDestinations.html");
        },
        /**
         * Select a route destination
         * @param e The event args from a list view click event
         */
        selectRouteDestination: function (e) {
            this.set("selectedDestination", e.dataItem);
            this.set("destinationContactInfoSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination").Location.ContactInfoSet
//                    filter: {field: "type", operator: "eq", value: "Phone Number"}
                }));
            app.navigate("views/routeDestinationDetails.html");
        }
    });

//    mobile.setupRouteBindings = function () {
//        kendo.bind($("#routes-listview"), mobile.viewModel, kendo.mobile.ui);
//    };
//
//    mobile.setupRouteDestinationsBindings = function () {
//        kendo.bind($("#routeDestinations-listview"), viewModel, kendo.mobile.ui);
//    };
//
//    mobile.setupRouteDestinationDetailsBindings = function () {
//        kendo.bind($("#destinationDetailsHolder"), viewModel, kendo.mobile.ui);
//        kendo.bind($("#destinationContactInfoListView"), viewModel, kendo.mobile.ui);
//    };

    mobile.startRoute = function (routeId) {
        $('#startButton').hide();
        $('#endButton').show();

        routeInProgress = true;
        serviceDate = new Date();
        routeStartTime = serviceDate.getSeconds();

        intervalId = window.setInterval(function () {
            createTrackPoints(routeId);
        }, mobile.CONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
    };

    mobile.endRoute = function () {
        $('#endButton').hide();
        $('#startButton').show();

        routeInProgress = false;

        var date = new Date();
        routeEndTime = date.getSeconds();
        routeTotalTime = routeEndTime - routeStartTime;

        clearInterval(intervalId);

        trackPoints = [];
    };

    var createTrackPoints = function (routeId) {

        var onSuccess = function (position) {

            console.log("Position: " + position.coords.latitude + " " + position.coords.longitude);

            var newTrackPoint = new models.TrackPoint(
                new Date(position.timestamp),
                position.coords.accuracy,
                position.coords.heading,
                position.coords.latitude,
                position.coords.longitude,
                mobile.CONFIG.DEVICE_PLATFORM,
                position.coords.speed
            );
            trackPoints.push(newTrackPoint);

            services.postTrackPoints(serviceDate, routeId);
        };

        var onError = function (error) {
            alert("Error Code: " + error.code + '\n' + error.message);
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    };

    mobile.login = function () {
        var e = $("#email").val();
        var p = $("#pass").val();
        services.authenticate(e, p, function (data) {
            //if this was authenticated refresh routes and navigate to routeslist
            if (data) {
                app.navigate("#routes");
            } else {
                alert("Wrong login info, manG.");
            }
        });
    };

    //for development purposes
    mobile.navToRoutesList = function () {
        app.navigate("views/routes.html");
    };

    //set mobile to a global function, so the functions are accessible from the HTML element
    window.mobile = mobile;

    //Start the mobile application
    app = new kendo.mobile.Application($(document.body), {});

    //navigate to routes (for development purposes)
//    app.navigate("views/routes.html");
});