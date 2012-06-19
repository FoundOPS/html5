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

require(["jquery", "lib/kendo.all.min", "lib/cordova-1.8.1", "developer", "db/services", "db/models"], function ($, k, c, developer, services, models) {
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
        //set the OS of the device running the app
        mobile.CONFIG.DEVICE_PLATFORM = device.platform;

        //console.log("Current platform " + device.platform);
    }

    var app;
    var serviceDate, intervalId = null;
    var trackPointsToSend = [];

    /**
     * Gets the latest trackpoint when called.
     * Then it attempts to push the trackpoint/non-sent trackpoints to the server
     * If successful, it flushes trackPointsToSend
     * @param routeId The routeId of the current trackpoint
     */
    var addPushTrackPoints = function (routeId) {
        var onSuccess = function (position) {
            console.log("Position: " + position.coords.latitude + " " + position.coords.longitude);
            var collectedTime = new Date(position.timestamp);

            var newTrackPoint = new models.TrackPoint(
                position.coords.accuracy,
                collectedTime,
                position.coords.heading,
                position.coords.latitude,
                position.coords.longitude,
                routeId,
                mobile.CONFIG.DEVICE_PLATFORM,
                position.coords.speed
            );
            trackPointsToSend.push(newTrackPoint);

            services.postTrackPoints(trackPointsToSend, routeId, function (e) {
                if (e) {
                    //flush trackpoints if successful
                    trackPointsToSend = [];
                }
            });

        };

        var onError = function (error) {
            console.log("Error Code: " + error.code + '\n' + error.message);
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    };

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
            app.navigate("views/routeDetails.html");
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
        },
        startVisible: true,
        endVisible: false,
        /**
         * Starts collecting and sending trackpoints for the selected route.
         * @param routeId
         */
        startRoute: function () {
            //the viewmodel
            var that = this;

            that.set("startVisible", false);
            that.set("endVisible", true);
            serviceDate = new Date();

            //store the intervalId
            intervalId = window.setInterval(function () {
                addPushTrackPoints(that.get("selectedRoute").Id);
            }, mobile.CONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
        },
        /**
         * Ends the collection of trackpoints for the selected route.
         */
        endRoute: function () {
            this.set("startVisible", true);
            this.set("endVisible", false);

            var date = new Date();

            //stop calling
            clearInterval(intervalId);
            trackPointsToSend = [];
        }
    });

//eventually will be moved to new navigator
    mobile.login = function () {
        var e = $("#email").val();
        var p = $("#pass").val();
        services.authenticate(e, p, function (data) {
            //if this was authenticated refresh routes and navigate to routeslist
            if (data) {
                app.navigate("views/routeList.html");
            } else {
                alert("Login information is incorrect.");
            }
        });
    };

//for development purposes
    mobile.navToRoutesList = function () {
        app.navigate("views/routeList.html");
    };

//set mobile to a global function, so the functions are accessible from the HTML element
    window.mobile = mobile;

//Start the mobile application
    app = new kendo.mobile.Application($(document.body), {});
})
;