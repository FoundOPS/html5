'use strict';
angular.module("foundOPS").controller('mapController', function ($scope, $defer, resourcesStore) {
    //the map instance
    var map;
    //the current date
    //var currentDate = new Date();
    //the current resources
    var resources;
    //Set the rate to refresh resources on the map.
    var refreshRate = 10000;
    //keep track of the resources group so it can be removed from the map when the resources are redrawn
    var resourcesGroup;
    //keeps track of the initial load, to only center the map once
    var initialLoad = true;
    //var selectedRouteId;
    //var selectedRouteLayer;

    var setupMap = function () {
    	/// <summary>
    	/// Creates the map.
    	/// </summary>
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

    //Setup an empty map.
    setupMap();

    var center = function (resourcesToCenterOn) {
    	/// <summary>
        /// Centers the map on the latitudes and longitudes.
    	/// </summary>
        /// <param name="resourcesToCenterOn">An array to hold the lat and lng of every point used.</param>
        //gets the total area used
        var bounds = new window.L.LatLngBounds(resourcesToCenterOn);
        //center the map on the bounds
        map.setView(bounds.getCenter(), 12);
        //sets the best view(position and zoom level) to fit all the resources
        map.fitBounds(bounds);
    };

    var drawResources = function () {
    	/// <summary>
    	/// Draws the resources on the map.
    	/// </summary>
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

    var getResourcesWithLatestPoint = function () {
    	/// <summary>
    	/// Gets the technicians' and vehicles' latest data.
    	/// </summary>
        resourcesStore.read().then(function (data) {
            if (!data) {
                data = [];
            }
            resources = data;
            drawResources();
        });
        $defer(getResourcesWithLatestPoint, refreshRate);
    };
    
    var point = function (x, y) {
    	/// <summary>
    	/// Creates a map point(in pixels) at the givin distance.
    	/// </summary>
    	/// <param name="x">The horizontal distance.</param>
    	/// <param name="y">The vertical distance.</param>
    	/// <returns>A point.</returns>
        return new window.L.Point(x, y);
    };

    var setDate = function (date) {
    	/// <summary>
    	/// Sets the date to the specified date and regenerates the map objects.
    	/// </summary>
    	/// <param name="date"></param>
        //var month = date.month() + 1;
        //var day = date.day();
        //var year = date.year();
        //var newDate = month + "-" + day + "-" + year;
        //clearMap();
        //getRoutes(newDate);
        //getHistoricalTrackPoints(newDate);
        //if (date.date() == DateTime.utcNow().date()) {
        getResourcesWithLatestPoint();
        //}
    };

    //Set the date to today.
    setDate(DateTime.utcNow());
    
    //#region Not Used
    
    /*var clearMap = function () {
        /// <summary>
        /// Remove all objects from the map.
        /// </summary>
        //Remove the resourcesGroup if it exists
        if (resourcesGroup != null)
            map.removeLayer(resourcesGroup);
        //Remove the routesGroup if it exists
        //if (resourcesGroup != null)
        //map.removeLayer(routesGroup);
        //Remove the trackpointsGroup if it exists
        //if (resourcesGroup != null)
        //map.removeLayer(trackpointsGroup);
    };

    var drawCalculatedRoutes = function () {
        /// <summary>
        /// Draws the calculated routes on the map.
        /// </summary>
    };

    var drawHistoricalTrackPoints = function (routeId) {
        /// <summary>
        /// Draws the resources' trackpoints on the map for the given route.
        /// </summary>
        /// <param name="routeId"></param>
    };

    var getHistoricalTrackPoints = function (date) {
        /// <summary>
        /// Gets the trackpoints for the resources for a given date.
        /// </summary>
        /// <param name="date"></param>
        drawHistoricalTrackPoints(selectedRouteId);
    };
    
    var getRoutes = function (date) {
        /// <summary>
        /// Gets the routes for the specified date.
        /// </summary>
        /// <param name="date"></param>
        //Remove the previous routes
        //if (resourcesGroup != null)
        //map.removeLayer(routesGroup);
        //Draw the routes on the map
        drawCalculatedRoutes();
    };

    var setSelectedRoute = function (routeId) {
        /// <summary>
        /// Sets the selected route.
        /// </summary>
        /// <param name="routeId">The selected route.</param>
        //Remove the previous trackpoints
        //if (resourcesGroup != null)
        //map.removeLayer(trackpointsGroup);
        //Update the selected route
        //selectedRouteId = routeId;
        //Draw the trackpoints on the map
        drawHistoricalTrackPoints(routeId);
    };*/

    //#endregion
});