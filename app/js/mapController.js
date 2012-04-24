'use strict';
angular.module("foundOPS").controller('mapController', function ($scope, $defer, resourcesStore) {
    //the map instance
    var map;

    //the current date
    //var currentDate = new Date();

    //the current resources
    var resources;

    //keep track of the resources group so it can be removed from the map when the resources are redrawn
    var resourcesGroup;

    //keeps track of the initial load, to only center the map once
    var initialLoad = true;

    //var selectedRouteId;
    //var selectedRouteLayer;

    var setupMap = function () {
        // initialize the map on the "map" div with a given center and zoom
        map = new window.L.Map('map', {
            center: new window.L.LatLng(40, -89),
            zoom: 4
        });
        // create a CloudMade tile layer
        var cloudmade = new window.L.TileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
            maxZoom: 18
        });
        // add the CloudMade layer to the map
        map.addLayer(cloudmade);
    };

    setupMap();

    var clearHistoricalTrackPoints = function () {
    };

    var clearMap = function () {
        if (resourcesGroup != null)
            map.removeLayer(resourcesGroup);
        //map.removeLayer(routesGroup);
        //map.removeLayer(trackpointsGroup);
    };

    var drawCalculatedRoutes = function () {
    };

    var drawHistoricalTrackPoints = function (routeId) {
    };

    //center on the latitudes and longitudes
    //resourcesToCenterOn is an array to hold the lat and lng of every point used
    var center = function (resourcesToCenterOn) {
        //gets the total area used
        var bounds = new window.L.LatLngBounds(resourcesToCenterOn);

        //center the map on the bounds
        map.setView(bounds.getCenter(), 12);

        //sets the best view(position and zoom level) to fit all the resources
        map.fitBounds(bounds);
    };

    var drawResources = function () {
        //remove the previous resources
        if (resourcesGroup != null)
            map.removeLayer(resourcesGroup);

        //track the resources so they can be removed when they are redrawn
        resourcesGroup = new window.L.LayerGroup();

        //store the resourceLatLongs to center on (if this is the initial load)
        var resourceLatLongs = [];

        //go through and draw each resource on the map
        for (var r in resources) {
            var resource = resources[r];
            var name = resource.EntityName;
            var lat = resource.Latitude;
            var lng = resource.Longitude;
            var rotateDegrees = resource.CompassHeading;

            //get the location of the destination
            var location = new window.L.LatLng(lat, lng);

            //include this location into the bounds to center on
            resourceLatLongs.push(location);

            var url = "../img/truck.png";
            if (resource.TrackSource == "iPhone") {
                url = "../img/apple.png";
            } else if (resource.TrackSource == "Android") {
                url = "../img/android.png";
            }
            //create a point at the current location
            var employeeIcon = window.L.Icon.extend({
                iconUrl: url,
                iconSize: point(14, 14),
                iconAnchor: point(7, 7),
                shadowSize: point(0, 0),
                popupAnchor: point(0, -5)
            });
            var icon = new employeeIcon();
            var marker = new window.L.Marker(location, {
                icon: icon
            });
            //Create the icon for the direction arrow
            var arrowIcon = window.L.Icon.extend({
                iconUrl: "../img/arrow.png",
                iconSize: point(26, 26),
                iconAnchor: point(12, 12),
                shadowSize: point(0, 0)
            });
            icon = new arrowIcon();
            var arrow;
            //Create the marker for the direction arrow
            var arrowMarker = window.L.Marker.extend({
                _reset: function () {
                    var pos = this._map.latLngToLayerPoint(this._latlng).round();

                    window.L.DomUtil.setPosition(this._icon, pos);

                    this._icon.style.WebkitTransform += ' rotate(' + this.options.angle + 'deg)';
                    this._icon.style.MozTransform = 'rotate(' + this.options.angle + 'deg)';
                    this._icon.style.msTransform = 'rotate(' + this.options.angle + 'deg)';
                    this._icon.style.OTransform = 'rotate(' + this.options.angle + 'deg)';
                }
            });
            arrow = new arrowMarker(location, { icon: icon, angle: rotateDegrees });

            marker.bindPopup("<b>" + name + "</b><br/> Current Speed: " + resource.Speed + " mph").openPopup();

            //add current marker to the map
            resourcesGroup.addLayer(arrow);
            resourcesGroup.addLayer(marker);
        }

        //add the resources to the map
        map.addLayer(resourcesGroup);

        //if this is the initial load, center on the current resources
        if (initialLoad)
            center(resourceLatLongs);

        //reset the initial load flag
        initialLoad = false;
    };

    var getHistoricalTrackPoints = function (date) {
        drawHistoricalTrackPoints(selectedRouteId);
    };

    var getResourcesWithLatestPoint = function () {
        resourcesStore.read().then(function(data) {
            if (!data) {
                data = [];
            }
            resources = data;
            drawResources();
        });
        $defer(getResourcesWithLatestPoint, 100000);
    };

    var getRoutes = function (date) {
        drawCalculatedRoutes();
    };

    var point = function (pointA, pointB) {
        return new window.L.Point(pointA, pointB);
    };

    var setDate = function (date) {
        //var month = date.month() + 1;
        //var day = date.day();
        //var year = date.year();
        //var newDate = month + "-" + day + "-" + year;
        clearMap();
        //getRoutes(newDate);
        //getHistoricalTrackPoints(newDate);
        //if (date.date() == DateTime.utcNow().date()) {
        getResourcesWithLatestPoint();
        //}
    };

    //var setSelectedRoute = function (routeId) {
    //    clearHistoricalTrackPoints();
    //    selectedRouteId = routeId;
    //    drawHistoricalTrackPoints(routeId);
    //};

    setDate(DateTime.utcNow());

});