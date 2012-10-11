// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "ui/ui", "tools/generalTools", "developer", "kendo", "lib/leaflet"], function ($, dbServices, fui, generalTools, developer) {
    $.widget("ui.location", {
        /**
         * Initialize the map
         * @param location
         * @param {boolean} shouldAddMarker Whether or not a marker should be added(if anything but manually add was selected)
         */
        renderMap: function (location, shouldAddMarker) {
            var _location, that = this;

            that._updateNavigateLink(location, true);

            _location = $('<h3>Location</h3>' +
                '<div id="locationWidgetMap">' +
                '</div>' +
                '<div id="buttonPane" class="shown">' +
                '<a class="k-button k-button-icontext k-grid-edit" href="javascript:void(0)"></a>' +
                '<a id="navigateBtn" href="javascript:void(0)"></a>' +
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
                //move the marker to the new location
                that._changeMarkerLocation(location, false);
                //set/save the current selected location
                that._updateCurrentLocation(location, false);
            }

            //animate to edit screen on edit button click
            $("#locationWidget #buttonPane .k-grid-edit").on("click", function () {
                that._showEditScreen();
            });

            //when an option is selected from the list
            $("#locationWidget #editPane li").live("click", function (e) {
                //match the index of the selected item to the index of locationList
                var id = e.currentTarget.id;
                //if the previous location was selected
                if(id == "previous"){
                    that._changeMarkerLocation(that._currentLocation, false);
                //if "Manually Drop Pin" was selected
                }else if(id == "manual"){
                    that._changeMarkerLocation(null, false);
                    //allow the marker to move on map click
                    that._allowMapClick = true;
                //if a new location was selected
                }else{
                    that._changeMarkerLocation(that._locationList[id], false);
                    that._updateCurrentLocation(that._locationList[id], true);
                }

                //animate back to map from edit screen
                $("#locationWidget #buttonPane").switchClass("hidden", "shown", 500, 'swing');
                $("#locationWidget #editPane").switchClass("shown", "hidden", 500, 'swing');
                $("#locationWidgetMap").switchClass("hidden", "shown", 500);
            });

            //(in "Manually Drop Pin" mode) move the marker on map click
            that._map.on('click', function(e) {
                //check if in "Manually Drop Pin" mode
                if(that._allowMapClick){
                    that._changeMarkerLocation({Latitude: e.latlng.lat, Longitude: e.latlng.lng}, true)
                    that._marker.openPopup();

                    //click event of save button in marker popup
                    $("#locationWidget #saveLocation").on("click", function (e) {
                        //set/save the current marker location
                        var markerPosition = that._marker.getLatLng();
                        that._updateCurrentLocation({Latitude: markerPosition.lat, Longitude: markerPosition.lng}, true);
                        //don't allow map click after save button is clicked TODO:make sure this is what we want to happen
                        that._allowMapClick = false;
                        //remove the popup from the marker
                        that._marker.unbindPopup();
                    });
                }
            });

            $("#locationWidget #navigateBtn").on("click", function () {
                that._navigateToLink();
            });

            //update search after 1 second of input edit
            generalTools.observeInput("#locationWidget #editPane", function (string) {
                //get the list of location matches
                dbServices.locationSearch(string, function (locations) {
                    that._updateLocationList(locations);
                });
            });

            //if there is no location on initialization, go directly to the edit pane
            if(!shouldAddMarker){
                that._showEditScreen();
            }else{
                //if there is a location, show the navigate(with google) button
                $("#navigateBtn").css("display", "block");
            }
        },

        //animate to the edit screen
        _showEditScreen: function () {
            var that = this;
            //if there has been a location saved
            if(that._currentLocation){
                //update the location list to include the current(aka previous) location
                that._updateLocationList(that._locationList);
            }

            //animation
            $("#locationWidget #buttonPane").switchClass("shown", "hidden", 500, 'swing');
            $("#locationWidget #editPane").switchClass("hidden", "shown", 500, 'swing');
            $("#locationWidgetMap").switchClass("shown", "hidden", 500);
        },

        //remove all traces of the map
        removeMap: function () {
            var that = this;
            if(that._map){
                that._map.closePopup();
                that._map.removeLayer(that._cloudmade);
                that._map = null;
            }
            $("#locationWidget")[0].innerHTML = "";
        },

        /**
         * @param location
         * @param {boolean} addPopup If a popup should be added to the new marker(only when in "Manually Drop Pin" mode)
         * @private
         */
        _changeMarkerLocation: function (location, addPopup) {
            var that = this;
            //remove the current marker if there is one
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

                //if not in "Manually Drop Pin" mode
                if(!addPopup){
                    //center the map on the new marker location
                    that._map.setView([location.Latitude, location.Longitude], 15);
                }

                that._updateNavigateLink(location, false);
            }else{
                //hide the navigate button if there is no location
                $("#navigateBtn").css("display", "none");
            }
        },

        /**
         * Creates a string with the available location data
         * @param location
         * @return {String} The text to show in the location list
         * @private
         */
        _getLocationString: function (location) {
            var lineOne = location.AddressLineOne ? location.AddressLineOne + " " : "";
            var lineTwo = location.AddressLineTwo ? location.AddressLineTwo + ", "  : "";
            var adminDistrictTwo = location.AdminDistrictTwo ? location.AdminDistrictTwo + ", "  : "";
            var adminDistrictOne = location.AdminDistrictOne ? location.AdminDistrictOne + " "  : "";
            var postalCode = location.PostalCode ? location.PostalCode  : "";
            //display any parts of the location that exist
            var returnString = lineOne + lineTwo  + adminDistrictTwo + adminDistrictOne + postalCode;
            if(returnString){
                return returnString;
            //if none do, display the latitude and longitude
            }else{
                return location.Latitude + "," + location.Longitude;
            }
        },

        /**
         * @param locations The locations returned from the search
         * @private
         */
        _updateLocationList: function (locations) {
            var that = this;
            that._locationList = locations;
            var list = "", thisLocation;
            //clear the current list
            $("#locationWidget #locationList")[0].innerHTML = "";
            //add each returned location to the list
            for(var i in locations){
                thisLocation = locations[i];
                list += '<li id="' + i + '"><span class="fromWeb"></span><span class="name">' + that._getLocationString(locations[i]) + '</span></li>';
            }

            //add the current saved location to the list, if there is one
            if(that._currentLocation){
                list += '<li id="previous"><span id="previousLocation"></span><span class="name">' + that._getLocationString(that._currentLocation) + '</span></li>';
            }

            //add option for "Manually Drop Pin"
            list += //'<li id="current"><span id="currentLocation"></span><span class="name">Use Current Location</span></li>' +
                '<li id="manual"><span id="manuallyDropPin"></span><span class="name">Manually Drop Pin</span></li>';

            $(list).appendTo($("#locationWidget #locationList"));

            //adjust the text to make sure everything is vertically centered
            $("#locationWidget #locationList li").each(function () {
                if($(this)[0].childNodes[1].clientHeight < 25){
                    $(this).addClass("singleLine");
                }else if($(this)[0].childNodes[1].clientHeight > 50){
                    $(this).addClass("tripleLine");
                }
            });
        },

        /**
         * Update and (conditionally) save the currently selected location
         * @param location
         * @param shouldSave If the current location needs to be saved
         * @private
         */
        _updateCurrentLocation: function (location, shouldSave) {
            var that = this;

            that._currentLocation = location;

            if(shouldSave){
                //TODO: save here
            }
        },

        /**
         * Update the query that will be used for the navigate link
         * @param location
         * @param {boolean} initial If this is the initial load
         * @private
         */
        _updateNavigateLink: function (location, initial) {
            var that = this;

            //check if there is a usable address
            if(location.AddressLineOne && location.AdminDistrictOne && location.AdminDistrictTwo){
                //replace spaces with "+" to format for search query
                var lineOneFormatted = location.AddressLineOne.replace(/\s/g, "+");
                var adminDistrictTwoFormatted = location.AdminDistrictTwo.replace(/\s/g, "+");
                var adminDistrictOneFormatted = location.AdminDistrictOne.replace(/\s/g, "+");
                that._navigateQuery = lineOneFormatted + ',+' + adminDistrictTwoFormatted + ',+' + adminDistrictOneFormatted + '&z=13&ll=' + location.Latitude + ',' + location.Longitude;
            //if not, use the latitude and longitude
            }else{
                that._navigateQuery = location.Latitude + ',+' + location.Longitude + '&z=13&ll=' + location.Latitude + ',' + location.Longitude;
            }

            //show the navigate button if this is not the initial load
            if(!initial){
                $("#navigateBtn").attr("style", "display:block");
            }
        },

        //open a new window with google maps directions to the current location
        _navigateToLink: function () {
            var currentPosition, that = this;
            var navigateTo = function (url) {
                if (developer.CURRENT_FRAME === developer.Frame.MOBILE_APP && kendo.support.detectOS(navigator.userAgent).device === "android") {
                    window.plugins.childBrowser.showWebPage(url);
                } else {
                    window.open(url);
                }
            };
            //get the users location
            navigator.geolocation.getCurrentPosition(function (position) {
                // If geolocation is successful get directions to the location from current position.
                currentPosition = position.coords.latitude + "," + position.coords.longitude;
                navigateTo("http://maps.google.com/maps?saddr=" + currentPosition + "&daddr=" + that._navigateQuery);
            }, function () {
                // If geolocation is NOT successful just show the location.
                navigateTo("http://maps.google.com/maps?q=" + that._navigateQuery);
            }, {timeout: 10000, enableHighAccuracy: true});
        }
    });
});