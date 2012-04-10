'use strict';
/* App Controllers */


function RoutesMapCtrl() {
    var map = new L.Map('map');

    var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    });

    var london = new L.LatLng(51.505, -0.09); // geographical point (longitude and latitude)
    map.setView(london, 13).addLayer(cloudmade);

    var markerLocation1 = new L.LatLng(51.509, -0.08);
    var markerLocation2 = new L.LatLng(51.503, -0.06);
    var markerLocation3 = new L.LatLng(51.51, -0.047);

    var MyIcon = L.Icon.extend({
        //iconUrl: 'my-icon.png'
    });

    var icon = new MyIcon();

    var marker1 = new L.Marker(markerLocation1, { icon: icon });
    var marker2 = new L.Marker(markerLocation2);
    var marker3 = new L.Marker(markerLocation3);

    marker1.bindPopup("Lowes");
    marker2.bindPopup("Home Depot");
    marker3.bindPopup("Menards");

    map.addLayer(marker1);
    map.addLayer(marker2);
    map.addLayer(marker3);
    /*for(var r in routes){
			for(var rd in route){*/
    var p1 = new L.LatLng(51.509, -0.08),
					p2 = new L.LatLng(51.503, -0.06),
					p3 = new L.LatLng(51.51, -0.047),
					polylinePoints = [p1, p2, p3];
    /*}
		}*/
    var polylines = new L.Polyline(polylinePoints);
    map.addLayer(polylines);

    polylines.bindPopup("I am a route.");

    map.on('click', onMapClick);

    var popup = new L.Popup();

    function onMapClick(e) {
        var latlngStr = '(' + e.latlng.lat.toFixed(3) + ', ' + e.latlng.lng.toFixed(3) + ')';

        popup.setLatLng(e.latlng);
        popup.setContent("You clicked the map at " + latlngStr);

        map.openPopup(popup);
    }
}
RoutesMapCtrl.$inject = [];


function MyCtrl2() {
}
MyCtrl2.$inject = [];
