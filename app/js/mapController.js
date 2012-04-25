angular.module("foundOPS").controller('mapController', function ($scope, $defer, resourcesStore, routesStore, trackPointsStore) {
    //#region locals

    //the map instance
    var map;
    //the current date
    var currentDate;
    //the current resources
    var resources;
    //the current routes
    var routes;
    //the current resources
    var trackPoints;
    //Set the rate to refresh resources on the map.
    var resourcesRefreshRate = 100000;
    //Set the rate to refresh routes on the map.
    var routesRefreshRate = 300000;
    //keep track of the resources group so it can be removed from the map when the resources are redrawn
    var resourcesGroup;
    //keep track of the routes group so it can be removed from the map when the routes are redrawn
    var routesGroup;
    //keep track of the trackpoints group so it can be removed from the map when the trackpoints are redrawn
    var trackPointsGroup;
    //keeps track of the initial load, to only center the map once
    var initialLoad = true;
    //The Id of the selected route
    var selectedRouteId;
    //var selectedRouteLayer;

    //#endregion

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
        map.setView(bounds.getCenter(), 11);
        //sets the best view(position and zoom level) to fit all the resources
        map.fitBounds(bounds); //TODO: this only works well in IE
    };

    var clearMap = function () {
        /// <summary>
        /// Remove all objects from the map.
        /// </summary>
        //Remove the resourcesGroup if it exists
        if (resourcesGroup != null)
            map.removeLayer(resourcesGroup);
        //Remove the routesGroup if it exists
        if (routesGroup != null)
            map.removeLayer(routesGroup);
        //Remove the trackpointsGroup if it exists
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);
    };

    var drawCalculatedRoutes = function () {
        /// <summary>
        /// Draws the calculated routes on the map.
        /// </summary>
        //keep track of all the locations of destinations and resources to center the map on
        var routeLatLngs = [];
        
        for (var r in routes) {
            //Remove the previous routes
            if (routesGroup != null)
                map.removeLayer(routesGroup);
            //track the resources so they can be removed when they are redrawn
            routesGroup = new window.L.LayerGroup();
            //iterate through the destinations
            var destinations = routes[r].RouteDestinations;
            for (var d in destinations) {
                var name = destinations[d].Location.Name;
                var lat = destinations[d].Location.Latitude;
                var lng = destinations[d].Location.Longitude;
                //get the location of the destination
                var location = new window.L.LatLng(lat, lng);
                //include this location into the bounds to center on
                routeLatLngs.push(location);
                
                var numMarker = new window.L.Marker(location, {
                    icon: new window.L.DivIcon({ number: destinations[d].OrderInRoute })
                });
                var marker = new window.L.CircleMarker(location, {
                    radius: 7,
                    opacity: 0,
                    fillColor: getRouteColor(routes[r].Id),
                    fillOpacity: 1
                });

                //create a popup for the marker
                numMarker.bindPopup("<b>" + name + "</b>");
                numMarker.on('click', function () {
                    setSelectedRoute(routes[r].Id);
                });
                //marker.on('mouseover', function (e) {
                    //e.target.setRadius(8);
                //});
                //marker.on('mouseout', function (e) {
                    //e.target.setRadius(7);
                //});

                //add current location to the polyline
                //polyline.addLatLng(location);
                //add marker to the map
                routesGroup.addLayer(marker);
                routesGroup.addLayer(numMarker);
            }
            //add completed polyline to the map
            //map.addLayer(polyline);
        }
        map.addLayer(routesGroup);

        //Center the map on the current resources
        center(routeLatLngs);
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

        //go through and draw each resource on the map
        for (var r in resources) {
            var resource = resources[r];
            var name = resource.EntityName;
            var lat = resource.Latitude;
            var lng = resource.Longitude;
            var rotateDegrees = resource.CompassHeading;

            //get the location of the destination
            var location = new window.L.LatLng(lat, lng);

            var url = "../img/truck.png";
            if (resource.TrackSource == "iPhone") {
                url = "../img/apple.png";
            } else if (resource.TrackSource == "Android") {
                url = "../img/android.png";
            }
            //create a point at the current location
            window.L.ResourceIcon = window.L.Icon.extend({
                iconUrl: url,
                iconSize: new window.L.Point(14, 14),
                iconAnchor: new window.L.Point(7, 7),
                shadowSize: new window.L.Point(0, 0),
                popupAnchor: new window.L.Point(0, -5)
            });
            var icon = new window.L.ResourceIcon();
            var marker = new window.L.Marker(location, {
                icon: icon
            });
            //Create the icon for the direction arrow
            icon = new window.L.ArrowIcon();
            var arrow;
            //Create the marker for the direction arrow
            arrow = new window.L.ArrowMarker(location, { icon: icon, angle: rotateDegrees });

            marker.bindPopup("<b>" + name + "</b><br/> Current Speed: " + resource.Speed + " mph").openPopup();

            //add current marker to the map
            resourcesGroup.addLayer(arrow);
            resourcesGroup.addLayer(marker);
        }

        //add the resources to the map
        map.addLayer(resourcesGroup);
    };

    var drawHistoricalTrackPoints = function (routeId) {
        /// <summary>
        /// Draws the resources' trackpoints on the map for the given route.
        /// </summary>
        /// <param name="routeId"></param>
        //remove the previous resources
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);

        //track the resources so they can be removed when they are redrawn
        trackPointsGroup = new window.L.LayerGroup();

        //store the resourceLatLongs to center on (if this is the initial load)
        var trackPointsLatLongs = [];

        //go through and draw each resource on the map
        for (var t in trackPoints) {
            var trackPoint = trackPoints[t];
            var lat = trackPoint.Latitude;
            var lng = trackPoint.Longitude;

            //get the location of the destination
            var location = new window.L.LatLng(lat, lng);

            //include this location into the bounds to center on
            trackPointsLatLongs.push(location);

            //create a point at the current location
            var marker = new window.L.CircleMarker(location, {
                radius: 20,
                stroke: 0,
                fillOpacity: 1
            });

            //add current marker to the map
            trackPointsGroup.addLayer(marker);
        }

        //add the resources to the map
        map.addLayer(trackPointsGroup);
    };

    var getHistoricalTrackPoints = function (date) {
        /// <summary>
        /// Gets the trackpoints for the resources for a given date.
        /// </summary>
        /// <param name="date"></param>
        trackPointsStore.read(date).then(function (data) {
            if (!data) {
                data = [];
            }
            trackPoints = data;
            drawHistoricalTrackPoints(selectedRouteId);
        });
    };

    var getResourcesWithLatestPoint = function (date) {
        /// <summary>
        /// Gets the technicians' and vehicles' latest data.
        /// </summary>
        resourcesStore.read(date).then(function (data) {
            if (!data) {
                data = [];
            }
            resources = data;
            drawResources();
        });

        $defer(getResourcesWithLatestPoint, resourcesRefreshRate);
    };

    var getRoutes = function (date) {
        /// <summary>
        /// Gets the routes for the specified date.
        /// </summary>
        /// <param name="date"></param>
        //Draw the routes on the map
        routesStore.read(date).then(function (data) {
            if (!data) {
                data = [];
            }
            routes = data;
            drawCalculatedRoutes();
        });

        $defer(getRoutes, routesRefreshRate);
    };

    var setDate = function (date) {
        /// <summary>
        /// Sets the date to the specified date and regenerates the map objects.
        /// </summary>
        /// <param name="date"></param>
        currentDate = date;
        var month = date.getUTCMonth() + 1;
        var day = date.getUTCDate(); // TODO:make this get the day of the month(it's currently the day of the week)
        var year = date.getUTCFullYear();
        var newDate = month + "-" + day + "-" + year;
        clearMap();
        getRoutes(newDate);
        //getHistoricalTrackPoints(newDate);
        //if (date.date() == DateTime.utcNow().date()) {
        getResourcesWithLatestPoint(newDate);
        //}
    };

    //Set the date to today.
    setDate(new Date());

    var setSelectedRoute = function (routeId) {
        /// <summary>
        /// Sets the selected route.
        /// </summary>
        /// <param name="routeId">The selected route.</param>
        //Remove the previous trackpoints
        if (trackPointsGroup != null)
            map.removeLayer(trackPointsGroup);
        //Update the selected route
        selectedRouteId = routeId;
        //Draw the trackpoints on the map
        //drawHistoricalTrackPoints(routeId);
    };
    
    var colors = [
        "#0099ff", //light blue
        "#FF9900", //orange
        "#00ff00", //lime green
        "#990000", //dark red
        "#FFEE00", //yellow
        "#660099", //purple
        "#ff0000", //red
        "#663300", //brown
        "#FF00CC", //pink
        "#006600"  //dark green
    ];
    var colorIndex = 0;
    var routeColors = [];
    var minOpacity = .3;
    var maxOpacity = .8;

    var getOpacity = function (index) {
    };

    var getRouteColor = function (routeId) {
        //check if routeId is in RouteColors
        for (var obj in routeColors) {
            if (obj.Id == routeId)
                return obj.color;
        }
        routeColors.push(new routeColor(routeId, colors[colorIndex]));
        return colors[colorIndex];

        colorIndex++;
        if (colorIndex > 9)
            colorIndex = 0;
    };

    var routeColor = function (routeId, color) {
        this.color = color;
        this.routeId = routeId;
    };
});