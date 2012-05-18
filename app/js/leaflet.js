// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold leaflet functions.
 */
goog.provide('ops.leaflet');

/**
 * Sets up an empty map with the CloudMade tile layer.
 * @return {window.L.Map} The map
 */
ops.leaflet.setupMap = function () {
    // initialize the map on the "map" div with a given center and zoom
    var map = new window.L.Map('map', {
        center:new window.L.LatLng(40, -89),
        zoom:4
    });
    // create a CloudMade tile layer and add the CloudMade layer to the map
    var cloudMade = new window.L.TileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
        maxZoom:18
    });
    map.addLayer(cloudMade);

    return map;
};

/**
 * Centers the map based on the given locations.
 * @param map The map to center on the resources.
 * @param {Array.<window.L.LatLng>} resources An array of latitude and longitudes to center on.
 */
ops.leaflet.center = function (map, resources) {
    // get the total area used
    var bounds = new window.L.LatLngBounds(resources);

    // center the map on the bounds
    map.setView(bounds.getCenter(), 11);

    /* Sets the best view(position and zoom level) to fit all the resources
     * (This only works perfectly in IE) */
    map.fitBounds(bounds);
};

/**
 * Add a popup to the marker.
 * @param {window.L.Marker} marker The marker to add the popup to.
 * @param {string} content The popup's content.
 * @private
 */
ops.leaflet.addPopup_ = function(marker, content){
    marker.bindPopup("<b>" + content + "</b>", {
        closeButton:false
    });

    //on mouseover: open the number marker popup
    marker.on('mouseover', function (e) {
        e.target.openPopup();
    });

    //on mouseout: close the popup
    numMarker.on('mouseout', function (e) {
        e.target.closePopup();
    });
}

/**
 * Draw the depots on the map.
 * @param map
 * @param depots
 * @return {window.L.LayerGroup} The depot resources added to the map.
 */
ops.leaflet.drawDepots = function(map, depots){
    //track the depot resources added to the map
    var depotsGroup = new window.L.LayerGroup();

    for (var d in depots) {
        var name = depots[d].Name;
        var lat = depots[d].Latitude;
        var lng = depots[d].Longitude;

        //get the location of the destination
        var location = new window.L.LatLng(lat, lng);
        var icon = window.L.Icon.extend({
            iconUrl:"../img/depot.png",
            iconSize:new window.L.Point(24, 18),
            iconAnchor:new window.L.Point(12, 9),
            shadowSize:new window.L.Point(0, 0),
            popupAnchor:new window.L.Point(0, -10)
        });
        var depotIcon = new icon();

        var marker = new window.L.Marker(location, {
            icon:depotIcon
        });

        //setup marker popup
        ops.leaflet.addPopup_(marker, name);

        //add the depot layer to the group
        depotsGroup.addLayer(marker);
    }

    map.addLayer(depotsGroup);

    return depotsGroup;
};

/**
 * Draw the Route's RouteDestinations with markers on the map.
 * @param map The map.
 * @param {Array.<ops.models.Route>} routes The routes to draw on the map.
 * @param {ops.tools.ValueSelector} routeColorSelector The route color selector.
 * @param {boolean} shouldCenter Center the map on the added items.
 * @param {function(ops.models.RouteDestination)=} opt_destinationSelected A function to perform when a route destination is selected (optional).
 * @return {window.L.LayerGroup} The route resources added to the map.
 */
ops.leaflet.drawRoutes = function (map, routes, routeColorSelector, shouldCenter, opt_destinationSelected) {
    //keep track of the destination's locations to center the map on
    var destinationLatLngs = [];

    //track the route resources added to the map
    var routesGroup = new window.L.LayerGroup();

    //iterate through each route
    for (var r in routes) {
        var destinations = routes[r].RouteDestinations;

        //add markers for each route destination
        for (var d in destinations) {
            var locationName = destinations[d].Location.Name;
            var lat = destinations[d].Location.Latitude;
            var lng = destinations[d].Location.Longitude;

            //create a window.L.LatLng from the destination's location
            var locationLatLng = new window.L.LatLng(lat, lng);

            //include this location in the bounds to center on
            destinationLatLngs.push(locationLatLng);

            //add a number marker based on the destination's order in the route
            var numMarker = new window.L.Marker(locationLatLng, {
                icon:new window.L.DivIcon({
                    number:destinations[d].OrderInRoute,
                    //tag this with the related destination for invoking opt_destinationSelected
                    destination:destinations[d]
                })
            });

            //todo make circle marker clickable
            //add a circle behind the number
            var marker = new window.L.CircleMarker(locationLatLng, {
                radius:7,
                opacity:1,
                weight:1,
                color:"#ffffff",
                fillColor:routeColorSelector.getValue(routes[r].Id),
                fillOpacity:1,
                clickable:false
            });

            //if the onRouteSelected callback was defined invoke it when the number marker is clicked
            if (opt_destinationSelected) {
                numMarker.on('click', function (e) {
                    opt_destinationSelected(e.target.options.icon.options.destination);
                });
            }

            //setup marker popup
            ops.leaflet.addPopup_(numMarker, locationName);

            //add the markers to the map
            routesGroup.addLayer(marker);
            routesGroup.addLayer(numMarker);
        }
    }
    map.addLayer(routesGroup);

    if (shouldCenter)
        ops.leaflet.center(map, destinationLatLngs);

    return routesGroup;
};

/**
 * Draw the resources and their latest points on the map.
 * @param map The map.
 * @param {Array.<ops.models.ResourceWithLatestPoint>} resources The resources to draw on the map.
 * @param {ops.tools.ValueSelector} routeColorSelector The route color selector.
 * @param {function(ops.models.RouteDestination)=} opt_destinationSelected A function to perform when a route destination is selected (optional).
 * @return {window.L.LayerGroup} The resources added to the map.
 */
ops.leaflet.drawResources = function (map, resources, routeColorSelector, opt_destinationSelected) {
    var resourcesGroup = new window.L.LayerGroup();

    //draw each resource on the map
    for (var r in resources) {
        var resource = resources[r];
        var name = resource.EntityName;
        var lat = resource.Latitude;
        var lng = resource.Longitude;
        var rotateDegrees = resource.CompassHeading;
        /** Get the color of the route */
        var color = routeColorSelector.getValue(resource.RouteId);
        /** Get the location of the destination */
        var location = new window.L.LatLng(lat, lng);

        //TODO put this in a config
        var url = "../img/truck.png";
        if (resource.TrackSource == "iPhone") {
            url = "../img/apple.png";
        } else if (resource.TrackSource == "Android") {
            url = "../img/android.png";
        }
        /** Create a point at the current location */
        window.L.ResourceIcon = window.L.Icon.extend({
            iconUrl:url,
            iconSize:new window.L.Point(14, 14),
            iconAnchor:new window.L.Point(7.2, 7.4),
            shadowSize:new window.L.Point(0, 0),
            popupAnchor:new window.L.Point(0, -7),
            routeId:resource.RouteId
        });
        var icon = new window.L.ResourceIcon();
        /** Set the text for the popup */
        var popoupContent = "<p class='speed'><b>" + name + "</b><br />Speed: " + Math.round(resource.Speed) + " mph " + ops.tools.getDirection(rotateDegrees) + "</p>";
        var marker = new window.L.Marker(location, {
            icon:icon
        }).bindPopup(popoupContent, {
                closeButton:false
            });
        /** Open the popup on mouseover */
        marker.on('mouseover', function (e) {
            e.target.openPopup();
        });
        /** Create the icon for the direction arrow */
        icon = new window.L.ArrowIcon({
            routeId:resource.RouteId
        });
        /** Create the marker for the direction arrow */
        var arrow = new window.L.ArrowMarker(location, { icon:icon, angle:rotateDegrees }).bindPopup(popoupContent, {
            closeButton:false
        });
        /** Set selected route on mouse click */
        arrow.on('click', function (e) {
            setSelectedRoute(e.target.options.icon.options.routeId);
        });
        arrow.on('mouseover', function (e) {
            e.target.openPopup();
        });
        arrow.on('mouseout', function (e) {
            e.target.closePopup();
        });
        /** Create the "route-colored" circle */
        var circle = new window.L.CircleMarker(location, {
            radius:10.5,
            weight:.5,
            opacity:1,
            color:color,
            fillOpacity:1,
            fillColor:color,
            clickable:false
        });
        /** Add current marker to the map */
        resourcesGroup.addLayer(circle);
        resourcesGroup.addLayer(arrow);
        resourcesGroup.addLayer(marker);
    }
    /** Add the resources to the map */
    map.addLayer(resourcesGroup);
};

/**
 * Draws the resources' trackpoints on the map for the given route
 * @param {string} routeId
 */
var drawHistoricalTrackPoints = function (routeId) {
    /** remove the previous resources */
    if (trackPointsGroup != null) {
        map.removeLayer(trackPointsGroup);
    }
    /** track the resources so they can be removed when they are redrawn */
    trackPointsGroup = new window.L.LayerGroup();

    /** Loop through all the resources */
    for (var r in resources) {
        /** Check if the resource is on the selected route*/
        if (resources[r].RouteId == routeId) {
            /** Get the Id of the resource */
            var resourceId;
            if (resources[r].EmployeeId != null) {
                resourceId = resources[r].EmployeeId;
            } else {
                resourceId = resources[r].VehicleId;
            }
            /** creates an empty array(necessary for the polyline to initiate) */
            var latlngs = [];
            /** create a polyline to connect the trackpoints */
            var polyline = new window.L.Polyline(latlngs, {
                color:routeColorSelector.getValue(routeId),
                weight:2,
                opacity:routeOpacitySelector.getValue(resourceId),
                clickable:false
            });
            /** Loop through every trackpoint */
            for (var t in mapTrackPoints) {
                /** Check if trackpoint is for the current resource and route*/
                if ((mapTrackPoints[t].Id == resourceId) && (mapTrackPoints[t].RouteId == routeId)) {
                    var trackPoint = mapTrackPoints[t];
                    var lat = trackPoint.Latitude;
                    var lng = trackPoint.Longitude;
                    /** get the location of the destination */
                    var location = new window.L.LatLng(lat, lng);
                    /** create a point at the current location */
                    /*var marker = new window.L.CircleMarker(location, {
                     clickable: false,
                     radius: 3,
                     stroke: 0,
                     fillOpacity: routeOpacitySelector.getValue(mapTrackPoints[t].Id),
                     fillColor: routeColorSelector.getValue(mapTrackPoints[t].RouteId)
                     });*/
                    /** add current marker to the map */
                    /*trackPointsGroup.addLayer(marker);*/
                    /** add current location to the polyline */
                    polyline.addLatLng(location);
                }
            }
            trackPointsGroup.addLayer(polyline);
        }
    }
    /** add the resources to the map */
    map.addLayer(trackPointsGroup);
};