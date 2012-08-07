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

require(["jquery", "lib/leaflet", "db/developer", "db/services", "tools", "ui/leaflet", "ui/ui"], function ($, l, developer, services, tools, leaflet, ui) {

//region Locals
    /**
     * Rate of refreshing resources on the map (in milliseconds)
     * @const
     * @type {number}
     */
    var RESOURCES_REFRESH_RATE = 10000;

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
    var depotsGroup;
    /**
     * @type {window.L.LayerGroup}
     */
    var resourcesGroup;
    /**
     * @type {window.L.LayerGroup}
     */
    var routesGroup;
    /**
     * @type {window.L.LayerGroup}
     */
    var trackPointsGroup;

    /**
     * @type {Date}
     */
    var selectedDate;

    /**
     * @type {string}
     */
    var selectedRouteId;

    /**
     * The loaded track points.
     * The key is their routeId, the value is an array of the route's trackpoints ordered by time.
     * @type {Array<{string, Array<Object>}>}
     */
    var routesTrackPoints = [];

    /**
     * Associates routes with colors.
     * @type {tools.ValueSelector}
     */
    var routeColorSelector = new tools.ValueSelector(ui.ITEM_COLORS);

    /**
     * Associates routes with opacities.
     * @type {tools.ValueSelector}
     */
    var routeOpacitySelector = new tools.ValueSelector(ui.ITEM_OPACITIES);
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
            var routeTrackPoints = routesTrackPoints[resource.RouteId];
            if (routeTrackPoints && routeTrackPoints != services.Status.LOADING) {
                if (resource.EmployeeId != null) {
                    resource.Id = resource.EmployeeId;
                } else {
                    resource.Id = resource.VehicleId;
                }

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
            trackPointsGroup.addLayer(leaflet.drawTrackPoints(map, newTrackPoints, resources, routeColorSelector, routeOpacitySelector, selectedRouteId));
        }

        resourcesGroup = leaflet.drawResources(map, resources, routeColorSelector,
            /**
             * @param {Object} selectedRoute
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
        var routeTrackPoints = routesTrackPoints[routeId];

        //if the track points are loading, return
        if (routeTrackPoints === services.Status.LOADING) {
            return;
        }

        //if the track points are loaded draw them
        if (routeTrackPoints) {
            trackPointsGroup = leaflet.drawTrackPoints(map, routeTrackPoints, resources, routeColorSelector, routeOpacitySelector, routeId);
        } else {
            //if they are not loaded: load them then draw them
            routesTrackPoints[routeId] = services.Status.LOADING;
            services.getTrackPoints(tools.formatDate(selectedDate), routeId, function (loadedTrackPoints) {
                //if the selected route is the loaded track points, draw them
                if (selectedRouteId === routeId) {
                    removeLayer(trackPointsGroup);
                    trackPointsGroup = leaflet.drawTrackPoints(map, loadedTrackPoints, resources, routeColorSelector, routeOpacitySelector, routeId);
                }

                //add the loaded track points to the map
                routesTrackPoints[routeId] = loadedTrackPoints;
            });
        }
    };

    //load/draw the current service provider's depots
    var getDepots = function () {
        //remove old depot from map
        removeLayer(depotsGroup);
        //check if there is a roleId set
        if (services.RoleId != null) {
            services.getDepots(function (loadedDepots) {
                depotsGroup = leaflet.drawDepots(map, loadedDepots);
            });
        }
    };

    //load/draw the resources with latest points
    var getResources = function () {
        //check if there is a roleId set
        if (services.RoleId != null) {
            //if the date is today: load the resources with latest points
            if (tools.dateEqual(selectedDate, new Date(), true)) {
                services.getResourcesWithLatestPoints(function (resourcesWithLatestPoints) {
                    resources = resourcesWithLatestPoints;
                    drawResources();
                });
                //reload the resources
                setTimeout(function () {
                    getResources();
                }, RESOURCES_REFRESH_RATE);
            }
        }
    };

    //load/draw the routes for the date
    var getRoutes = function () {
        //check if there is a roleId set
        if (services.RoleId != null) {
            services.getRoutes(tools.formatDate(selectedDate), function (loadedRoutes) {
                removeLayer(routesGroup);
                //draw the routes
                routesGroup = leaflet.drawRoutes(map, loadedRoutes, routeColorSelector, center,
                    /**
                     * @param {Object} selectedRoute
                     */
                        function (selectedRoute) {
                        setSelectedRoute(selectedRoute);
                    });
                center = false;

                //if selectedRouteId is set, select that route (now that the routes are loaded)
                if (selectedRouteId)
                    setSelectedRoute(selectedRouteId);
            });
        }
    };

    /**
     * Sets the date to the specified date and regenerates the map objects
     * @param {Date} date
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
        map = leaflet.setupMap();
        //when the map is clicked deselect the route and
        //remove the route's TrackPoints from the map
        map.on('click', function () {
            // deselect the route
            selectedRouteId = null;
            // remove the route's TrackPoints from the map
            removeLayer(trackPointsGroup);
        });

        //set the date to today
        setDate(new Date());
    };
    initialize();

//endregion

    //expose certain functionality to the browser window
    // (so it can be accessed from silverlight)
    var functions = {
        getRoutes: getRoutes,
        setDate: setDate,
        setRoleId: function (roleId) {
            selectedRouteId = null;
            services.setRoleId(roleId);
            getDepots();
            getRoutes();
            getResources();
        },
        setSelectedRoute: setSelectedRoute
    };

    window.map = functions;

    //for debugging
//    functions.setRoleId(developer.GOTGREASE_ROLE_ID);
});