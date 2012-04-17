function mapController($scope, employeesDataSource) {
    //var CurrentDate = new Date();
    //var SelectedRouteId;
    //var SelectedRouteLayer;
    var employees = employeesDataSource.data;

    function clearMap() {
    }

    function drawCalculatedRoutes() {
    }

    function drawHistoricalTrackPoints(routeId) {
    }

    function drawResources() {
        var map = new L.Map("map");
        var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
            maxZoom: 18
        });
        //an array to hold the lat and lng of every point used
        var totalLatLngs = [];
        //create a polyline that includes every point(necessary for correct bounds)
        var allPoints = new L.Polyline(totalLatLngs, {
            weight: 0
        });

        for (var emp in employees) {
            var name = employees[emp].Name;
            var lat = employees[emp].Latitude;
            var lng = employees[emp].Longitude;
            var rotateDegrees = employees[emp].Heading;
            //get the location of the destination
            var location = new L.LatLng(lat, lng);
            var url = "";
            if (employees[emp].Source == "iPhone") {
                url = "../img/apple.png";
            } else {
                url = "../img/android.png";
            }
            //create a point at the current location
            var employeeIcon = L.Icon.extend({
                iconUrl: url,
                iconSize: new L.Point(14, 14),
                iconAnchor: new L.Point(7, 7),
                shadowSize: new L.Point(0, 0),
                popupAnchor: new L.Point(10, 0)
            });
            var icon = new employeeIcon();
            var marker = new L.Marker(location, {
                icon: icon
            });
            var arrowIcon = L.Icon.extend({
                iconUrl: "../img/arrow.png",
                iconSize: new L.Point(26, 26),
                iconAnchor: new L.Point(12, 12),
                shadowSize: new L.Point(0, 0)
            });
            icon = new arrowIcon();
            var arrow = new L.Marker(location, {
                icon: icon
            });

            var ArrowMarker = L.Marker.extend({
                _reset: function () {
                    var pos = this._map.latLngToLayerPoint(this._latlng).round();

                    L.DomUtil.setPosition(this._icon, pos);

                    this._icon.style.WebkitTransform = this._icon.style.WebkitTransform + ' rotate(' + this.options.iconAngle + 'deg)';
                    this._icon.style.MozTransform = 'rotate(' + this.options.iconAngle + 'deg)';
                    this._icon.style.MsTransform = 'rotate(' + this.options.iconAngle + 'deg)';
                    this._icon.style.OTransform = 'rotate(' + this.options.iconAngle + 'deg)';
                }
            });

            arrow = new ArrowMarker(location, { icon: icon, iconAngle: rotateDegrees });

            //$(marker._icon).css({
            //    '-moz-transform': 'rotate(' + rotateDegrees + 'deg)',
            //    '-webkit-transform': 'rotate(' + rotateDegrees + 'deg)',
            //    '-o-transform': 'rotate(' + rotateDegrees + 'deg)',
            //    '-ms-transform': 'rotate(' + rotateDegrees + 'deg)'
            //});

            marker.bindPopup("<b>" + name + "</b><br/> Current Speed: " + employees[emp].Speed + " mph ").openPopup();
            //include this location into the bounds
            allPoints.addLatLng(location);
            //add current marker to the map
            map.addLayer(arrow);
            map.addLayer(marker);//gets the total area used
        }
        var bounds = new L.LatLngBounds(totalLatLngs);
        //get the center of the area used
        var mapCenter = bounds.getCenter();
        map.setView(mapCenter, 12).addLayer(cloudmade);
        //sets the best view(position and zoom level) to fit all the routes
        map.fitBounds(bounds);
    }

    function getHistoricalTrackPoints(date) {
    }

    function getResourcesWithLatestPoint() {
    }

    function getRoutes(date) {
    }

    function setDate(date) {
        //CurrentDate = date;
        //clearMap();
        //getRoutes(date, drawCalculatedRoutes());
        //getHistoricalTrackPoints(date, drawHistoricalTrackPoints(SelectedRouteId));
        //if (date == DateTime.today()) {
            getResourcesWithLatestPoint(drawResources());
        //}
    }

    function setSelectedRoute(routeId) {
        //clearHistoricalTrackPoints();
        //SelectedRouteId = routeId;
        //drawHistoricalTrackPoints(routeId);
    }

    setDate(DateTime.utcNow());
}

function MyCtrl2() {
}