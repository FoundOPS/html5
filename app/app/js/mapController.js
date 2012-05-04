"use strict";

angular.module("foundOPS").controller('mapController', function ($scope, $defer, depotsStore, resourcesStore, routesStore, trackPointsStore) {
//region Locals

//region Constants

//Rate of refreshing resources on the map (in milliseconds)
    var RESOURCES_REFRESH_RATE = 10000;

//Rate of refreshing routes on the map (in milliseconds)
    var ROUTES_REFRESH_RATE = 30000;

//endregion

//region Loaded data

//keep track of if initial load
    var isInitialLoad = true;
//the business's depots
    var depots;
//the resources (employees and vehicles)
    var resources;
//the routes
    var routes;
//the historical track points
    var trackPoints;

//endregion

//region Map variables

//the map instance
    var map;
//keep a reference to the layer groups so they can be cleared from the map
//when they are redrawn
    var resourcesGroup;
    var routesGroup;
    var trackPointsGroup;

//endregion

    /** The Id of the selected route */
    var selectedRouteId;

//endregion

//region Logic

//region Map Methods

    /** Creates the map. */
    var setupMap = function () {
        /** initialize the map on the "map" div with a given center and zoom */
        map = new window.L.Map('map', {
            center: new window.L.LatLng(40, -89),
            zoom: 4
        });
        /** create a CloudMade tile layer */
        var cloudmade = new window.L.TileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
            maxZoom: 18
        });
        /** add the CloudMade layer to the map */
        map.addLayer(cloudmade);
    };

    /** Setup an empty map. */
    setupMap();
    /** Centers the map based on the given locations
     * @param {Array.<number>} resourcesToCenterOn An array to hold the lat and lng of every point used.
     */
    var center = function (resourcesToCenterOn) {
        /** gets the total area used */
        var bounds = new window.L.LatLngBounds(resourcesToCenterOn);
        /** center the map on the bounds */
        map.setView(bounds.getCenter(), 11);
        /** Sets the best view(position and zoom level) to fit all the resources
         * (This only works perfectly in IE) */
        map.fitBounds(bounds);
    };

    /** Remove all objects from the map. */
    var clearMap = function () {
        /** Remove the resourcesGroup if it exists */
        if (resourcesGroup != null)
            map.removeLayer(resourcesGroup);
        /** Remove the routesGroup if it exists */
        if (routesGroup != null)
            map.removeLayer(routesGroup);
        /** Remove the trackpointsGroup if it exists */
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);
    };

//endregion

//region Draw Objects

    /** Draws the calculated routes on the map */
    var drawCalculatedRoutes = function () {
        /** keep track of all the locations of destinations and resources to center the map on */
        var routeLatLngs = [];
        /** Remove the previous routes */
        if (routesGroup != null)
            map.removeLayer(routesGroup);
        /** track the resources so they can be removed when they are redrawn */
        routesGroup = new window.L.LayerGroup();

        for (var r in routes) {
            /** iterate through the destinations */
            var destinations = routes[r].RouteDestinations;
            for (var d in destinations) {
                var name = destinations[d].Location.Name;
                var lat = destinations[d].Location.Latitude;
                var lng = destinations[d].Location.Longitude;
                /** get the location of the destination */
                var location = new window.L.LatLng(lat, lng);
                var numMarker = new window.L.Marker(location, {
                    icon: new window.L.DivIcon({
                        number: destinations[d].OrderInRoute,
                        routeId: routes[r].Id
                    })
                });
                var marker = new window.L.CircleMarker(location, {
                    radius: 7,
                    opacity: 1,
                    weight: 1,
                    color: "#ffffff",
                    fillColor: F.GET_COLOR(routes[r].Id),
                    fillOpacity: 1,
                    clickable: false
                });
                /** include this location into the bounds to center on */
                routeLatLngs.push(location);
                /** create a popup for the marker */
                numMarker.bindPopup("<b>" + name + "</b>", {
                    closeButton: false
                });
                /** Set selected route on mouse click */
                numMarker.on('click', function (e) {
                    setSelectedRoute(e.target.options.icon.options.routeId);
                });
                /** Open popup on mouseover */
                numMarker.on('mouseover', function (e) {
                    e.target.openPopup();
                });
                /** Close popup on mouseout */
                numMarker.on('mouseout', function (e) {
                    e.target.closePopup();
                });
                /** add marker to the map */
                routesGroup.addLayer(marker);
                routesGroup.addLayer(numMarker);
            }
        }
        map.addLayer(routesGroup);

        /** Center the map on the current resources(if this is the initial load) */
        if (isInitialLoad) {
            center(routeLatLngs);
        }
        isInitialLoad = false;
    };

    /** Draws the depots on the map */
    var drawDepots = function () {
        for (var d in depots) {
            var name = depots[d].Name;
            var lat = depots[d].Latitude;
            var lng = depots[d].Longitude;
            /** Get the location of the destination */
            var location = new window.L.LatLng(lat, lng);
            var icon = window.L.Icon.extend({
                iconUrl: "../img/depot.png",
                iconSize: new window.L.Point(24, 18),
                iconAnchor: new window.L.Point(12, 9),
                shadowSize: new window.L.Point(0, 0),
                popupAnchor: new window.L.Point(0, -10)
            });
            var depotIcon = new icon();
            var marker = new window.L.Marker(location, {
                icon: depotIcon
            }).bindPopup("<b>" + name + "</b>", {
                    closeButton: false
                });
            marker.on('mouseover', function (e) {
                e.target.openPopup();
            });
            marker.on('mouseout', function (e) {
                e.target.closePopup();
            });
            /** add depot marker to the map */
            map.addLayer(marker);
        }
    };

    /** Draws the resources on the map. */
    var drawResources = function () {
        /** Remove the previous resources */
        if (resourcesGroup != null) {
            map.removeLayer(resourcesGroup);
        }
        /** Track the resources so they can be removed when they are redrawn */
        resourcesGroup = new window.L.LayerGroup();
        /** Go through and draw each resource on the map */
        for (var r in resources) {
            var resource = resources[r];
            var name = resource.EntityName;
            var lat = resource.Latitude;
            var lng = resource.Longitude;
            var rotateDegrees = resource.CompassHeading;
            /** Get the color of the route */
            var color = F.GET_COLOR(resource.RouteId);
            /** Get the location of the destination */
            var location = new window.L.LatLng(lat, lng);
            var url = "../img/truck.png";
            if (resource.TrackSource == "iPhone") {
                url = "../img/apple.png";
            } else if (resource.TrackSource == "Android") {
                url = "../img/android.png";
            }
            /** Create a point at the current location */
            window.L.ResourceIcon = window.L.Icon.extend({
                iconUrl: url,
                iconSize: new window.L.Point(14, 14),
                iconAnchor: new window.L.Point(7.5, 7.6),
                shadowSize: new window.L.Point(0, 0),
                popupAnchor: new window.L.Point(0, -7),
                routeId: resource.RouteId
            });
            var icon = new window.L.ResourceIcon();
            /** Set the text for the popup */
            var popoupContent = "<p class='speed'><b>" + name + "</b><br />Speed: " + Math.round(resource.Speed) + " mph " + F.GET_DIRECTION(rotateDegrees) + "</p>";
            var marker = new window.L.Marker(location, {
                icon: icon
            }).bindPopup(popoupContent, {
                    closeButton: false
                });
            /** Set selected route on mouse click */
            marker.on('click', function (e) {
                setSelectedRoute(e.target.options.icon.routeId);
            });
            /** Open the popup on mouseover */
            marker.on('mouseover', function (e) {
                e.target.openPopup();
            });
            /** Create the icon for the direction arrow */
            icon = new window.L.ArrowIcon({
                routeId: resource.RouteId
            });
            /** Create the marker for the direction arrow */
            var arrow = new window.L.ArrowMarker(location, { icon: icon, angle: rotateDegrees }).bindPopup(popoupContent, {
                closeButton: false
            });
            arrow.on('click', function (e) {
                setSelectedRoute(e.target.options.icon.routeId);
            });
            arrow.on('mouseover', function (e) {
                e.target.openPopup();
            });
            arrow.on('mouseout', function (e) {
                e.target.closePopup();
            });

            /** Create the "route-colored" circle */
            var circle = new window.L.CircleMarker(location, {
                radius: 10.5,
                weight: .5,
                opacity: 1,
                color: color,
                fillOpacity: 1,
                fillColor: color,
                clickable: false
            });

            /** Add current marker to the map */
            resourcesGroup.addLayer(circle);
            resourcesGroup.addLayer(arrow);
            resourcesGroup.addLayer(marker);
        }

        /** Add the resources to the map */
        map.addLayer(resourcesGroup);
    };

    /** Draws the resources' trackpoints on the map for the given route
     * @param {string} routeId
     */
    var drawHistoricalTrackPoints = function (routeId) {
        /** remove the previous resources */
        if (trackPointsGroup != null) {
            map.removeLayer(trackPointsGroup);
        }
        /** track the resources so they can be removed when they are redrawn */
        trackPointsGroup = new window.L.LayerGroup();

        /** go through and draw each resource on the map */
        for (var t in trackPoints) {
            if (trackPoints[t].RouteId == routeId) {
                var trackPoint = trackPoints[t];
                var lat = trackPoint.Latitude;
                var lng = trackPoint.Longitude;
                /** get the location of the destination */
                var location = new window.L.LatLng(lat, lng);
                /** create a point at the current location */
                var marker = new window.L.CircleMarker(location, {
                    clickable: false,
                    radius: 3,
                    stroke: 0,
                    fillOpacity: F.GET_OPACITY(trackPoints[t].Id),
                    fillColor: F.GET_COLOR(trackPoints[t].RouteId)
                });
                /** add current marker to the map */
                trackPointsGroup.addLayer(marker);
            }
        }

        /** add the resources to the map */
        map.addLayer(trackPointsGroup);
    };

//endregion

//region Get Data

    /** Gets the business's depot */
    var getDepots = function () {
        depotsStore.read().then(function (data) {
            if (!data) {
                data = [];
            }
            depots = data;
            /** Draw the depot on the map */
            drawDepots();
        });
    };

    /** Gets the trackpoints of the route for the specified date
     * @param {Object} date
     * @param {string} routeId
     */
    var getHistoricalTrackPoints = function (date, routeId) {
        trackPointsStore.read(date, routeId).then(function (data) {
            if (!data) {
                data = [];
            }
            trackPoints = data;
            /** Draw the trackpoints on the map */
            drawHistoricalTrackPoints(routeId);
        });
    };

    /** Gets the technicians' and vehicles' latest data */
    var getResourcesWithLatestPoint = function (date) {
        resourcesStore.read(date).then(function (data) {
            if (!data) {
                data = [];
            }
            resources = data;
            /** Draw the resources on the map */
            drawResources();
        });
        /** Reload the resources */
        $defer(getResourcesWithLatestPoint, RESOURCES_REFRESH_RATE);
    };

    /** Gets the routes for the specified date
     * @param {Object} date
     */
    var getRoutes = function (date) {
        /** Draw the routes on the map */
        routesStore.read(date).then(function (data) {
            if (!data) {
                data = [];
            }
            routes = data;
            /** Draw the routes and route Destinations on the map */
            drawCalculatedRoutes();
            /** TODO: get trackpoints here(for each route) */
        });
        /** Reload the routes */
        $defer(getRoutes, ROUTES_REFRESH_RATE);
    };

    /** Add the depot to the map */
    getDepots();

//endregion

    /** Sets the date to the specified date and regenerates the map objects
     * @param {Object} date
     */
    var setDate = function (date) {
        /** reset the initial load(so the map gets re-centered) */
        isInitialLoad = true;
        var newDate = F.FORMAT_DATE(date);
        /** Remove all objects from the map */
        clearMap();
        getRoutes(newDate);

        /** Get resources if today */
        if (newDate == currentDate) {
            getResourcesWithLatestPoint(newDate);
        }
    };

    /** Set the current date to today */
    var currentDate = F.FORMAT_DATE(new Date());

    /** Set the date to today. */
    setDate(new Date());

    /** Generates a compass direction from rotation degrees
     * @param {string} routeId
     */
    var setSelectedRoute = function (routeId) {
        /** Remove the previous trackpoints */
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);
        /** Update the selected route */
        selectedRouteId = routeId;
        /** Reset the opacity index to 0 */
        F.OPACITY_INDEX = 0;
        /** Get the trackpoints on the map */
        getHistoricalTrackPoints(currentDate, routeId);
    };

//endregion
});