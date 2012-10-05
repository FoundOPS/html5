// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "ui/ui", "tools/generalTools", "kendo", "lib/leaflet"], function ($, dbServices, fui, generalTools) {
    $.widget("ui.location", {
        _create: function() {
        },

        renderMap: function (location, shouldAddMarker) {
            var _location, that = this;

            that._updateNavigateLink(location, true);

            _location = $('<h3>Location</h3>' +
                '<div id="locationWidgetMap">' +
                '</div>' +
                '<div id="buttonPane" class="shown">' +
                '<a class="k-button k-button-icontext k-grid-edit" href="javascript:void(0)"></a>' +
                '<a id="navigateBtn" href=' + that._navigateLink + '></a>' +
                '</div>' +
                '<div id="editPane" class="hidden">' +
                '<input type="text" />' +
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
                that._changeMarkerLocation(location, false);
                that._updateCurrentLocation(location, false);
            }

            //animate to edit screen
            $("#locationWidget #buttonPane .k-grid-edit").on("click", function () {
                that._showEditScreen();
            });

            //animate back to map from edit screen on when a location is selected from the list
            $("#locationWidget #editPane li").live("click", function (e) {
                //match the index of the selected item to the index of locationList
                var id = e.currentTarget.id;
                if(id == "previous"){
                    that._changeMarkerLocation(that._currentLocation, false);
                }else if(id == "manual"){
                    that._changeMarkerLocation(null, false);
                    that._allowMapClick = true;
                }else{
                    that._changeMarkerLocation(that._locationList[id], false);
                    that._updateCurrentLocation(that._locationList[id], true);
                }

                $("#locationWidget #buttonPane").switchClass("hidden", "shown", 500, 'swing');
                $("#locationWidget #editPane").switchClass("shown", "hidden", 500, 'swing');
                $("#locationWidgetMap").switchClass("hidden", "shown", 500);
            });

            that._map.on('click', function(e) {
                if(that._allowMapClick){
                    that._changeMarkerLocation({Latitude: e.latlng.lat, Longitude: e.latlng.lng}, true)
                    that._marker.openPopup();

                    $("#locationWidget #saveLocation").on("click", function (e) {
                        var markerPosition = that._marker.getLatLng();
                        that._updateCurrentLocation({Latitude: markerPosition.lat, Longitude: markerPosition.lng}, true);
                    });
                }
            });

            //TODO: set allowMapClick to false on save button click. And that._updateCurrentLocation(location, true);

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

        _showEditScreen: function () {
            var that = this;
            if(that._currentLocation){
                that._updateLocationList(that._locationList);
            }

            $("#locationWidget #buttonPane").switchClass("shown", "hidden", 500, 'swing');
            $("#locationWidget #editPane").switchClass("hidden", "shown", 500, 'swing');
            $("#locationWidgetMap").switchClass("shown", "hidden", 500);
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

        _changeMarkerLocation: function (location, addPopup) {
            var that = this;
            if(that._marker){
                that._map.removeLayer(that._marker);
            }
            if(location){
                //add a marker at the location, with a popup containing the location name
                that._icon = L.icon({
                    iconUrl: fui.ImageUrls.MARKER,
                    iconAnchor: [13,40],
                    popupAnchor: [0,-40],
                    shadowUrl: fui.ImageUrls.MARKER_SHADOW
                });

                that._marker = L.marker([location.Latitude, location.Longitude],{
                    icon: that._icon
                });
                if(addPopup){
                    that._marker.bindPopup('<button id="saveLocation" class="k-button k-button-icontext"><span class="k-icon k-update"></span>Save</button>',{
                        closeButton: false
                    });
                }
                that._map.addLayer(that._marker);

                if(!addPopup){
                    that._map.setView([location.Latitude, location.Longitude], 15);
                }

                that._updateNavigateLink(location, false);
            }else{
                $("#navigateBtn").css("display", "none");
            }
        },

        _getLocationString: function (location) {
            var lineOne = location.AddressLineOne ? location.AddressLineOne + " " : "";
            var lineTwo = location.AddressLineTwo ? location.AddressLineTwo + ", "  : "";
            var adminDistrictTwo = location.AdminDistrictTwo ? location.AdminDistrictTwo + ", "  : "";
            var adminDistrictOne = location.AdminDistrictOne ? location.AdminDistrictOne + " "  : "";
            var postalCode = location.PostalCode ? location.PostalCode  : "";
            var returnString = lineOne + lineTwo  + adminDistrictTwo + adminDistrictOne + postalCode;
            if(returnString){
                return returnString;
            }else{
                return location.Latitude + "," + location.Longitude;
            }
        },

        _updateLocationList: function (locations) {
            var that = this;
            that._locationList = locations;
            var list = "", thisLocation;
            $("#locationWidget #locationList")[0].innerHTML = "";
            for(var i in locations){
                thisLocation = locations[i];
                list += '<li id="' + i + '"><span class="fromWeb"></span><span class="name">' + that._getLocationString(locations[i]) + '</span></li>';
            }

            if(that._currentLocation){
                list += '<li id="previous"><span id="previousLocation"></span><span class="name">' + that._getLocationString(that._currentLocation) + '</span></li>';
            }

            list += //'<li id="current"><span id="currentLocation"></span><span class="name">Use Current Location</span></li>' +
                '<li id="manual"><span id="manuallyDropPin"></span><span class="name">Manually Drop Pin</span></li>';

            $(list).appendTo($("#locationWidget #locationList"));

            $("#locationWidget #locationList li").each(function () {
                if($(this)[0].childNodes[1].clientHeight < 25){
                    $(this).addClass("singleLine");
                }else if($(this)[0].childNodes[1].clientHeight > 50){
                    $(this).addClass("tripleLine");
                }
            });
        },

        _updateCurrentLocation: function (location, shouldSave) {
            var that = this;

            that._currentLocation = location;

            if(shouldSave){
                //TODO: save here
            }
        },

        _updateNavigateLink: function (location, initial) {
            var that = this;

            if(location.AddressLineOne && location.AdminDistrictOne && location.AdminDistrictTwo){
                //replace spaces with "+" to format for search query
                var lineOneFormatted = location.AddressLineOne.replace(/\s/g, "+");
                var adminDistrictTwoFormatted = location.AdminDistrictTwo.replace(/\s/g, "+");
                var adminDistrictOneFormatted = location.AdminDistrictOne.replace(/\s/g, "+");
                that._navigateLink = 'https://maps.google.com/maps?q=' + lineOneFormatted + ',+' + adminDistrictTwoFormatted + ',+' + adminDistrictOneFormatted + '&z=15';
            }else{
                that._navigateLink = 'https://maps.google.com/maps?q=' + location.Latitude + ',+' + location.Longitude + '&z=15';
            }

            if(!initial){
                $("#navigateBtn").attr("style", "display:block").attr("href", that._navigateLink);
            }
        }
    });
});