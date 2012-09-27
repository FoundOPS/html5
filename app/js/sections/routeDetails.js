// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold a route's route destinations list logic.
 */

'use strict';

define(["sections/linkedEntitySection", "sections/routes", "parameters", "db/services", "db/models"], function (createBase, routes, parameters, dbServices, models) {
    var vm, section = createBase("routeDestinationDetails", "routeDestinationId",
        //on show
        function () {
            var routeDestinations = routes.vm.get("nextEntity.RouteDestinations");

            if (!routeDestinations) {
                parameters.setSection("routes");
                return;
            }

            vm.set("dataSource", new kendo.data.DataSource({
                data: routeDestinations
            }));

            kendo.bind($("#routeDetails"), vm, kendo.mobile.ui);

            //try to move forward
            section._moveForward();
        });

    window.routeDetails = section;
    vm = section.vm;

    section.onBack = function () {
        var query = parameters.get();
        //remove the routeId so it does not jump back here
        delete query.routeId;
        parameters.set(query, true, {name: "routes"});
    };

    /**
     * intervalId = used to start and stop a route
     * trackPointsToSend = stores the track points that will be sent to the API
     */
    var intervalId = null, trackPointsToSend = [], watchId;

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
                kendo.support.detectOS(navigator.userAgent).device,
                position.coords.speed
            );
            // Prevent trackPoint values from being null or undefined.
            if (newTrackPoint.Source && !newTrackPoint.Speed) {
                newTrackPoint.Speed = 0;
            }
            if (!newTrackPoint.Heading) {
                newTrackPoint.Heading = "";
            }
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
        watchId = navigator.geolocation.watchPosition(onSuccess, onError, {timeout: 10000, enableHighAccuracy: true});
    };
//endregion

//vm additions

    //Dictate the visibility of the startRoute and endRoute buttons.
    vm.set("startVisible", true);
    vm.set("endVisible", false);
    /**
     * Starts collecting and sending trackpoints for the selected route.
     */
    vm.startRoute = function () {
        vm.set("startVisible", false);
        vm.set("endVisible", true);

        if (kendo.support.detectOS(navigator.userAgent).device === "android") {
            window.plugins.statusBarNotification.notify("Tracking...", "FoundOPS is tracking your location.");
        } else if (kendo.support.detectOS(navigator.userAgent).device === "iphone" || kendo.support.detectOS(navigator.userAgent).device === "ipad") {
            window.plugins.statusBarNotifier.show("Tracking...", "FoundOPS is tracking your location.");
        }

        //store the intervalId
//        intervalId = window.setInterval(function () {
        addPushTrackPoints(routes.vm.get("nextEntity").Id);
//        }, TRACKPOINTCONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
    };
    /**
     * Ends the collection of trackpoints for the selected route.
     */
    vm.endRoute = function () {
        vm.set("startVisible", true);
        vm.set("endVisible", false);

        //stop calling addPushTrackPoints
        navigator.geolocation.clearWatch(watchId);
//        clearInterval(intervalId);
        trackPointsToSend = [];
    };

    return section;
});