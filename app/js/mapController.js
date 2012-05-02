angular.module("foundOPS").controller('mapController', function ($scope, $defer, depotStore, resourcesStore, routesStore, trackPointsStore) {
    //#region Locals

    //the map instance
    var map;
    //keep track of if initial load
    var isInitialLoad = true;
    //the business's depot
    var depot;
    //the current resources
    var resources;
    //the current routes
    var routes;
    //the current resources
    var trackPoints;
    //Set the rate to refresh resources on the map.
    var resourcesRefreshRate = 10000;
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

    //#region Map Methods

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
        //Sets the best view(position and zoom level) to fit all the resources
        map.fitBounds(bounds); //This only works perfectly in IE
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
    
    //#endregion

    //#region Draw Objects

    var drawCalculatedRoutes = function () {
        /// <summary>
        /// Draws the calculated routes on the map.
        /// </summary>
        //keep track of all the locations of destinations and resources to center the map on
        var routeLatLngs = [];
        //Remove the previous routes
        if (routesGroup != null)
            map.removeLayer(routesGroup);
        
        //track the resources so they can be removed when they are redrawn
        routesGroup = new window.L.LayerGroup();
        
        for (var r in routes) {
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
                    fillColor: getRouteColor(routes[r].Id),
                    fillOpacity: 1,
                    clickable: false
                });

                //create a popup for the marker
                numMarker.bindPopup("<b>" + name + "</b>");
                numMarker.on('click', function (e) {
                    setSelectedRoute(e.target.options.icon.options.routeId);
                });
                numMarker.on('mouseover', function (e) {
                    e.target.openPopup();
                });
                numMarker.on('mouseout', function (e) {
                    e.target.closePopup();
                });
                //add marker to the map
                routesGroup.addLayer(marker);
                routesGroup.addLayer(numMarker);
            }
        }
        map.addLayer(routesGroup);

        //Center the map on the current resources(if this is the initial load)
        if (isInitialLoad)
            center(routeLatLngs);
        isInitialLoad = false;
    };

    var drawDepot = function () {
    	/// <summary>
    	/// Draws the depot on the map.
    	/// </summary>
        //var name = depot.Name; //TODO: add this
        var lat = 40.4;//depot.Latitude;
        var lng = -86.6;//depot.Longitude;

        //Get the location of the destination
        var location = new window.L.LatLng(lat, lng);
        
        var icon = window.L.Icon.extend({
            iconUrl: "../img/depot.png",
            iconSize: new window.L.Point(20, 15),
            iconAnchor: new window.L.Point(10, 7.5),
            shadowSize: new window.L.Point(0, 0),
            popupAnchor: new window.L.Point(0, -8)
        });
        var depotIcon = new icon();
        var marker = new window.L.Marker(location, {
            icon: depotIcon
        });//.bindPopup("<b>" + name + "</b>");
        
        //add depot marker to the map
        map.addLayer(marker);
    };

    var drawResources = function () {
        /// <summary>
        /// Draws the resources on the map.
        /// </summary>
        //Remove the previous resources
        if (resourcesGroup != null)
            map.removeLayer(resourcesGroup);

        //Track the resources so they can be removed when they are redrawn
        resourcesGroup = new window.L.LayerGroup();

        //Go through and draw each resource on the map
        for (var r in resources) {
            var resource = resources[r];
            var name = resource.EntityName;
            var lat = resource.Latitude;
            var lng = resource.Longitude;
            var rotateDegrees = resource.CompassHeading;
            var color = getRouteColor(resource.RouteId);

            //Get the location of the destination
            var location = new window.L.LatLng(lat, lng);

            var url = "../img/truck.png";
            if (resource.TrackSource == "iPhone") {
                url = "../img/apple.png";
            } else if (resource.TrackSource == "Android") {
                url = "../img/android.png";
            }
            //Create a point at the current location
            window.L.ResourceIcon = window.L.Icon.extend({
                iconUrl: url,
                iconSize: new window.L.Point(14, 14),
                iconAnchor: new window.L.Point(7.5, 7.6),
                shadowSize: new window.L.Point(0, 0),
                popupAnchor: new window.L.Point(0, -7),
                routeId: resource.RouteId
            });
            var icon = new window.L.ResourceIcon();
            
            var popoupContent = "<p class='speed'><b>" + name + "</b><br />Speed: " + Math.round(resource.Speed) + " mph " + getDirection(rotateDegrees) + "</p>";
            var marker = new window.L.Marker(location, {
                icon: icon
            }).bindPopup(popoupContent);
            marker.on('click', function (e) {
                setSelectedRoute(e.target.options.icon.routeId);
            });
            marker.on('mouseover', function (e) {
                e.target.openPopup();
            });
            //Create the icon for the direction arrow
            icon = new window.L.ArrowIcon({
                routeId: resource.RouteId
            });
            //Create the marker for the direction arrow
            var arrow = new window.L.ArrowMarker(location, { icon: icon, angle: rotateDegrees }).bindPopup(popoupContent);
            arrow.on('click', function (e) {
                setSelectedRoute(e.target.options.icon.options.routeId);
            });
            arrow.on('mouseover', function (e) {
                e.target.openPopup();
            });
            arrow.on('mouseout', function (e) {
                e.target.closePopup();
            });

            var circle = new window.L.CircleMarker(location, {
                radius: 10.5,
                weight: .5,
                opacity: 1,
                color: color,
                fillOpacity: 1,
                fillColor: color,
                clickable: false
            });
            
            //Add current marker to the map
            resourcesGroup.addLayer(circle);
            resourcesGroup.addLayer(arrow);
            resourcesGroup.addLayer(marker);
        }

        //Add the resources to the map
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
            if(trackPoints[t].RouteId == routeId) {
                var trackPoint = trackPoints[t];
                var lat = trackPoint.Latitude;
                var lng = trackPoint.Longitude;

                //get the location of the destination
                var location = new window.L.LatLng(lat, lng);

                //include this location into the bounds to center on
                trackPointsLatLongs.push(location);

                //create a point at the current location
                var marker = new window.L.CircleMarker(location, {
                    clickable: false,
                    radius: 3,
                    stroke: 0,
                    fillOpacity: getOpacity(trackPoints[t].Id),
                    fillColor: getRouteColor(trackPoints[t].RouteId)
                });
                marker.on('onload', function (e) {
                    e.target.closePopup();
                });
                //add current marker to the map
                trackPointsGroup.addLayer(marker);
            }
        }

        //add the resources to the map
        map.addLayer(trackPointsGroup);
    };
    
    //#endregion
    
    drawDepot(); //TODO: remove from here
    
    //#region Get Data

    var getDepot = function() {
        /// <summary>
        /// Gets the business's depot
        /// </summary>
        depotStore.read().then(function (data) {
            if (!data) {
                data = [];
            }
            depot = data;
            drawDepot();
        });
    };

    var getHistoricalTrackPoints = function (date, routeId) {
        /// <summary>
        /// Gets the trackpoints for the resources for a given date.
        /// </summary>
        /// <param name="date"></param>
        trackPointsStore.read(date, routeId).then(function (data) {
            if (!data) {
                data = [];
            }
            trackPoints = data;
            drawHistoricalTrackPoints(routeId);
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
            //TODO: get trackpoint here(for each route)
        });

        $defer(getRoutes, routesRefreshRate);
    };
    
    //#endregion
    
    //#region Date Methods

    var setDate = function (date) {
        /// <summary>
        /// Sets the date to the specified date and regenerates the map objects.
        /// </summary>
        /// <param name="date"></param>
        //reset the initial load(so the map gets re-centered)
        isInitialLoad = true;
        var newDate = formatDate(date);
        clearMap();
        getRoutes(newDate);
        //for(var r in routes) {
        //getHistoricalTrackPoints(newDate, "735A4D79-F080-4BFB-ACF7-059D44A48919"); //TODO: don't use static routeId(use for loop, routes[r].Id)
        //}
        
        if (newDate == currentDate) {
            getResourcesWithLatestPoint(newDate);
        }
    };

    var formatDate = function(date) {
        var month = date.getUTCMonth() + 1;
        var day = date.getUTCDate();
        var year = date.getUTCFullYear();
        return month + "-" + day + "-" + year;
    };

    //Set the current date to today
    var currentDate = formatDate(new Date());

    //Set the date to today.
    setDate(new Date());
    
    //#endregion
    
    //#region Opacity

    var opacities = [
        .80,
        .75,
        .70,
        .65,
        .60,
        .55,
        .50,
        .45,
        .40,
        .35,
        .30
    ];
    var opacityIndex = 0;
    var resourceOpacities = [];

    var resourceOpacity = function (resourceId, opacity) {
        this.opacity = opacity;
        this.resourceId = resourceId;
    };

    var getOpacity = function (resourceId) {
        //check if routeId is in resourceOpacities
        for (var obj in resourceOpacities) {
            if (resourceOpacities[obj].Id == resourceId)
                return resourceOpacities[obj].opacity;
        }
        resourceOpacities.push(new resourceOpacity(resourceId, opacities[opacityIndex]));
        var opacity = opacities[opacityIndex];

        opacityIndex++;
        if (opacityIndex > 10)
            opacityIndex = 0;

        return opacity;
    };
    
    //#endregion
    
    //#region Color
    
    var colors = [
        "#194A91", //dark blue
        "#ff0000", //red
        "#03EA03", //lime green
        "#663300", //brown
        "#660099", //purple
        "#FF9900", //orange
        "#0099ff", //light blue
        "#006600", //dark green
        "#990000", //dark red
        "#FF00CC"  //pink
    ];
    var colorIndex = 0;
    var routeColors = [];

    var getRouteColor = function (routeId) {
        //Check if routeId is in RouteColors
        for (var obj in routeColors) {
            if (routeColors[obj].routeId == routeId)
                return routeColors[obj].color;
        }
        routeColors.push(new routeColor(routeId, colors[colorIndex]));
        var color = colors[colorIndex];

        colorIndex++;
        if (colorIndex > 9)
            colorIndex = 0;

        return color;
    };

    var routeColor = function (routeId, color) {
        this.color = color;
        this.routeId = routeId;
    };
    
    //#endregion

    //Add the depot to the map
    //getDepot(); //TODO: add this

    var getDirection = function (deg) {
    	/// <summary>
    	/// Generates a compass direction from rotation degrees.
    	/// </summary>
    	/// <param name="deg">The degrees(0 to 360)</param>
    	/// <returns>The compass direction(ex. NE)</returns>
        var dir;
        //Account for negaive degrees(convert to number between 0 and 360)
        while (deg < 0) {
            deg += 360;
        }
        //Account for values above 360(convert to number between 0 and 360)
        while (deg > 360) {
            deg -= 360;
        }
        if ((deg >= 0 && deg <= 11.25) || (deg > 348.75 && deg <= 360)) {
            dir = "N";
        }else if (deg > 11.25 && deg <= 33.75) {
            dir = "NNE";
        }else if (deg > 33.75 && deg <= 56.25) {
            dir = "NE";
        }else if (deg > 56.25 && deg <= 78.75) {
            dir = "ENE";
        }else if (deg > 78.75 && deg <= 101.25) {
            dir = "E";
        }else if (deg > 101.25 && deg <= 123.75) {
            dir = "ESE";
        }else if (deg > 123.75 && deg <= 146.25) {
            dir = "SE";
        }else if (deg > 146.25 && deg <= 168.75) {
            dir = "SSE";
        }else if (deg > 168.75 && deg <= 191.25) {
            dir = "S";
        }else if (deg > 191.25 && deg <= 213.75) {
            dir = "SSW";
        }else if (deg > 213.75 && deg <= 236.25) {
            dir = "SW";
        }else if (deg > 236.25 && deg <= 258.75) {
            dir = "WSW";
        }else if (deg > 258.75 && deg <= 281.25) {
            dir = "W";
        }else if (deg > 281.25 && deg <= 303.75) {
            dir = "WNW";
        }else if (deg > 303.75 && deg <= 326.25) {
            dir = "NW";
        } else { //deg > 326.25 && deg <= 348.75
            dir = "NNW";
        }
        return dir;
    };
    
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
        //Reset the opacity index to 0
        opacityIndex = 0;
        //Draw the trackpoints on the map
        getHistoricalTrackPoints(currentDate, routeId);
        //drawHistoricalTrackPoints(routeId);
    };

});