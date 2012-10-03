// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "ui/ui", "tools/generalTools", "kendo", "lib/leaflet"], function ($, dbServices, fui, generalTools) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        map, cloudmade, marker, icon,
        locationA = {AddressLineOne: "200 N Salisbury St", AddressLineTwo: null, City: "West Lafayette", State: "IN", ZipCode: "47906", Latitude: 40.419034, Longitude: -86.894708},
        locationB = {AddressLineOne: "1305 Cumberland Ave", AddressLineTwo: "Suite 205", City: "West Lafayette", State: "IN", ZipCode: "47906", Latitude: 40.459989, Longitude: -86.930867};
    var locationList = [{AddressLineOne: "223 Main St", AddressLineTwo: null, City: "Lafayette", State: "IN", ZipCode: "47901", Latitude: 40.419119, Longitude: -86.894604},
                        {AddressLineOne: "508 S 4th St", AddressLineTwo: null, City: "Lafayette", State: "IN", ZipCode: "47901", Latitude: 40.424818, Longitude: -86.905616}];

    var Location = Widget.extend({
        init: function (element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            options = that.options;
        },

        renderMap: function (location, addMarker) {
            var _location, that = this;

            var lineOneFormatted = location.AddressLineOne.replace(/\s/g, "+");
            var cityFormatted = location.City.replace(/\s/g, "+");
            var navigateLink = 'https://maps.google.com/maps?q=' + lineOneFormatted + ',+' + cityFormatted + ',+' + location.State + '&z=17';

            _location = $('<h3>Location</h3>' +
                '<div id="locationWidgetMap">' +
                '</div>' +
                '<div id="buttonPane">' +
                '<a class="k-button k-button-icontext k-grid-edit" href="javascript:void(0)"></a>' +
                '<a id="navigateBtn" href=' + navigateLink + '></a>' +
                '</div>' +
                '<div id="editPane">' +
                '<input type="text" />' +
                '<div id="search"></div>' +
                '<ul id="locationList"></ul>' +
                '</div>'
            );

            that.element.append(_location);

            //initialize the map on the "locationWidgetMap" div with a given center and zoom
            map = L.map('locationWidgetMap', {
                center: [location.Latitude, location.Longitude],
                zoom: 15,
                attributionControl: false,
                zoomControl: false
            });
            //create a CloudMade tile layer and add it to the map
            cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18
            });
            map.addLayer(cloudmade);
            icon = L.icon({
                iconUrl: fui.ImageUrls.MARKER,
                iconAnchor: [10,30],
                popupAnchor: [2,-30],
                shadowUrl: fui.ImageUrls.MARKER_SHADOW
            });
            if(addMarker){
                //add a marker at the location, with a popup containing the location name
                marker = L.marker([location.Latitude, location.Longitude],{
                    icon: icon
                }).bindPopup('<button id="saveLocation" class="k-button k-button-icontext" onclick=""><span class="k-icon k-update"></span>Save</button>',{
                        closeButton: false
                    });
                map.addLayer(marker);
            }

            //animate to edit screen
            $("#locationWidget #buttonPane .k-grid-edit").on("click", function () {
                that.showEditScreen();
            });

            //animate back to map from edit screen on when a location is selected from the list
            $("#locationWidget #editPane li").on("click", function (e) {
                that.changeLocation(locationB.Latitude, locationB.Longitude);
                $("#locationWidget #buttonPane").animate({
                    left: "0px"
                },500);
                $("#locationWidget #editPane").animate({
                    left: "-300px"
                },500);
                $("#locationWidgetMap").animate({
                    opacity: "1"
                },500);
            });

            generalTools.observeInput("#locationWidget #editPane", function (string) {
                dbServices.getLocationMatches(string, function (locations) {
                    that.updateLocationList(locations);
                });
            });

            if(!addMarker){
                that.showEditScreen();
            }else{
                $("#navigateBtn").css("display", "block");
            }

            //TODO:remove
            that.updateLocationList(locationList);
        },

        showEditScreen: function () {
            $('#locationWidget #buttonPane').css('width', '250px');
            $('#locationWidget #editPane').css('width', '250px');
            $("#locationWidget #buttonPane").animate({
                left: "300px"
            },500);
            $("#locationWidget #editPane").animate({
                left: "0px"
            },500);
            $("#locationWidgetMap").animate({
                opacity: ".3"
            },500);
        },

        removeMap: function () {
            if(map){
                map.closePopup();
                map.removeLayer(cloudmade);
                map = null;
            }
            $("#locationWidget")[0].innerHTML = "";
        },

        changeLocation: function (newLat, newLng) {
            if(marker){
                map.removeLayer(marker);
            }

            marker = L.marker([newLat, newLng],{
                icon: icon
            }).bindPopup('<button id="saveLocation" class="k-button k-button-icontext" onclick=""><span class="k-icon k-update"></span>Save</button>',{
                    closeButton: false
                });
            map.addLayer(marker);
        },

        getLocationString: function (location) {
            var lineTwo;
            if(!location.AddressLineTwo){
                lineTwo = "";
            }else{
                lineTwo = " " + location.AddressLineTwo;
            }
            return location.AddressLineOne + lineTwo + ", " + location.City + ", " + location.State + " " + location.ZipCode;
        },

        updateLocationList: function (locations) {
            var that = this;
            var list = "", thisLocation;
            $("#locationWidget #locationList")[0].innerHTML = "";
            for(var i in locations){
                thisLocation = locationList[i];
                list += '<li><span class="name">' + that.getLocationString(locationList[i]) + '</span></li>';
            }

            list += '<li><span id="previousLocation"></span><span class="name">' + that.getLocationString(locationA) + '</span></li>' +
                '<li><span id="currentLocation"></span><span class="name">Use Current Location</span></li>' +
                '<li><span id="manuallyDropPin"></span><span class="name">Manually Drop Pin</span></li>';

            $(list).appendTo($("#locationWidget #locationList"));
        },

        options: new kendo.data.ObservableObject({
            name: "Location"
        })
    });

    ui.plugin(Location);
});