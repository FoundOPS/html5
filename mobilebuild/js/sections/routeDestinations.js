// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations list logic.
 */

'use strict';

define(["jquery", "db/services", "db/models", "lib/kendo.all"], function ($, dbServices, models) {
    /**
     * routeDestinations = wrapper for all routeDestinations objects
     * serviceDate = the date for the routes that are acquired form the server
     * intervalId = used to start and stop a route
     * trackPointsToSend = stores the track points that will be sent to the API
     */
    var routeDestinations = {}, vm = kendo.observable(), serviceDate, intervalId = null, trackPointsToSend = [];
    window.routeDestinations = routeDestinations;

    routeDestinations.vm = vm;

    /**
     * The configuration object for trackPoint creation.
     * @const
     * @type {Array.<Object>}
     */
    routeDestinations.CONFIG = {
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
                //application.CONFIG.DEVICE_PLATFORM, TODO: Change to browser detection.
                "Mobile",
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
                console.log("The Geolocation request has timed out. Please check your internet connectivity.");
                break;
            default:
                console.log("Geolocation information is not available at this time. Please check your Geolocation settings.");
                break;
            }
            vm.endRoute();
        };

        //Phonegap geolocation function
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    };

    $.subscribe("selectedRoute", function (data) {
        vm.set("selectedRoute", data);
    });

    routeDestinations.initialize = function () {
        /**
         * A kendo data source for the current user's selected route.
         * @type {kendo.data.DataSource}
         */
        vm.set("routeDestinationsSource",
            new kendo.data.DataSource({
                data: vm.get("selectedRoute.RouteDestinations")
            }));
        //Commented out until new getTaskStatuses is worked out.
//            dbServices.getTaskStatuses(vm.get("selectedRoute").BusinessAccountId, function (response) {
//                vm.set("taskStatusesSource",
//                    new kendo.data.DataSource({
//                        data: response
//                    }));
//            });
        /**
         * Select a route destination
         * @param e The event args from a list view click event (the selected Destination)
         */
        vm.selectRouteDestination = function (e) {
            vm.set("selectedDestination", e.dataItem);

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
            }, routeDestinations.CONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
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
        kendo.bind($("#routeDestinations"), vm, kendo.mobile.ui);
    };

    routeDestinations.show = function () {

    };
});