// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations list logic.
 */

'use strict';

define(["jquery", "db/services", "db/models", "db/saveHistory", "hasher", "lib/kendo.all"], function ($, dbServices, models, saveHistory, hasher) {
    /**
     * routeDetails = wrapper for all routeDetails objects
     * vm = viewModel
     * serviceDate = Date when service is being performed.
     * intervalId = used to start and stop a route
     * trackPointsToSend = stores the track points that will be sent to the API
     * initialized = Detects whether the view is being loaded for the first time (useful for refreshing functionality).
     */
    var routeDetails = {}, vm = kendo.observable(), serviceDate, intervalId = null, trackPointsToSend = [], initialized = false;
    window.routeDetails = routeDetails;

    routeDetails.vm = vm;

    var onRefresh = function (params) {
        setTimeout(function () {
            var pageRefreshedOn = (main.history[0].slice(main.history[0].indexOf("/") + 1, main.history[0].indexOf(".")));
            if (pageRefreshedOn !== "routes" && pageRefreshedOn !== "routeDetails" && main.history.length === 3) {
                var source = vm.get("routeDestinationsSource")._data;
                var destination;
                for (destination = 0; destination < source.length; destination++) {
                    if (params.routeDestinationId === source[destination].Id) {
                        var e = {};
                        e.dataItem = source[destination];
                        vm.selectRouteDestination(e);
                        break;
                    }
                }
            }
        }, 0);
    };

//region TrackPoint Collection & Management
    /**
     * The configuration object for trackPoint creation.
     * @const
     */
    var TRACKPOINTCONFIG = {
        /**
         * The frequency to collect trackPoints in seconds.
         * @const
         * @type {number}
         */
        TRACKPOINT_COLLECTION_FREQUENCY_SECONDS: 10,

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
                main.DevicePlatform, //TODO: Change to browser detection?
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
                alert("You must enable Geolocation to enable mobile tracking.");
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
//endregion

//region routeDetails Objects
    routeDetails.initialize = function () {
        main.route.matched.add(function (section, query) {
            if (section !== "routeDetails") {
                return;
            }
            vm.getDestinations(query);
        });
        onRefresh(main.parseURLParams(main.history[0]));
    };
    routeDetails.show = function () {
        main.parseHash();

        saveHistory.close();

        if (!initialized) {
            // Routes has not been opened yet, so jump there
            if (!vm.get("selectedRoute")) {
                hasher.setHash("view/routes.html");
                return;
            }
            initialized = true;
        }
        kendo.bind($("#routeDetails"), vm, kendo.mobile.ui);
    };
//endregion

//region VM Objects
    /**
     * Sets up the route destinations data source.
     */
    vm.getDestinations = function (query) {
        var route;
        var source = routes.vm.get("routesSource");
        if (source) {
            for (route in source._data) {
                if (query.routeId === source._data[route].Id) {
                    vm.set("selectedRoute", source._data[route]);
                }
            }

            /**
             * A kendo data source for the current user's selected route.
             * @type {kendo.data.DataSource}
             */
            vm.set("routeDestinationsSource",
                new kendo.data.DataSource({
                    data: vm.get("selectedRoute.RouteDestinations")
                }));
        }
    };
    /**
     * Select a route destination
     * @param e The event args from a list view click event (the selected Destination)
     */
    vm.selectRouteDestination = function (e) {
        vm.set("selectedDestination", e.dataItem);

        var params = {routeId: vm.get("selectedRoute.Id"), routeDestinationId: vm.get("selectedDestination.Id")};
        main.setHash("routeDestinationDetails", params);
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
        }, TRACKPOINTCONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
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
//endregion
});