//region Using
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
//endregion

angular.module("ops.map").controller('mapController', function ($defer) {
    //region Locals
    /**
     * Rate of refreshing resources on the map (in milliseconds)
     * @const
     * @type {number}
     */
    var RESOURCES_REFRESH_RATE = 100000;

    /**
     * Rate of refreshing routes on the map (in milliseconds)
     * @const
     * @type {number}
     */
    var ROUTES_REFRESH_RATE = 300000;

    //the map instance
    var map;
    //keep track of whether the map should center when the routes are drawn
    var center;
    //the resources
    var resources;

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
     * @type {goog.date.UtcDateTime}
     */
    var selectedDate;

    /**
     * @type {string}
     */
    var selectedRouteId;

    /**
     * The loaded track points separated by their routeId in ordered arrays of time.
     * The key is the routeId {ops.Guid}.
     * @type {goog.structs.Map}
     */
    var routesTrackPoints = new goog.structs.Map();

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
    //endregion

    //region Methods
    /**
     * If it is not null, remove the layer from the map.
     * @param {window.L.LayerGroup} layer
     */
    var removeLayer = function (layer) {
        if (layer != null) {
            map.removeLayer(layer);
        }
    };

    //draws the resources
    var drawResources = function () {
        //remove the current resources from the map
        removeLayer(resourcesGroup);
        //an array to hold the latest trackpoints to be drawn if there is a route selected
        var newTrackPoints = [];
        var r;
        for (r in resources) {
            var resource = resources[r];
            //find the loaded track points for the route, and add this
            var routeTrackPoints = routesTrackPoints.get(resource.routeId);
            if (routeTrackPoints && routeTrackPoints != ops.services.Status.LOADING) {
                //add current resource to the list of trackpoints
                routeTrackPoints.push(resource);
                //check if a route is currently selected
                if (selectedRouteId) {
                    //the second to last trackpoint(used to know where to start the line)
                    newTrackPoints.push(routeTrackPoints[routeTrackPoints.length - 2]);
                    //the latest trackpoint
                    newTrackPoints.push(resource);
                }
            }
        }
        //draw the new track points if there is a selected route
        if (selectedRouteId) {
            //add the new trackpoints to the current trackpoints group
            trackPointsGroup.addLayer(ops.leaflet.drawTrackPoints(map, newTrackPoints, resources, routeColorSelector, routeOpacitySelector, selectedRouteId));
        }

        resourcesGroup = ops.leaflet.drawResources(map, resources, routeColorSelector,
            /**
             * @param {ops.models.Route} selectedRoute
             */
                function (selectedRoute) {
                setSelectedRoute(selectedRoute);
            });
    };

    /**
     * Gets the trackpoints and draws them on the map
     * @param {string} routeId The Id of the selected route
     */
    var drawTrackpoints = function (routeId) {
        //get the current list of trackpoints
        var routeTrackPoints = routesTrackPoints.get(selectedRouteId);
        //if the track points are loading, return
        if (routeTrackPoints == ops.services.Status.LOADING) {
            return;
        }
        //if the track points are loaded draw them
        if (routeTrackPoints) {
            trackPointsGroup = ops.leaflet.drawTrackPoints(map, routeTrackPoints, resources, routeColorSelector, routeOpacitySelector, routeId);
            //if they are not loaded: load them then draw them
        } else {
            routesTrackPoints.set(selectedRouteId, ops.services.Status.LOADING);
            ops.services.getTrackPoints(ops.tools.formatDate(selectedDate), routeId, function (loadedTrackPoints) {
                //add the loaded track points to the map
                routesTrackPoints.set(selectedRouteId, loadedTrackPoints);
                //draw the track points if the selected route is still
                //the loaded track points
                if (selectedRouteId == routeId) {
                    removeLayer(trackPointsGroup);
                    trackPointsGroup = ops.leaflet.drawTrackPoints(map, loadedTrackPoints, resources, routeColorSelector, routeOpacitySelector, routeId);
                }
            });
        }
    };

    //gets all of the resources
    var getResources = function () {
        //if the date is today: load the resources with latest points
        if (ops.dateEqual(selectedDate, new goog.date.UtcDateTime())) {
            ops.services.getResourcesWithLatestPoints(function (resourcesWithLatestPoints) {
                resources = resourcesWithLatestPoints;
                drawResources();
            });
            //reload the resources
            $defer(function () {
                getResources();
            }, RESOURCES_REFRESH_RATE);
        }
    };

    //load the routes for the date
    var getRoutes = function () {
        ops.services.getRoutes(function (loadedRoutes) {
            removeLayer(routesGroup);
            //draw the routes
            routesGroup = ops.leaflet.drawRoutes(map, loadedRoutes, routeColorSelector, center,
                /**
                 * @param {ops.models.Route} selectedRoute
                 */
                    function (selectedRoute) {
                    setSelectedRoute(selectedRoute);
                });
            center = false;
        });

        /** Reload the routes */
        $defer(function () {
            getRoutes();
        }, ROUTES_REFRESH_RATE);
    };

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
        //center the map the first time routes are loaded after setDate is changed
        center = true;
        //load the routes for the date
        getRoutes();
        //load the resources
        getResources();
    };

    /**
     * Sets the selected route.
     * @param {string} routeId
     */
    var setSelectedRoute = function (routeId) {
        //check if the selected route is already selected
        if (selectedRouteId != routeId) {
            //remove track points from the map
            removeLayer(trackPointsGroup);
            //update the selected route
            selectedRouteId = routeId;
            //get and draw the trackpoints for the selected route
            drawTrackpoints(routeId);
        }
    };

    // Store the initialization logic in one place.
    var initialize = function () {
        //setup an empty map
        map = ops.leaflet.setupMap();

        //when the map is clicked deselect the route and
        //remove the route's TrackPoints from the map
        map.on('click', function () {
            // deselect the route
            selectedRouteId = null;
            // remove the route's TrackPoints from the map
            removeLayer(trackPointsGroup);
        });

        //get and add the service provider's depot(s) to the map
        ops.services.getDepots(function (loadedDepots) {
            ops.leaflet.drawDepots(map, loadedDepots);
        });

        //set the date to today
        setDate(new goog.date.UtcDateTime());
    };
    initialize();
//endregion
});