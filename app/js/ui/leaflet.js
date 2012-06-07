//region Using
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
//endregion

//region Methods
/**
 * Sets up an empty map with the CloudMade tile layer.
 * @return {window.L.Map} map
 */
ops.leaflet.setupMap = function () {
    // initialize the map on the "map" div with a given center and zoom
    var map = new window.L.Map('map', {
        center: new window.L.LatLng(40, -89),
        zoom: 4
    });
    // create a CloudMade tile layer and add it to the map
    var cloudMade = new window.L.TileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
        maxZoom: 18
    });
    map.addLayer(cloudMade);

    return map;
};

/**
 * Center the map based on the array of LatLng.
 * @param {window.L.Map} map The map to center on the resources.
 * @param {Array.<window.L.LatLng>} resources An array of latitude and longitudes to center on.
 */
ops.leaflet.center = function (map, locations) {
    // get the total area used
    var bounds = new window.L.LatLngBounds(locations);
    //Sets the best view(position and zoom level) to fit all the locations(This only works perfectly in IE)
    map.fitBounds(bounds);
};

/**
 * Add a popup to the marker.
 * @param {window.L.Marker} marker The marker to add the popup to.
 * @param {string} content The popup's content.
 * @private
 */
ops.leaflet.addPopup_ = function (marker, content) {
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
 * Add a click function the the marker
 * @param {window.L.Marker} marker
 * @param {function(ops.models.Route)=} selected A function to perform when a route is selected (optional).
 */
var addMarkerClick = function (marker, opt_selected) {
    marker.on('click', function (e) {
        opt_selected(e.target.options.icon.routeId);
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
 * Add a depot to the layer.
 * @param {window.L.LayerGroup} layer The layer to add the depot's marker to.
 * @param {ops.models.Location} depot The depot to draw.
 */
ops.leaflet.drawDepot_ = function (layer, depot) {
    var location = ops.leaflet.getLatLng(depot);
    var Icon = window.L.Icon.extend({
        iconUrl: ops.ui.ImageUrls.DEPOT,
        shadowUrl: null,
        iconSize: new window.L.Point(24, 18),
        iconAnchor: new window.L.Point(12, 9),
        shadowSize: new window.L.Point(0, 0),
        popupAnchor: new window.L.Point(0, -10)
    });
    var depotIcon = new Icon();
    var marker = new window.L.Marker(location, {
        icon: depotIcon
    });
    //setup marker popup
    ops.leaflet.addPopup_(marker, "<b>" + depot.name + "</b>");
    //add the depot layer to the group
    layer.addLayer(marker);
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
        ops.leaflet.drawDepot_(depotsGroup, depot);
    }

    map.addLayer(depotsGroup);

    return depotsGroup;
};

/**
 * Add a resource to the layer.
 * @param {window.L.LayerGroup} layer The layer to add the resource's markers to.
 * @param {ops.models.ResourceWithLastPoint} resource The resource to draw.
 * @param {ops.tools.ValueSelector} routeColorSelector The route color selector.
 * @param {function(ops.models.Route)=} opt_routeSelected A function to perform when a route is selected (optional).
 * @private
 */
ops.leaflet.drawResource_ = function (layer, resource, routeColorSelector, opt_routeSelected) {
    var rotateDegrees = resource.heading;
    var color = routeColorSelector.getValue(resource.routeId);
    var locationLatLng = new window.L.LatLng(resource.latitude, resource.longitude);
    var iconUrl = ops.ui.ImageUrls.TRUCK;
    if (resource.source === ops.models.DevicePlatform.IPHONE) {
        iconUrl = ops.ui.ImageUrls.APPLE;
    } else if (resource.source === ops.models.DevicePlatform.ANDROID) {
        iconUrl = ops.ui.ImageUrls.ANDROID;
    }

    //For each resource add
    //a) circle marker for the background
    //b) an icon for the resource (apple, android, truck)
    //c) an icon arrow that rotates

    //a) circle marker for the background
    var circleMarker = new window.L.CircleMarker(locationLatLng, {
        radius: 10.5,
        weight: 0.5,
        opacity: 1,
        color: color,
        fillOpacity: 1,
        fillColor: color,
        clickable: false
    });
    layer.addLayer(circleMarker);

    //b) an icon for the resource (apple, android, truck)
    var resourceIcon = new window.L.Icon();
    $.extend(resourceIcon, {
        iconUrl: iconUrl,
        shadowUrl: null,
        iconSize: new window.L.Point(14, 14),
        iconAnchor: new window.L.Point(7, 7),
        shadowSize: new window.L.Point(0, 0),
        popupAnchor: new window.L.Point(0, -7),
        routeId: resource.routeId
    });

    //set the text for the popup
    var popupContent = "<p class='speed'><b>" + resource.entityName + "</b><br />Speed: "
        + Math.round(resource.speed) + " mph " + ops.tools.getDirection(rotateDegrees) + "</p>";

    var iconMarker = new window.L.Marker(locationLatLng, {
        icon: resourceIcon
    });
    ops.leaflet.addPopup_(iconMarker, popupContent);
    layer.addLayer(iconMarker);

    //c) an icon arrow that rotates
    var arrowIcon = new window.L.Icon();
    $.extend(arrowIcon, {
        routeId: resource.routeId,
        iconUrl: ops.ui.ImageUrls.OUTER_CIRCLE,
        shadowUrl: null,
        iconSize: new window.L.Point(18.5, 18.5),
        iconAnchor: new window.L.Point(9, 9),
        shadowSize: new window.L.Point(0, 0),
        popupAnchor: new window.L.Point(0, -9),
        initialize: function (options) {
            window.L.Util.setOptions(this, options);
        }});

    //create the marker for arrow
    var arrowMarker = new window.L.Marker(locationLatLng, {
        icon: arrowIcon,
        angle: rotateDegrees,
        _reset: function () {
            var pos = this._map.latLngToLayerPoint(this._latlng).round();
            window.L.DomUtil.setPosition(this._icon, pos);

            //setup rotate functionality
            var rotateString = 'rotate(' + this.options.angle + 'deg)';
            this._icon.style.WebkitTransform += rotateString;
            this._icon.style.MozTransform = rotateString;
            this._icon.style.msTransform = rotateString;
            this._icon.style.OTransform = rotateString;
        }
    });
    ops.leaflet.addPopup_(arrowMarker, popupContent);

    //if the onRouteSelected callback was defined, invoke it when the marker is clicked
    if (opt_routeSelected) {
        addMarkerClick(arrowMarker, opt_routeSelected);
    }
    //add current marker to the map
    layer.addLayer(arrowMarker);
};

/**
 * Draw the resources and their latest points on the map.
 * @param {window.L.Map} map The map.
 * @param {Array.<ops.models.ResourceWithLastPoint>} resources The resources to draw on the map.
 * @param {ops.tools.ValueSelector} routeColorSelector The route color selector.
 * @param {function(ops.models.Route)=} opt_routeSelected A function to perform when a route is selected (optional).
 * @return {window.L.LayerGroup} The resources added to the map.
 */
ops.leaflet.drawResources = function (map, resources, routeColorSelector, opt_routeSelected) {
    var resourcesGroup = new window.L.LayerGroup();
    var r;

    //draw each resource on the map
    for (r in resources) {
        var resource = resources[r];
        ops.leaflet.drawResource_(resourcesGroup, resource, routeColorSelector, opt_routeSelected);
    }

    //add the resources to the map
    map.addLayer(resourcesGroup);

    return resourcesGroup;
};

/**
 * Add the destination to the layer
 * @param {window.L.LayerGroup} layer The layer to add the destination's markers to.
 * @param {ops.models.RouteDestination} destination The destination to draw.
 * @param {string} routeId The id of the route
 * @param {ops.tools.ValueSelector} routeColorSelector The route color selector.
 * @param {function(ops.models.Route)=} opt_routeSelected A function to perform when a route is selected (optional).
 * @return {window.L.LatLng} The destination's window.L.LatLng.
 * @private
 */
ops.leaflet.drawDestination_ = function (layer, destination, routeId, routeColorSelector, opt_routeSelected) {
    var location = destination.location;
    var locationLatLng = ops.leaflet.getLatLng(location);

    //an icon for the destination
    var destinationIcon = new window.L.Icon();
    //extend the icon to include text
    $.extend(destinationIcon, {
        number: destination.orderInRoute,
        //tag this with the related destination for invoking opt_routeSelected
        routeId: routeId,
        popupAnchor: new window.L.Point(0, -7),
        options: {
            className: 'leaflet-div-icon'
        },
        createIcon: function () {
            var div = document.createElement('div');
            /** Next 4 lines were custom added */
            var numdiv = document.createElement('div');
            numdiv.setAttribute("class", "number");
            numdiv.innerHTML = this.number || '';
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

    //add a number marker with the destination's order in the route
    var numMarker = new window.L.Marker(locationLatLng, {
        icon: destinationIcon
    });

    //todo make circle marker clickable
    //add a circle behind the number
    var marker = new window.L.CircleMarker(locationLatLng, {
        radius: 7,
        opacity: 1,
        weight: 1,
        color: "#ffffff",
        fillColor: routeColorSelector.getValue(routeId),
        fillOpacity: 1,
        clickable: false
    });

    //if the onRouteSelected callback was defined, invoke it when the number marker is clicked
    if (opt_routeSelected) {
        addMarkerClick(numMarker, opt_routeSelected);
    }

    //setup marker popup
    ops.leaflet.addPopup_(numMarker, "<b>" + location.name + "</b>");

    //add the markers to the map
    layer.addLayer(marker);
    layer.addLayer(numMarker);

    return locationLatLng;
};

/**
 * Draw the route's destinations with markers on the map.
 * @param {window.L.Map} map The map.
 * @param {Array.<ops.models.Route>} routes The routes to draw on the map.
 * @param {ops.tools.ValueSelector} routeColorSelector The route color selector.
 * @param {boolean} shouldCenter Center the map on the added items.
 * @param {function(ops.models.Route)=} opt_routeSelected A function to perform when a route is selected (optional).
 * @return {window.L.LayerGroup} The route destinations added to the map.
 */
ops.leaflet.drawRoutes = function (map, routes, routeColorSelector, shouldCenter, opt_routeSelected) {
    //keep track of the destination's locations to center the map on
    var destinationLatLngs = [];
    //track the route resources added to the map
    var routesGroup = new window.L.LayerGroup();
    var r;
    //iterate through each route
    for (r in routes) {
        var route = routes[r];
        var d;
        //add markers for each route destination
        for (d in route.routeDestinations) {
            var destination = route.routeDestinations[d];
            var latLng = ops.leaflet.drawDestination_(routesGroup, destination, route.id, routeColorSelector, opt_routeSelected);
            destinationLatLngs.push(latLng);
        }
    }
    map.addLayer(routesGroup);

    if (shouldCenter) {
        ops.leaflet.center(map, destinationLatLngs);
    }

    return routesGroup;
};

/**
 * Add a trackpoint to the polyline
 * @param {window.L.Polyline} polyline The line of all the trackpoints.
 * @param {ops.models.TrackPoint} trackPoint The trackpoint to draw.
 * @private
 */
ops.leaflet.drawTrackPoint_ = function (polyline, trackPoint) {
    var lat = trackPoint.latitude;
    var lng = trackPoint.longitude;
    //get the location of the destination
    var location = new window.L.LatLng(lat, lng);
    //create a point at the current location
    /*var marker = new window.L.CircleMarker(location, {
     clickable: false,
     radius: 3,
     stroke: 0,
     fillOpacity: routeOpacitySelector.getValue(mapTrackPoints[t].Id),
     fillColor: routeColorSelector.getValue(mapTrackPoints[t].RouteId)
     });*/
    //add current marker to the map
    //ops.trackPointsGroup.addLayer(marker);
    //add current location to the polyline
    polyline.addLatLng(location);
};

/**
 * Draws the track points on the map for the given route
 * @param {window.L.Map} map
 * @param {Array<ops.models.TrackPoint>} trackpoints
 * @param {Array<ops.models.ResourceWithLastPoint>} resources
 * @param {ops.tools.ValueSelector} routeColorSelector
 * @param {ops.tools.ValueSelector} routeOpacitySelector
 * @param {string} routeId The id of the route to draw
 * @return {window.L.LayerGroup} The historical trackpoints added to the map.
 */
ops.leaflet.drawTrackPoints = function (map, trackpoints, resources, routeColorSelector, routeOpacitySelector, routeId) {
    var trackPointsGroup = new window.L.LayerGroup();

    var r;
    //loop through all the resources
    for (r in resources) {
        //Check if the resource is on the selected route
        if (resources[r].routeId == routeId) {
            //get the Id of the resource
            var resourceId;
            if (resources[r].employeeId !== null) {
                resourceId = resources[r].employeeId;
            } else {
                resourceId = resources[r].vehicleId;
            }
            //creates an empty array(necessary for the polyline to initiate)
            var latlngs = [];
            //create a polyline to connect the trackpoints
            var polyline = new window.L.Polyline(latlngs, {
                color: routeColorSelector.getValue(routeId),
                weight: 2,
                opacity: routeOpacitySelector.getValue(resourceId),
                clickable: false
            });

            var t;
            //loop through every trackpoint
            for (t in trackpoints) {
                //check if trackpoint is for the current resource and route
                if ((trackpoints[t].id == resourceId) && (trackpoints[t].routeId == routeId)) {
                    var trackPoint = trackpoints[t];
                    ops.leaflet.drawTrackPoint_(polyline, trackPoint);
                }
            }
            trackPointsGroup.addLayer(polyline);
        }
    }
    //add the resources to the map
    map.addLayer(trackPointsGroup);

    return trackPointsGroup;
};
//endregion