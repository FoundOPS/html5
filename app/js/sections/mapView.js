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

define(["db/session", "db/services", "tools/generalTools", "tools/dateTools", "tools/parameters", "ui/leaflet", "ui/ui", "lib/leaflet"], function (session, dbServices, generalTools, dateTools, parameters, leaflet, ui) {
    var mapView = {}, map, center, resources, resourcesGroup, routesGroup, depotsGroup, trackPointsGroup, selectedDate = session.today(), selectedRouteId;
    //region Locals
    /**
     * Rate of refreshing resources on the map (in milliseconds)
     * @const
     * @type {number}
     */
    var RESOURCES_REFRESH_RATE = 10000;

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
    var routeColorSelector = new generalTools.ValueSelector(ui.ITEM_COLORS);

    /**
     * Associates routes with opacities.
     * @type {tools.ValueSelector}
     */
    var routeOpacitySelector = new generalTools.ValueSelector(ui.ITEM_OPACITIES);
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

        _.each(resources, function (resource) {
            //find the loaded track points for the route, and add this
            var routeTrackPoints = routesTrackPoints[resource.RouteId];
            if (routeTrackPoints && routeTrackPoints !== dbServices.Status.LOADING) {
                if (resource.EmployeeId !== null) {
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
        });

        //draw the new track points if there is a selected route
        if (selectedRouteId && trackPointsGroup) {
            //add the new trackpoints to the current trackpoints group
            trackPointsGroup.addLayer(leaflet.drawTrackPoints(map, newTrackPoints, resources, routeColorSelector, routeOpacitySelector, selectedRouteId));
        }

        resourcesGroup = leaflet.drawResources(map, resources, routeColorSelector, function (selectedRoute) {
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
        if (routeTrackPoints === dbServices.Status.LOADING) {
            return;
        }

        //if the track points are loaded draw them
        if (routeTrackPoints) {
            trackPointsGroup = leaflet.drawTrackPoints(map, routeTrackPoints, resources, routeColorSelector, routeOpacitySelector, routeId);
        } else {
            //if they are not loaded: load them then draw them
            routesTrackPoints[routeId] = dbServices.Status.LOADING;

            dbServices.getTrackPoints(routeId, function (loadedTrackPoints) {
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

        dbServices.load.depots().complete(function (loadedDepots) {
            depotsGroup = leaflet.drawDepots(map, loadedDepots);
        });
    };

    //load/draw the resources with latest points
    var getResources = function () {
        //check if there is a roleId set
        //if the date is today: load the resources with latest points
        if (dateTools.dateEqual(selectedDate, new Date(), true)) {
            dbServices.getResourcesWithLatestPoints(function (resourcesWithLatestPoints) {
                resources = resourcesWithLatestPoints;
                drawResources();
            });
            //reload the resources
            setTimeout(function () {
                getResources();
            }, RESOURCES_REFRESH_RATE);
        }
    };

    //load/draw the routes for the date
    var getRoutes = function () {
        //check if there is a roleId set
        dbServices.getRoutes(selectedDate, function (loadedRoutes) {
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
    };

    /**
     * Sets the date to the specified date and regenerates the map objects
     * @param {Date} date
     */
    var setDate = function (date) {
        selectedDate = date;
        parameters.setOne("date", dateTools.stripDate(date));
        //remove all objects from the map
        removeLayer(resourcesGroup);
        removeLayer(routesGroup);
        removeLayer(trackPointsGroup);
        //center the map the first time routes are loaded after setDate is changed
        center = true;
        //get the depots
        getDepots();
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
    //endregion

    mapView.initialize = function () {
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

        var setDateToUrlParameter = function () {
            //set the date to today if it is not set
            var query = parameters.get();
            if (query.date) {
                var date = moment(query.date).toDate();
                setDate(date);
            } else {
                setDate(new Date());
            }
        };

        //set the date whenever the role changes
        session.followRole(setDateToUrlParameter);
        //check if the date changed
        parameters.changed.add(setDateToUrlParameter);
    };

    //expose certain functionality to the browser window
    // (so it can be accessed from silverlight)
    var functions = {
        getRoutes: getRoutes,
        setDate: setDate,
        setRoleId: function (roleId) {
            selectedRouteId = null;
            dbServices.setRoleId(roleId);
            getDepots();
            getRoutes();
            getResources();
        },
        setSelectedRoute: setSelectedRoute
    };

    window.map = functions;

    window.mapView = mapView;
});