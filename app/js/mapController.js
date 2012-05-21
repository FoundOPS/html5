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
goog.require('goog.structs.Map');

goog.require('ops');
goog.require('ops.leaflet');
goog.require('ops.tools');
goog.require('ops.services');
goog.require('ops.ui');

angular.module("ops.map").controller('mapController', function () {
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

    /**
     * Associates routes with colors.
     * @type {ops.tools.ValueSelector}
     */
    var routeColorSelector = new ops.tools.ValueSelector(ops.ui.ITEM_COLORS);

    /**
     * Associates routes with opacities.
     * @type {ops.tools.ValueSelector}
     */
    var routeOpacitySelector = new ops.tools.ValueSelector(ops.ui.ITEM_OPACITIES);

    //the map instance
    var map;

    //keep a reference to the layer groups so they can be cleared from the map when they are redrawn
    /**
     * @type {window.L.LayerGroup}
     */
    var resourcesGroup;
    /**
     * @type {window.L.LayerGroup}
     */
    var routesGroup;
    /**
     * The layer group of track points for the selected route.
     * @type {window.L.LayerGroup}
     */
    var trackPointsGroup;

    /**
     * If it is not null, remove the layer from the map.
     * @param {window.L.LayerGroup} layer
     */
    var removeLayer = function (layer) {
        if (layer != null)
        {
            map.removeLayer(layer);
            layer.clear();
        }
    }

    /**
     * The loaded track points separated by their routeId in ordered arrays of time.
     * The key is the routeId {ops.Guid}.
     * @type {goog.structs.Map}
     */
    var routesTrackPoints = new goog.structs.Map();

    /**
     * @type {goog.date.UtcDateTime}
     */
    var selectedDate;

    /**
     * @type {ops.Guid}
     */
    var selectedRouteId;

    /**
     * Sets the date to the specified date and regenerates the map objects
     * @param {goog.date.UtcDateTime} date
     */
    var setDate = function (date) {
        selectedDate = date;

        //remove all objects from the map
        removeLayer(resourcesGroup);
        removeLayer(routesGroup);
        removeLayer(trackPointsGroup);

        //load the routes for the date

        //center the map the first time routes are loaded after setDate is changed
        var center = true;

        //TODO ROUTES_REFRESH_RATE, load routes for date
        //load routes for the date
        ops.services.getRoutes(function (loadedRoutes) {
            routesGroup = ops.leaflet.drawRoutes(map, loadedRoutes, routeColorSelector, center,
                /**
                 * @param {ops.models.RouteDestination} selectedRouteDestination
                 */
                    function (selectedRouteDestination) {
                    setSelectedRoute(selectedRouteDestination.routeId);
                });
            center = false;
        });

        //load the

        //TODO RESOURCES_REFRESH_RATE
        //if the date is today: load the resources with latest points
        if (ops.dateEqual(date, new goog.date.UtcDateTime())) {
            ops.services.getResourcesWithLatestPoints(function (resourcesWithLatestPoints) {
                //keep track of any tracked resources for the selected route
                //so they can be drawn individually
                var resourcesForSelectedRoute = [];

                for (var r in resourcesWithLatestPoints) {
                    var resourceWithLastPoint = resourcesWithLatestPoints[r];

                    if (selectedRouteId == resourceWithLastPoint.id)
                        resourcesForSelectedRoute.push(resourceWithLastPoint);

                    //find the loaded track points for the route, and add this
                    var routeTrackPoints = routesTrackPoints.get(resourceWithLastPoint.routeId);
                    if (routeTrackPoints && routeTrackPoints != ops.services.Status.LOADING)
                        routeTrackPoints.push(resourceWithLastPoint);
                }

                //draw the new track points for the selected route
                resourcesGroup.add(ops.leaflet.drawResources(resourcesForSelectedRoute));
            });
        }
    };

    /**
     * Sets the selected route.
     * @param {ops.Guid} routeId
     */
    var setSelectedRoute = function (routeId) {
        //remove track points from the map
        removeLayer(trackPointsGroup);
        selectedRouteId = routeId;

        var routeTrackPoints = routesTrackPoints.get(selectedRouteId);
        //if the track points are loading, return
        if (routeTrackPoints == ops.services.Status.LOADING)
            return;

        //if the track points are loaded draw them
        if (routeTrackPoints) {
            trackPointsGroup = ops.leaflet.drawTrackPoints(routeTrackPoints);
        }
        //if they are not loaded: load them then draw them
        else {
            routeTrackPoints.set(selectedRouteId, ops.services.Status.LOADING);

            ops.services.getTrackPoints(selectedDate, routeId, function (loadedTrackPoints) {
                //add the loaded track points to the map
                loadedTrackPoints.set(selectedRouteId, loadedTrackPoints);

                //draw the track points if the selected route is still
                //the loaded track points
                if (selectedRouteId == routeId) {
                    removeLayer(trackPointsGroup);
                    trackPointsGroup = ops.leaflet.drawTrackPoints(loadedTrackPoints);
                }
            });
        }
    };

    /**
     * Store the initialization logic in one place.
     */
    var initialize = function () {
        //setup an empty map
        map = ops.leaflet.setupMap();

        //when the map is clicked deselect the route and
        //remove the route's TrackPoints from the map
        map.on('click', function () {
            //a) deselect the route
            selectedRouteId = null;

            //b) remove the route's TrackPoints from the map
            removeLayer(trackPointsGroup);
        });

        //get/add the service provider's depot(s) to the map
        ops.services.getDepots(function (loadedDepots) {
            ops.leaflet.drawDepots(map, loadedDepots);
        });

        //set the date to today
        setDate(new goog.date.UtcDateTime());
    };
    initialize();
//#endregion
})
;