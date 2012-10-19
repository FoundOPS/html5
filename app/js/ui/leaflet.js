// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold leaflet functions.
 */

"use strict";

define(['underscore', 'db/models', 'tools/generalTools', 'ui/ui', 'lib/leaflet', 'moment'], function (_, models, generalTools, ui) {
    var leaflet = {};

    /**
     * Sets up an empty map with the CloudMade tile layer.
     * @return {L.map} map
     */
    leaflet.setupMap = function () {
        // initialize the map on the "map" div with a given center and zoom
        var map = L.map('map', {
            center: [40, -89],
            zoom: 4
        });
        // create a CloudMade tile layer and add it to the map
        var cloudMade = L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
            maxZoom: 18
        });
        cloudMade.addTo(map);

        //for testing
        map.on('click', function (e) {
            console.log(e.latlng);
        });

        return map;
    };


    /**
     * Center the map based on the array of LatLng.
     * @param {L.map} map The map to center on the resources.
     * @param {Array.<L.latLng>} locations An array of latitude and longitudes to center on.
     */
    leaflet.center = function (map, locations) {
        if (!locations) {
            return;
        }

        // get the total area used
        var bounds = [locations];
        //Sets the best view(position and zoom level) to fit all the locations(This only works perfectly in IE)
        map.fitBounds(bounds);
    };

    /**
     * Add a popup to the marker.
     * @param {L.marker} marker The marker to add the popup to.
     * @param {string} content The popup's content.
     * @private
     */
    leaflet.addPopup_ = function (marker, content) {
        marker.bindPopup(content, {
            closeButton: false,
            autoPan: false
        });
        //open the number marker popup on mouseover
        marker.on('mouseover', function (e) {
            e.target.openPopup();
        });
        //close the popup on mouseout
        marker.on('mouseout', function (e) {
            e.target.closePopup();
        });
    };

    /**
     * Create a LatLng from the location.
     * @param {Object} location
     * @return {L.latLng}
     */
    leaflet.getLatLng = function (location) {
        if (!location || !location.Latitude || !location.Longitude) {
            return null;
        }

        return L.latLng(location.Latitude, location.Longitude);
    };

    /**
     * Add a click function the the marker
     * @param {L.marker} marker
     * @param {function(Object)=} opt_selected A function to perform when a route is selected (optional).
     */
    leaflet.addMarkerClick = function (marker, opt_selected) {
        marker.on('click', function (e) {
            opt_selected(e.target.options.icon.options.routeId);
        });
    };

    /**
     * Add a depot to the layer.
     * @param {L.layerGroup} layer The layer to add the depot's marker to.
     * @param {Object} depot The depot to draw.
     */
    leaflet.drawDepot_ = function (layer, depot) {
        var location = leaflet.getLatLng(depot);
        if (!location) {
            return;
        }
        var depotIcon = L.icon({
            iconUrl: ui.ImageUrls.DEPOT,
            shadowUrl: null,
            iconSize: [24, 18],
            iconAnchor: [12, 9],
            shadowSize: [0, 0],
            popupAnchor: [0, -10]
        });
        var marker = L.marker(location, {
            icon: depotIcon
        });
        //setup marker popup
        leaflet.addPopup_(marker, "<b>" + depot.Name + "</b>");
        //add the depot layer to the group
        marker.addTo(layer);
    };

    /**
     * Draw the depots on the map.
     * @param {L.map} map
     * @param {Object} depots
     * @return {L.layerGroup} The depot resources added to the map.
     */
    leaflet.drawDepots = function (map, depots) {
        //track the depot resources added to the map
        var depotsGroup = L.layerGroup();

        _.each(depots, function (depot) {
            leaflet.drawDepot_(depotsGroup, depot);
        });

        depotsGroup.addTo(map);

        return depotsGroup;
    };

    /**
     * Add a resource to the layer.
     * @param {L.layerGroup} layer The layer to add the resource's markers to.
     * @param {Object} resource The resource to draw.
     * @param {tools.ValueSelector} routeColorSelector The route color selector.
     * @param {function(models.Route)=} opt_routeSelected A function to perform when a route is selected (optional).
     * @private
     */
    leaflet.drawResource_ = function (layer, resource, routeColorSelector, opt_routeSelected) {
        if (!resource || !resource.Latitude || !resource.Longitude) {
            return;
        }

        var rotateDegrees = resource.Heading;
        var color = routeColorSelector.getValue(resource.RouteId).name;
        var minutesSinceCollected = moment().diff(moment.utc(resource.CollectedTimeStamp), 'minutes');
        //change the color to gray to symbolize inactive
        if (minutesSinceCollected >= 60) {
            color = 'gray';
        }

        var locationLatLng = [resource.Latitude, resource.Longitude];
        var iconUrl = ui.ImageUrls.PHONE;
        var source = resource.Source ? resource.Source.toLowerCase() : "";
        if (source === models.DevicePlatform.IPHONE) {
            iconUrl = ui.ImageUrls.APPLE;
        } else if (source === models.DevicePlatform.ANDROID) {
            iconUrl = ui.ImageUrls.ANDROID;
        }

        //add the icon for the resource
        var resourceIcon = L.icon();
        $.extend(resourceIcon, {
            options: {
                routeId: resource.RouteId,
                iconUrl: null,
                iconAnchor: [11, 12],
                shadowUrl: null,
                popupAnchor: [0, -12],
                className: color + " resource",
                html: "<img class='directionIcon' src='" + ui.ImageUrls.OUTER_CIRCLE + "'/><img class='sourceIcon' src='" + iconUrl + "' />"},
            createIcon: function () {
                var e = document.createElement("div");
                var t = this.options;
                return t.html && (e.innerHTML = t.html),
                    t.bgPos && (e.style.backgroundPosition = -t.bgPos.x + "px " + -t.bgPos.y + "px"),
                    this._setIconStyles(e, "icon"), e
            },
            createShadow: function () {
                return null
            }
        });
        L.divIcon = function (e) {
            return L.divIcon(e)
        };

        //convert speed from m/s to mph and round it to whole number
        var speed = Math.round(resource.Speed * 2.23693629);
        var speedDirString = "";
        //only show speed and direction if there is a speed(i.e., if on mobile)
        if (speed) {
            speedDirString = "<br />Speed: " + speed + " mph " + generalTools.getDirection(rotateDegrees);
        }

        //set the text for the popup
        var popupContent = "<p class='speed'><b>" + resource.EntityName + "</b>" + speedDirString + "</p>";

        var iconMarker = L.marker(locationLatLng, {
            icon: resourceIcon
        });
        leaflet.addPopup_(iconMarker, popupContent);
        iconMarker.addTo(layer);

        //if the onRouteSelected callback was defined, invoke it when the marker is clicked
        if (opt_routeSelected) {
            leaflet.addMarkerClick(iconMarker, opt_routeSelected);
        }
    };

    /**
     * Draw the resources and their latest points on the map.
     * @param {L.map} map The map.
     * @param {Array.<Object>} resources The resources to draw on the map.
     * @param {tools.ValueSelector} routeColorSelector The route color selector.
     * @param {function(Object)=} opt_routeSelected A function to perform when a route is selected (optional).
     * @return {L.layerGroup} The resources added to the map.
     */
    leaflet.drawResources = function (map, resources, routeColorSelector, opt_routeSelected) {
        var resourcesGroup = L.layerGroup();

        //draw each resource on the map
        _.each(resources, function (resource) {
            leaflet.drawResource_(resourcesGroup, resource, routeColorSelector, opt_routeSelected);
        });

        //add the resources to the map
        resourcesGroup.addTo(map);

        return resourcesGroup;
    };

    /**
     * Add the destination to the layer
     * @param {L.layerGroup} layer The layer to add the destination's markers to.
     * @param {Object} destination The destination to draw.
     * @param {string} routeId The id of the route
     * @param {tools.ValueSelector} routeColorSelector The route color selector.
     * @param {function(Object)=} opt_routeSelected A function to perform when a route is selected (optional).
     * @return {L.latLng} The destination's L.latLng.
     * @private
     */
    leaflet.drawDestination_ = function (layer, destination, routeId, routeColorSelector, opt_routeSelected) {
        if (!destination) {
            return null;
        }

        var color = routeColorSelector.getValue(routeId).name;
        var location = destination.Location;
        var locationLatLng = leaflet.getLatLng(location);
        if (!locationLatLng) {
            return null;
        }

        var className = "leaflet-div-icon dest " + color;

        if (destination.OrderInRoute > 9 && destination.OrderInRoute < 100) {
            className = "leaflet-div-icon dest " + color + " doubleDigit";
        } else if (destination.OrderInRoute >= 100) {
            className = "leaflet-div-icon dest " + color + " tripleDigit";
        }

        //an icon for the destination
        var destinationIcon = L.icon();
        $.extend(destinationIcon, {
            options: {
                routeId: routeId,
                iconUrl: "",
                iconSize: [13, 13],
                className: className,
                html: "<span class='number'>" + destination.OrderInRoute + "</span>",
                popupAnchor: [0, -8]},
            createIcon: function () {
                var e = document.createElement("div");
                var t = this.options;
                return t.html && (e.innerHTML = t.html),
                    t.bgPos && (e.style.backgroundPosition = -t.bgPos.x + "px " + -t.bgPos.y + "px"),
                    this._setIconStyles(e, "icon"), e
            },
            createShadow: function () {
                return null
            }
        });
        L.divIcon = function (e) {
            return L.divIcon(e)
        };


        //add a number marker with the destination's order in the route
        var numMarker = L.marker(locationLatLng, {
            icon: destinationIcon
        });

        //if the onRouteSelected callback was defined, invoke it when the number marker is clicked
        if (opt_routeSelected) {
            leaflet.addMarkerClick(numMarker, opt_routeSelected);
        }

        //setup marker popup
        var name = "";
        if (location.Name) {
            name = location.Name;
        }
        leaflet.addPopup_(numMarker, "<b>" + name + "</b>");

        //add the markers to the map
        numMarker.addTo(layer);

        return locationLatLng;
    };

    /**
     * Draw the route's destinations with markers on the map.
     * @param {L.map} map The map.
     * @param {Array.<{RouteDestinations: Array.<Object>}>} routes The routes to draw on the map.
     * @param {tools.ValueSelector} routeColorSelector The route color selector.
     * @param {boolean} shouldCenter Center the map on the added items.
     * @param {function(Object)=} opt_routeSelected A function to perform when a route is selected (optional).
     * @return {L.layerGroup} The route destinations added to the map.
     */
    leaflet.drawRoutes = function (map, routes, routeColorSelector, shouldCenter, opt_routeSelected) {
        //keep track of the destination's locations to center the map on
        var destinationLatLngs = [];
        //track the route resources added to the map
        var routesGroup = L.layerGroup();
        //iterate through each route
        _.each(routes, function (route) {
            //add markers for each route destination
            _.each(route.RouteDestinations, function (destination) {
                var latLng = leaflet.drawDestination_(routesGroup, destination, route.Id, routeColorSelector, opt_routeSelected);
                if (!latLng) {
                    return;
                }
                destinationLatLngs.push(latLng);
            });
        });

        routesGroup.addTo(map);

        if (shouldCenter) {
            leaflet.center(map, destinationLatLngs);
        }

        return routesGroup;
    };

    /**
     * Add a trackpoint to the polyline
     * @param {L.polyline} polyline The line of all the trackpoints.
     * @param {Object} trackPoint The trackpoint to draw.
     * @private
     */
    leaflet.drawTrackPoint_ = function (polyline, trackPoint) {
        var lat = trackPoint.Latitude;
        var lng = trackPoint.Longitude;

        if (!lat || !lng) {
            return;
        }
        //add current location to the polyline
        polyline.addLatLng([lat, lng]);
    };

    /**
     * Draws the track points on the map for the given route
     * @param {L.map} map
     * @param {Array<Object>} trackpoints The trackpoints to draw
     * @param {tools.ValueSelector} routeColorSelector
     * @param {tools.ValueSelector} routeOpacitySelector
     * @param {string} routeId The id of the route to draw
     * @return {L.layerGroup} The historical trackpoints added to the map.
     */
    leaflet.drawTrackPoints = function (map, trackpoints, routeColorSelector, routeOpacitySelector, routeId) {
        var trackPointsGroup = L.layerGroup();

        //group the trackpoints based on resource
        var resourcesTrackPoints = _.groupBy(trackpoints, "Id");

        //loop through all the resources
        _.each(resourcesTrackPoints, function (resourceTrackPoints) {
            //creates an empty array(necessary for the polyline to initiate)
            var latlngs = [];
            //create a polyline to connect the trackpoints
            var polyline = L.polyline(latlngs, {
                color: routeColorSelector.getValue(routeId).color,
                weight: 2,
                opacity: routeOpacitySelector.getValue(routeId),
                clickable: false
            });

            var i = 0;
            //loop through every trackpoint
            _.each(resourceTrackPoints, function (trackPoint) {
                //check if trackpoint is for the current resource and route
                if (trackPoint.RouteId !== routeId) {
                    return;
                }

                leaflet.drawTrackPoint_(polyline, trackPoint);

                i++;
            });

            polyline.addTo(trackPointsGroup);
        });

        //add the resources to the map
        trackPointsGroup.addTo(map);

        return trackPointsGroup;
    };

    return leaflet;
});