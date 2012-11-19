// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold a route's route destinations list logic.
 */

'use strict';

define(["sections/linkedEntitySection", "sections/routes", "tools/parameters", "db/services", "db/models", "tools/analytics", "underscore", "tools/generalTools"],
    function (createBase, routes, parameters, dbServices, models, analytics, _, generalTools) {
    var vm, section = createBase("routeDetails", "routeDestinationDetails", "routeDestinationId",
        //on show
        function () {
            var routeDestinations = routes.vm.get("nextEntity.RouteDestinations");

            if (!routeDestinations) {
                parameters.set({section: {name: "routes"}, replace: true});
                return;
            }

            vm.set("dataSource", new kendo.data.DataSource({
                data: routeDestinations
            }));

            kendo.bind($("#routeDetails"), vm, kendo.mobile.ui);

            //try to move forward
            section._moveForward();

            //refresh the listview to update task status colors
            setTimeout(function () {
                $("#routeDestinations-listview").data("kendoMobileListView").refresh();
            }, 200); //wait until it is initialized
        });

    window.routeDetails = section;
    vm = section.vm;

    section.onBack = function () {
        var query = parameters.get();
        //remove the routeId so it does not jump back here
        delete query.routeId;
        parameters.set({params: query, replace: true, section: {name: "routes"}});
    };

    /**
     * Returns the appropriate color for a route destination's task status.
     * @param destinationId {guid} - A route destination's Id.
     * @return {string} - A hexidecimal color value.
     */
    section.getTaskColor = function (destinationId) {
        var i, j, routeColor;

        var taskStatuses = routes.vm.get("taskStatusesSource").data();
        var routeDestinations = routes.vm.get("nextEntity.RouteDestinations");

        //find the RouteDestination
        for (i = 0; i < routeDestinations.length; i++) {
            if (routeDestinations[i].Id === destinationId) {
                var destination = routeDestinations[i];
                //find the status for the RouteDestination's tasks
                for (j = 0; j < taskStatuses.length; j++) {
                    if (taskStatuses[j].Id === destination.RouteTasks[0].TaskStatusId) {
                        routeColor = taskStatuses[j].Color;
                    }
                }
            }
        }

        return routeColor;
    };

    /**
     * trackPointsToSend = stores the track points that will be sent to the API
     */
    var trackPointsToSend = [], watchId;

//region TrackPoint Collection & Management
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

            dbServices.trackPoints.create({body: trackPointsToSend}).done(function () {
                //flush trackpoints if successful
                trackPointsToSend = [];
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

        if (generalTools.checkPlatform.isAndroid()) {
            window.plugins.statusBarNotification.notify("Tracking...", "FoundOPS is tracking your location.");
        }

        addPushTrackPoints(routes.vm.get("nextEntity").Id);

        analytics.track("Start Route");
    };
    /**
     * Ends the collection of trackpoints for the selected route.
     */
    vm.endRoute = function () {
        vm.set("startVisible", true);
        vm.set("endVisible", false);

        //stop calling addPushTrackPoints
        navigator.geolocation.clearWatch(watchId);
        trackPointsToSend = [];

        analytics.track("End Route");
    };

    return section;
});