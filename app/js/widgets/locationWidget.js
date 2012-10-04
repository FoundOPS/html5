// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "ui/ui", "tools/generalTools", "kendo", "lib/leaflet"], function ($, dbServices, fui, generalTools) {
    $.Widget("location", {
        _create: function() {
            var that = this;
            that._map = {}, that._cloudmade = {}, that._marker = {}, that._icon = {},
                that._currentLocation = "", that._locationList = [], that._allowMapClick = false;
        },

        renderMap: function (location, shouldAddMarker) {
            var _location, that = this, lineOneFormatted;

            if(location.AddressLineOne){
                lineOneFormatted = location.AddressLineOne.replace(/\s/g, "+");
            }else{
                lineOneFormatted = "";
            }

            var adminDistrictTwoFormatted = location.AdminDistrictTwo.replace(/\s/g, "+");
            var adminDistrictOneFormatted = location.AdminDistrictOne.replace(/\s/g, "+");
            var navigateLink = 'https://maps.google.com/maps?q=' + lineOneFormatted + ',+' + adminDistrictTwoFormatted + ',+' + adminDistrictOneFormatted + '&z=17';

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
            that._map = L.map('locationWidgetMap', {
                center: [location.Latitude, location.Longitude],
                zoom: 15,
                attributionControl: false,
                zoomControl: false
            });
            //create a CloudMade tile layer and add it to the map
            that._cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18
            });
            that._map.addLayer(that._cloudmade);

            if(shouldAddMarker){
                that._addMarker(location.Latitude, location.Longitude, false);
            }

            //animate to edit screen
            $("#locationWidget #buttonPane .k-grid-edit").on("click", function () {
                that._showEditScreen();
            });

            //animate back to map from edit screen on when a location is selected from the list
            $("#locationWidget #editPane li").on("click", function (e) {
                //match the index of the selected item to the index of locationList
                var selectedLocation = that._locationList[0];

                that._changeLocation(selectedLocation);
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

            map.on('click', function(e) {
                if(that._allowMapClick){
                    that._addMarker(e.latlng.lat, e.latlng.lng, true);
                }
            });

            $("#manuallyDropPin").on("click", function () {
                that._allowMapClick = true;
            });

            //TODO: set allowMapClick to false on save

            generalTools.observeInput("#locationWidget #editPane", function (string) {
                dbServices.locationSearch(string, function (locations) {
                    that._updateLocationList(locations);
                });
            });

            if(!shouldAddMarker){
                that._showEditScreen();
            }else{
                $("#navigateBtn").css("display", "block");
            }
        },

        _addMarker: function (lat, lng, addPopup) {
            var that = this;
            if(that._marker){
                that._map.removeLayer(that._marker);
            }

            that._icon = L.icon({
                iconUrl: fui.ImageUrls.MARKER,
                iconAnchor: [13,40],
                popupAnchor: [0,-40],
                shadowUrl: fui.ImageUrls.MARKER_SHADOW
            });

            that._marker = L.marker([lat, lng],{
                icon: that._icon
            });
            if(addPopup){
                that._marker.bindPopup('<button id="saveLocation" class="k-button k-button-icontext"><span class="k-icon k-update"></span>Save</button>',{
                    closeButton: false
                });
            }
            that._map.addLayer(that._marker);
        },

        _showEditScreen: function () {
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
            var that = this;
            if(that._map){
                that._map.closePopup();
                that._map.removeLayer(that._cloudmade);
                that._map = null;
            }
            $("#locationWidget")[0].innerHTML = "";
        },

        _changeLocation: function (location) {
            var that = this;
            if(that._marker){
                that._map.removeLayer(that._marker);
            }

            //add a marker at the location, with a popup containing the location name
            that._addMarker(location.Latitude, location.Longitude, false);
        },

        _getLocationString: function (location) {
            var lineOne = location.AddressLineOne ? location.AddressLineOne + " " : "";
            var lineTwo = location.AddressLineTwo ? location.AddressLineTwo + ", "  : "";
            var adminDistrictTwo = location.AdminDistrictTwo ? location.AdminDistrictTwo + ", "  : "";
            var adminDistrictOne = location.AdminDistrictOne ? location.AdminDistrictOne + " "  : "";
            var postalCode = location.PostalCode ? location.PostalCode  : "";
            return lineOne + lineTwo  + adminDistrictTwo + adminDistrictOne + postalCode;
        },

        _updateLocationList: function (locations) {
            var that = this, locationList = locations;
            var list = "", thisLocation;
            $("#locationWidget #locationList")[0].innerHTML = "";
            for(var i in locations){
                thisLocation = locations[i];
                list += '<li><span id="fromWeb"></span><span class="name">' + that._getLocationString(locations[i]) + '</span></li>';
            }

            //TODO: set current location somewhere
            if(that._currentLocation){
                list += '<li><span id="previousLocation"></span><span class="name">' + that._getLocationString(that._currentLocation) + '</span></li>';
            }

            list += '<li><span id="currentLocation"></span><span class="name">Use Current Location</span></li>' +
                '<li><span id="manuallyDropPin"></span><span class="name">Manually Drop Pin</span></li>';

            $(list).appendTo($("#locationWidget #locationList"));
        }
    });
});