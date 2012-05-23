// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold leaflet functions.
 */

goog.provide('ops.leaflet');

goog.require('ops.ui');
goog.require('ops.models.Location');
goog.require('ops.models.TrackPoint');
goog.require('ops.models.ResourceWithLastPoint');
goog.require('ops.models.Route');

//the map instance
var map;

/** Add routeId to the icon so it can be accessed from the click event(to set selected route) */
window.L.ArrowIcon = window.L.Icon.extend({
    iconUrl: ops.ui.ImageUrls.OUTER_CIRCLE,
    shadowUrl: null,
    iconSize: new window.L.Point(18, 18),
    iconAnchor: new window.L.Point(9, 9),
    shadowSize: new window.L.Point(0, 0),
    popupAnchor: new window.L.Point(0, -7),
    options: {
        routeId: ''
    },
    initialize: function (options) {
        window.L.Util.setOptions(this, options);
    }
});

/** Add the rotate functionality to the marker */
window.L.ArrowMarker = window.L.Marker.extend({
    _reset: function () {
        var pos = this._map.latLngToLayerPoint(this._latlng).round();

        window.L.DomUtil.setPosition(this._icon, pos);

        this._icon.style.WebkitTransform += ' rotate(' + this.options.angle + 'deg)';
        this._icon.style.MozTransform = 'rotate(' + this.options.angle + 'deg)';
        this._icon.style.msTransform = 'rotate(' + this.options.angle + 'deg)';
        this._icon.style.OTransform = 'rotate(' + this.options.angle + 'deg)';
    }
});

/** Add text functionality to the icon */
window.L.DivIcon = window.L.Icon.extend({
    popupAnchor: new window.L.Point(0, -7),
    options: {
        number: '',
        routeId: '',
        className: 'leaflet-div-icon'
    },
    createIcon: function () {
        var div = document.createElement('div');
        /** Next 4 lines were custom added */
        var numdiv = document.createElement('div');
        numdiv.setAttribute("class", "number");
        numdiv.innerHTML = this.options['number'] || '';
        div.appendChild(numdiv);
        this._setIconStyles(div, 'icon');
        return div;
    },
    createShadow: function () {
        return null;
    },
    initialize: function (options) {
        window.L.Util.setOptions(this, options);
    },
    _setIconStyles: function (img, name) {
        var options = this.options,
            size = options[name + 'Size'],
            anchor = options.iconAnchor;
        img.className = 'leaflet-marker-' + name + ' ' + options.className;
        if (anchor) {
            img.style.marginLeft = (-anchor.x) + 'px';
            img.style.marginTop = (-anchor.y) + 'px';
        }
        if (size) {
            img.style.width = size.x + 'px';
            img.style.height = size.y + 'px';
        }
    }
});

/**
 * Center the map based on the array of LatLng.
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
 * Sets up an empty map with the CloudMade tile layer.
 * @return {window.L.Map} The map
 */
ops.leaflet.setupMap = function () {
    // initialize the map on the "map" div with a given center and zoom
    map = new window.L.Map('map', {
        center: new window.L.LatLng(40, -89),
        zoom: 4
    });
    // create a CloudMade tile layer and add the CloudMade layer to the map
    var cloudMade = new window.L.TileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
        maxZoom: 18
    });
    map.addLayer(cloudMade);

    return map;
};

/**
 * Add a popup to the marker.
 * @param {window.L.Marker} marker The marker to add the popup to.
 * @param {string} content The popup's content.
 * @private
 */
ops.leaflet.addPopup_ = function (marker, content) {
    marker.bindPopup(content, {
        closeButton: false
    });

    //on mouseover: open the number marker popup
    marker.on('mouseover', function (e) {
        e.target.openPopup();
    });

    //on mouseout: close the popup
    marker.on('mouseout', function (e) {
        e.target.closePopup();
    });
};

/**
 * Create a LatLng from the location.
 * @param {ops.models.Location} location
 * @return {window.L.LatLng}
 */
ops.leaflet.getLatLng = function (location) {
    return new window.L.LatLng(location.latitude, location.longitude);
};

/**
 * Draw the depots on the map.
 * @param {window.L.Map} map
 * @param {ops.models.Location} depots
 * @return {window.L.LayerGroup} The depot resources added to the map.
 */
ops.leaflet.drawDepots = function (map, depots) {
    //track the depot resources added to the map
    var depotsGroup = new window.L.LayerGroup();
    var d;

    for (d in depots) {
        var depot = depots[d];

        var location = ops.leaflet.getLatLng(depot);

        var icon = window.L.Icon.extend({
            iconUrl: ops.ui.ImageUrls.DEPOT,
            shadowUrl: null,
            iconSize: new window.L.Point(24, 18),
            iconAnchor: new window.L.Point(12, 9),
            shadowSize: new window.L.Point(0, 0),
            popupAnchor: new window.L.Point(0, -10)
        });
        var depotIcon = new icon();

        var marker = new window.L.Marker(location, {
            icon: depotIcon
        });

        //setup marker popup
        ops.leaflet.addPopup_(marker, "<b>" + depot.name + "</b>");

        //add the depot layer to the group
        depotsGroup.addLayer(marker);
    }

    map.addLayer(depotsGroup);

    return depotsGroup;
};

/**
 * Draw the resources and their latest points on the map.
 * @param map The map.
 * @param {Array.<ops.models.ResourceWithLastPoint>} resources The resources to draw on the map.
 * @param {ops.tools.ValueSelector} routeColorSelector The route color selector.
 * @param {function(ops.models.RouteDestination)=} opt_destinationSelected A function to perform when a route destination is selected (optional).
 * @return {window.L.LayerGroup} The resources added to the map.
 */
ops.leaflet.drawResources = function (map, resources, routeColorSelector) {
    ops.resourcesGroup = new window.L.LayerGroup();
    var r;

    //draw each resource on the map
    for (r in resources) {
        var resource = resources[r];
        var rotateDegrees = resource.heading;

        var color = routeColorSelector.getValue(resource.routeId);
        var locationLatLng = new window.L.LatLng(resource.latitude, resource.longitude);

        var url = ops.ui.ImageUrls.TRUCK;
        if (resource.source === ops.models.DevicePlatform.IPHONE) {
            url = ops.ui.ImageUrls.APPLE;
        } else if (resource.source === ops.models.DevicePlatform.ANDROID) {
            url = ops.ui.ImageUrls.ANDROID;
        }
        /** Create a point at the current location */
        window.L.ResourceIcon = window.L.Icon.extend({
            iconUrl: url,
            shadowUrl: null,
            iconSize: new window.L.Point(14, 14),
            iconAnchor: new window.L.Point(7.2, 7.4),
            shadowSize: new window.L.Point(0, 0),
            popupAnchor: new window.L.Point(0, -7),
            routeId: resource.routeId
        });

        var icon = new window.L.ResourceIcon();
        /** Set the text for the popup */
        var popupContent = "<p class='speed'><b>" + resource.entityName + "</b><br />Speed: "
            + Math.round(resource.speed) + " mph " + ops.tools.getDirection(rotateDegrees) + "</p>";

        var marker = new window.L.Marker(locationLatLng, {
            icon: icon
        });
        ops.leaflet.addPopup_(marker, popupContent);

        /** Create the icon for the direction arrow */
        icon = new window.L.ArrowIcon();
        /** Create the marker for the direction arrow */
        var arrow = new window.L.ArrowMarker(locationLatLng, { icon: icon, angle: rotateDegrees });
        ops.leaflet.addPopup_(arrow, popupContent);

        /** Create the "route-colored" circle */
        var circle = new window.L.CircleMarker(locationLatLng, {
            radius: 10.5,
            weight: 0.5,
            opacity: 1,
            color: color,
            fillOpacity: 1,
            fillColor: color,
            clickable: false
        });
        /** Add current marker to the map */
        ops.resourcesGroup.addLayer(circle);
        ops.resourcesGroup.addLayer(arrow);
        ops.resourcesGroup.addLayer(marker);
    }
    /** Add the resources to the map */
    map.addLayer(ops.resourcesGroup);
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
ops.leaflet.drawRoutes = function (map, routes, routeColorSelector, shouldCenter, opt_routeSelected) {
    //keep track of the destination's locations to center the map on
    var destinationLatLngs = [];

    //track the route resources added to the map
    ops.routesGroup = new window.L.LayerGroup();

    var r;
    //iterate through each route
    for (r in routes) {
        var route = routes[r];

        var d;
        //add markers for each route destination
        for (d in route.routeDestinations) {
            var destination = route.routeDestinations[d];
            var location = destination.location;
            var locationLatLng = ops.leaflet.getLatLng(location);

            //include this location in the bounds to center on
            destinationLatLngs.push(locationLatLng);

            //add a number marker based on the destination's order in the route
            var numMarker = new window.L.Marker(locationLatLng, {
                icon: new window.L.DivIcon({
                    number: destination.orderInRoute,
                    //tag this with the related destination for invoking opt_destinationSelected
                    routeId: route.id
                })
            });

            //todo make circle marker clickable
            //add a circle behind the number
            var marker = new window.L.CircleMarker(locationLatLng, {
                radius: 7,
                opacity: 1,
                weight: 1,
                color: "#ffffff",
                fillColor: routeColorSelector.getValue(route.id),
                fillOpacity: 1,
                clickable: false
            });

            //if the onRouteSelected callback was defined, invoke it when the number marker is clicked
            if (opt_routeSelected) {
                numMarker.on('click', function (e) {
                    opt_routeSelected(e.target.options.icon.options.routeId);
                });
            }

            //setup marker popup
            ops.leaflet.addPopup_(numMarker, "<b>" + location.name + "</b>");

            //add the markers to the map
            ops.routesGroup.addLayer(marker);
            ops.routesGroup.addLayer(numMarker);
        }
    }
    map.addLayer(ops.routesGroup);

    if (shouldCenter) {
        ops.leaflet.center(map, destinationLatLngs);
    }
};

/**
 * Draws the track points on the map for the given route
 * @param {string} routeId
 */
ops.leaflet.drawTrackPoints = function (trackpoints, resources, routeColorSelector, routeOpacitySelector, routeId) {
    ops.trackPointsGroup = new window.L.LayerGroup();

    var r;
    //Loop through all the resources
    for (r in resources) {
        //Check if the resource is on the selected route
        if (resources[r].routeId == routeId) {
            /** Get the Id of the resource */
            var resourceId;
            if (resources[r].employeeId !== null) {
                resourceId = resources[r].employeeId;
            } else {
                resourceId = resources[r].vehicleId;
            }
            /** creates an empty array(necessary for the polyline to initiate) */
            var latlngs = [];
            /** create a polyline to connect the trackpoints */
            var polyline = new window.L.Polyline(latlngs, {
                color: routeColorSelector.getValue(routeId),
                weight: 2,
                opacity: routeOpacitySelector.getValue(resourceId),
                clickable: false
            });

            /** Loop through every trackpoint */
            for ( var t in trackpoints) {
                /** Check if trackpoint is for the current resource and route*/
                if ((trackpoints[t].id == resourceId) && (trackpoints[t].routeId == routeId)) {
                    var trackPoint = trackpoints[t];
                    var lat = trackPoint.latitude;
                    var lng = trackPoint.longitude;
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
                    /*ops.trackPointsGroup.addLayer(marker);*/
                    /** add current location to the polyline */
                    polyline.addLatLng(location);
                }
            }
            ops.trackPointsGroup.addLayer(polyline);
        }
    }
    /** add the resources to the map */
    map.addLayer(ops.trackPointsGroup);
};