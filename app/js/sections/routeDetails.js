// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations list logic.
 */

'use strict';

define(["jquery", "db/services", "db/models", "db/saveHistory", "lib/kendo.all"], function ($, dbServices, models, saveHistory) {
    /**
     * routeDetails = wrapper for all routeDetails objects
     * serviceDate = the date for the routes that are acquired form the server
     * intervalId = used to start and stop a route
     * trackPointsToSend = stores the track points that will be sent to the API
     */
    var routeDetails = {}, vm = kendo.observable(), serviceDate, intervalId = null, trackPointsToSend = [];
    window.routeDetails = routeDetails;

    routeDetails.vm = vm;

    /**
     * The configuration object for trackPoint creation.
     * @const
     * @type {Array.<Object>}
     */
    routeDetails.CONFIG = {
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

    /**
     * Gets the latest trackpoint when called.
     * Then it attempts to push the trackpoint/non-sent trackpoints to the server
     * If successful, it flushes trackPointsToSend
     * @param routeId The routeId of the current trackpoint
     */
    var addPushTrackPoints = function (routeId) {
        var onSuccess = function (position) {
            //Add a trackpoint for now in UTC
            var collectedTime = moment.utc().toDate();

            var newTrackPoint = new models.TrackPoint(
                position.coords.accuracy,
                collectedTime,
                position.coords.heading,
                position.coords.latitude,
                position.coords.longitude,
                routeId,
                device.platform, //TODO: Change to browser detection?
                position.coords.speed
            );
            trackPointsToSend.push(newTrackPoint);

            dbServices.postTrackPoints(trackPointsToSend, function (data) {
                if (data) {
                    //flush trackpoints if successful
                    trackPointsToSend = [];
                }
            });

        };

        var onError = function (error) {
            switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("You must accept the Geolocation request to enable mobile tracking.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable at this time.");
                break;
            case error.TIMEOUT:
                alert("The Geolocation request has timed out. Please check your internet connectivity.");
                break;
            default:
                alert("Geolocation information is not available at this time. Please check your Geolocation settings.");
                break;
            }
            vm.endRoute();
        };

        //Phonegap geolocation function
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    };

    $.subscribe("selectedRoute", function (data) {
        vm.set("selectedRoute", data);

        /**
         * A kendo data source for the current user's selected route.
         * @type {kendo.data.DataSource}
         */
        vm.set("routeDestinationsSource",
            new kendo.data.DataSource({
                data: vm.get("selectedRoute.RouteDestinations")
            }));
    });

    var initialized = false;

    routeDetails.show = function () {
        saveHistory.close();

        if (initialized) {
            return;
        }
        initialized = true;

        /**
         * Select a route destination
         * @param e The event args from a list view click event (the selected Destination)
         */
        vm.selectRouteDestination = function (e) {
            vm.set("selectedDestination", e.dataItem);

            localStorage.setItem("selectedDestination", vm.get("selectedDestination.Id"));
            $.publish("selectedDestination", [vm.get("selectedDestination")]);
            application.navigate("view/routeDestinationDetails.html");
        };
        //Dictate the visibility of the startRoute and endRoute buttons.
        vm.set("startVisible", true);
        vm.set("endVisible", false);

        /**
         * Starts collecting and sending trackpoints for the selected route.
         */
        vm.startRoute = function () {
            vm.set("startVisible", false);
            vm.set("endVisible", true);
            serviceDate = new Date();

            //store the intervalId
            intervalId = window.setInterval(function () {
                addPushTrackPoints(routes.vm.get("selectedRoute").Id);
            }, routeDetails.CONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
        };
        /**
         * Ends the collection of trackpoints for the selected route.
         */
        vm.endRoute = function () {
            vm.set("startVisible", true);
            vm.set("endVisible", false);

            //stop calling addPushTrackPoints
            clearInterval(intervalId);
            trackPointsToSend = [];
        };

        kendo.bind($("#routeDetails"), vm, kendo.mobile.ui);
    };

    routeDetails.initialize = function () {
        //routes has not been opened yet, so jump there
        if (!vm.get("selectedRoute")) {
            application.navigate("view/routes.html");
            return;
        }
        setTimeout(function () {
            if (localStorage.getItem("selectedDestination")) {
                var destination;
                for (destination in vm.get("routeDestinationsSource")._data) {
                    if (localStorage.getItem("selectedDestination") === vm.get("routeDestinationsSource")._data[destination].Id) {
                        var e = {};
                        e.dataItem = vm.get("routeDestinationsSource")._data[destination];
                        vm.selectRouteDestination(e);
                    }
                }
            }
        }, 100);
    };
});