// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Controller for the route map.
 *
 * Responsible for displaying the service provider's:
 * a) routes and route destinations
 * b) employees and vehicles (resources) last TrackPoint
 * c) resources historical track points for today
 * These are all dependent on the selectedDate and roleId.
 */

"use strict";

goog.require('goog.date.UtcDateTime');
goog.require('goog.Timer');

goog.require('ops');
goog.require('ops.leaflet');
goog.require('ops.tools');
goog.require('ops.services');
goog.require('ops.ui');

angular.module("ops.map").controller('mapController', function () {
//region Locals

//region Constants

    /**
     * Rate of refreshing resources on the map (in milliseconds)
     * @const
     * @type {number}
     */
    var RESOURCES_REFRESH_RATE = 10000;

    /**
     * Rate of refreshing routes on the map (in milliseconds)
     * @const
     * @type {number}
     */
    var ROUTES_REFRESH_RATE = 30000;

//#endregion

    //region Map Variables

    //the map instance
    var map;

    //keep a reference to the layer groups so they can be cleared from the map when they are redrawn

    /**
     * A map layer for the resources (Employees/Vehicles) and their latest points.
     * @type {window.L.LayerGroup}
     */
    var resourcesGroup;

    /**
     * A map layer for the route's destination markers
     * (and in the future the calculated route's legs).
     * @type {window.L.LayerGroup}
     */
    var routesGroup;

    /**
     * A map layer for the TrackPoints of the selected route.
     * @type {window.L.LayerGroup}
     */
    var trackPointsGroup;

    //endregion

    /**
     * Associates the routes with colors.
     * @type {ops.tools.ValueSelector}
     */
    var routeColorSelector = new ops.tools.ValueSelector(ops.ui.ITEM_COLORS);

    /**
     * Associates the routes with opacities.
     * @type {ops.tools.ValueSelector}
     */
    var routeOpacitySelector = new ops.tools.ValueSelector(ops.ui.ITEM_OPACITIES);

    /**
     * The selected route's Id.
     * @type {ops.Guid}
     */
    var selectedRouteId;

    /**
     * A list to keep track of which routes have been loaded
     * @type {Array.<ops.Models.Route>}
     */
    var loadedRoutes;

    /**
     * The resources (employees and vehicles) and their latest location.
     * @type {Array.<Object>}
     */
    var resources;

    /**
     * Historical track points.
     * @type {Array.<Object>}
     */
    var mapTrackPoints = [];

    //#endregion

//region Logic

    //setup an empty map
    map = ops.leaflet.setupMap();

    //when the map is clicked
    //a) deselect the route
    //b) remove the route's TrackPoints from the map
    map.on('click', function () {
        //a) deselect the route
        selectedRouteId = null;

        //b) remove the route's TrackPoints from the map
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);
    });

    //get/add the service provider's depot(s) to the map
    ops.services.getDepots(function (loadedDepots) {
        ops.leaflet.drawDepots(map, loadedDepots);
    });

    /**
     * Adds trackpoints to the list of historical trackpoints
     * @param {Array.<object>} trackpoints
     */
    var addTrackpoints = function (trackpoints) {
        /** Add given trackpoints to the list of trackpoints */
        for (var t in trackpoints) {
            mapTrackPoints.push(trackpoints[t]);
        }
        /** Order the trackpoints by time */
        mapTrackPoints = Enumerable.From(mapTrackPoints).OrderBy(
            function (item) {
                return item.CollectedTimeStamp;
            }).ToArray();
        /** Check if a route is selected */
        if (selectedRouteId) {
            /** Draw the trackpoints on the map */
            drawHistoricalTrackPoints(selectedRouteId);
        }
    };

    /**
     * Sets the date to the specified date and regenerates the map objects
     * @param {goog.date.UtcDateTime} date
     */
    var setDate = function (date) {

        //remove all objects from the map
        if (resourcesGroup != null)
            map.removeLayer(resourcesGroup);
        if (routesGroup != null)
            map.removeLayer(routesGroup);
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);

        //clear the trackpoints and selected routes
        mapTrackPoints = [];
        loadedRoutes = [];

        //load the routes for the date

        //center the map the first time routes are loaded after setDate is changed
        var center = true;

        //TODO ROUTES_REFRESH_RATE
//        //remove the previous routes
//        if (routesGroup != null)
//            map.removeLayer(routesGroup);
        ops.services.getRoutes(function (loadedRoutes) {
            var onDestinationSelected = function (selectedRouteDestination) {
                setSelectedRoute(selectedRouteDestination.RouteId);
            };

            routesGroup = ops.leaflet.drawRoutes(map, loadedRoutes, routeColorSelector, center, onDestinationSelected);
            center = false;
        });

        //load the locations of the resources only if the date is today
        //TODO RESOURCES_REFRESH_RATE
        if (date.getUTCDay() == new goog.date.UtcDateTime().getUTCDate()) {
            ops.services.getResourcesWithLatestPoints(function (resourcesWithLatestPoints) {
                /** Remove the previous resources */
                if (resourcesGroup != null) {
                    map.removeLayer(resourcesGroup);
                }
                resourcesGroup = ops.leaflet.drawResources(resourcesWithLatestPoints);

                /**
                 * An array of trackpoints
                 * @type {Array.<Object>}
                 */
                var trackPointCollection = [];
                for (var r in resources) {
                    var resourceId;
                    if (resources[r].EmployeeId != null) {
                        resourceId = resources[r].EmployeeId;
                    } else {
                        resourceId = resources[r].VehicleId;
                    }
                    /** Create a trackpoint object
                     * @type {Object.<string, number>}
                     */
                    var trackpoint = new Object({
                        Latitude:resources[r].Latitude,
                        Longitude:resources[r].Longitude,
                        RouteId:resources[r].RouteId,
                        Id:resourceId,
                        CollectedTimeStamp:"/Date(" + new Date().getTime() + ")/"
                    });
                    trackPointCollection.push(trackpoint);
                }
                addTrackpoints(trackPointCollection);
            });
        }
    };

    /** Set the date to today. */
    setDate(new Date());

    /**
     * Generates a compass direction from rotation degrees
     * @param {string} routeId
     */
    var setSelectedRoute = function (routeId) {
        /** Remove the previous trackpoints */
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);

        //TODO? Clear the opacity value selector

        /** Update the selected route */
        selectedRouteId = routeId;
        /** Keeps track of whether or not the routeId has already been selected
         * @type {boolean}
         */
        var isRouteLoaded;
        for (var r in loadedRoutes) {
            /** Check if the selected route has already been loaded */
            if (loadedRoutes[r] == routeId) {
                /** Draw the trackpoints on the map */
                drawHistoricalTrackPoints(selectedRouteId);
                isRouteLoaded = true;
            }
        }
        if (!isRouteLoaded) {
            /** Get the trackpoints on the map */
            getHistoricalTrackPoints(selectedRouteId);
            addTrackpoints(data);

            /** Add the selected RouteId the the list of selected routes */
            loadedRoutes.push(selectedRouteId);
        }
    };

//#endregion
});