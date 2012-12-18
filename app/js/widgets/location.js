// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "ui/ui", "tools/generalTools", "kendo", "lib/leaflet"], function ($, dbServices, fui, generalTools) {
    $.widget("ui.location", {
        options: {
            initialLocation: {},
            change: function (location) {}
        },

//region - General Widget Methods
        _create: function () {
            var locationWidget = this, shouldAddMarker = true;
            //check for a location
            if (!locationWidget.options.initialLocation) {
                shouldAddMarker = false;
                locationWidget._showEditScreen();
                return;
            }

            var location = locationWidget.options.initialLocation;

            locationWidget._location = $('<h3>Location</h3>' +
                '<div id="locationWidgetMap"></div>' +
                '<div class="buttonPane shown">' +
                    '<a class="k-button k-button-icontext k-grid-edit" href="javascript:void(0)"></a>' +
                    '<a class="navigateBtn" href="javascript:void(0)"></a>' +
                '</div>' +
                '<div class="editPane hidden">' +
                    '<div class="location" />' +
                '</div>'
            );

            locationWidget.element.append(locationWidget._location);
            locationWidget.element.find(".location").searchSelect({
                query: function (searchTerm, callback) {
                    //get the list of location matches
                    if (searchTerm) {
                        locationWidget.element.find("input").css("background-image", "url('img/spinner.gif')").css("background-position", "98% 50%");
                        dbServices.locations.read({params: {search: searchTerm}}).done(function (locations) {
                            locationWidget.element.find("input").css("background", "");
                            callback(locations);
                        });
                    }
                },
                formatOption: generalTools.getLocationDisplayString,
                onSelect: function (e, selectedData) {
                    //match the index of the selected item to the index of locationList
                    var id = e.currentTarget.id;
                    //if the previous location was selected
                    if (id == "previous") {
                        locationWidget._changeMarkerLocation(locationWidget.currentLocation, false);
                        //if "Manually Drop Pin" was selected
                    } else if (id == "manual") {
                        locationWidget._changeMarkerLocation(null, false);
                        //allow the marker to move on map click
                        locationWidget._allowMapClick = true;
                        //if a new location was selected
                    } else {
                        locationWidget._changeMarkerLocation(selectedData, false);
                        locationWidget.updateCurrentLocation(selectedData, true);
                    }

                    //animate back to map from edit screen
                    widgetElement.find(".buttonPane").switchClass("hidden", "shown", 500, 'swing');
                    widgetElement.find(".editPane").switchClass("shown", "hidden", 500, 'swing');
                    widgetElement.find("#locationWidgetMap").switchClass("hidden", "shown", 500);
                },
                queryDelay: 750,
                minimumInputLength: 0,
                showPreviousSelection: true
            });

            var widgetElement = $(locationWidget.element);

            var center, zoom;

            //center the map at the location
            if (location && location.Latitude && location.Longitude) {
                center = [location.Latitude, location.Longitude];
                zoom = 15;
            //if no location exists, center on 'merica!
            } else {
                center = [40, -89];
                zoom = 4;
            }

            //initialize the map on the "locationWidgetMap" div with a given center and zoom
            locationWidget._map = L.map('locationWidgetMap', {
                center: center,
                zoom: zoom,
                attributionControl: false,
                zoomControl: false
            });
            //create a CloudMade tile layer and add it to the map
            locationWidget._cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18
            });
            locationWidget._map.addLayer(locationWidget._cloudmade);

            if (shouldAddMarker) {
                //move the marker to the new location
                locationWidget._changeMarkerLocation(location, false);
                //set the current selected location
                locationWidget.updateCurrentLocation(location, false);
            }

            //animate to edit screen on edit button click
            widgetElement.find(".buttonPane .k-grid-edit").on("click", function () {
                locationWidget._showEditScreen();
            });

            //(in "Manually Drop Pin" mode) move the marker on map click
            locationWidget._map.on('click', function (e) {
                //check if in "Manually Drop Pin" mode
                if (locationWidget._allowMapClick) {
                    locationWidget._changeMarkerLocation({Latitude: e.latlng.lat, Longitude: e.latlng.lng}, true);
                    locationWidget._marker.openPopup();

                    //click event of save button in marker popup
                    $(locationWidget.element).find(".saveLocation").on("click", function (e) {
                        //set/save the current marker location
                        var markerPosition = locationWidget._marker.getLatLng();
                        locationWidget.updateCurrentLocation({Latitude: markerPosition.lat, Longitude: markerPosition.lng}, true);
                        //don't allow map click after save button is clicked TODO: Make sure this is what we want to happen
                        locationWidget._allowMapClick = false;
                        //remove the popup from the marker
                        locationWidget._marker.unbindPopup();
                    });
                }
            });

            widgetElement.find(".navigateBtn").on("click", function () {
                locationWidget._navigateToLink();
            });

            //if there is no location on initialization, go directly to the edit pane
            if (!shouldAddMarker) {
                locationWidget._showEditScreen();
            } else {
                //if there is a location, show the navigate(with google maps) button
                widgetElement.find(".navigateBtn").css("display", "block");
                locationWidget._updateNavigateLink(location, true);
            }
        },
        /**
         * Update and (conditionally) save the currently selected location
         * @param location
         * @param shouldSave If the current location needs to be saved
         * @private
         */
        updateCurrentLocation: function (location, shouldSave) {
            var locationWidget = this;

            locationWidget.currentLocation = location;
            locationWidget.options.change(location);
            locationWidget._changeMarkerLocation(location, false);

            if (shouldSave) {
                //TODO: save here(not necessary for use in popup)
            }
        },
        //remove all traces of the map
        removeWidget: function () {
            var locationWidget = this;
            if (locationWidget._map) {
                locationWidget._map.closePopup();
                locationWidget._map.removeLayer(locationWidget._cloudmade);
                locationWidget._map = null;
            }
            $(locationWidget.element)[0].innerHTML = "";
        },
//endregion - General Widget Methods

//region - Edit Screen Methods
        //animate to the edit screen
        _showEditScreen: function () {
            var locationWidget = this, widgetElement = $(locationWidget.element);
            //if there has been a location saved
            if (locationWidget.currentLocation) {
                //update the location list to include the current(aka previous) location
                if (locationWidget.element.find(".location").searchSelect("data")) {
                    locationWidget.element.find("input").css("background-image", "url('img/spinner.gif')").css("background-position", "98% 50%");
                    dbServices.locations.read({params: {search: generalTools.getLocationDisplayString(locationWidget.element.find(".location").searchSelect("data"))}}).done(function (locations) {
                        locationWidget.element.find("input").css("background", "");
                        locationWidget.element.find(".location").searchSelect("open", locations);
                    });
                }
            }

            //animation
            widgetElement.find(".buttonPane").switchClass("shown", "hidden", 500, 'swing');
            widgetElement.find(".editPane").switchClass("hidden", "shown", 500, 'swing');
            widgetElement.find("#locationWidgetMap").switchClass("shown", "hidden", 500);
        },
//endregion - Edit Screen Methods

//region - Map Methods
        /**
         * @param location
         * @param {boolean} addPopup If a popup should be added to the new marker(only when in "Manually Drop Pin" mode)
         * @private
         */
        _changeMarkerLocation: function (location, addPopup) {
            var locationWidget = this;
            //remove the current marker if there is one
            if (locationWidget._marker) {
                locationWidget._map.removeLayer(locationWidget._marker);
            }
            if (location) {
                //add a marker at the location, with a popup containing the location name
                locationWidget._icon = L.icon({
                    iconUrl: fui.ImageUrls.MARKER,
                    iconAnchor: [13, 40],
                    popupAnchor: [0, -40],
                    shadowUrl: fui.ImageUrls.MARKER_SHADOW
                });

                locationWidget._marker = L.marker([location.Latitude, location.Longitude], {
                    icon: locationWidget._icon
                });
                if (addPopup) {
                    locationWidget._marker.bindPopup('<button class="saveLocation k-button k-button-icontext"><span class="k-icon k-update"></span>Save</button>', {
                        closeButton: false
                    });
                }
                locationWidget._map.addLayer(locationWidget._marker);

                //if not in "Manually Drop Pin" mode
                if (!addPopup) {
                    //center the map on the new marker location
                    locationWidget._map.setView([location.Latitude, location.Longitude], 15);
                }

                locationWidget._updateNavigateLink(location, false);
            } else {
                //hide the navigate button if there is no location
                $(locationWidget.element).find(".navigateBtn").css("display", "none");
            }
        },
        /**
         * Update the query locationWidget will be used for the navigate link
         * @param location
         * @param {boolean} initial If this is the initial load
         * @private
         */
        _updateNavigateLink: function (location, initial) {
            var locationWidget = this;

            //check if there is a usable address
            if (location.AddressLineOne && location.AdminDistrictOne && location.AdminDistrictTwo) {
                //replace spaces with "+" to format for search query
                var lineOneFormatted = location.AddressLineOne.replace(/\s/g, "+");
                var adminDistrictTwoFormatted = location.AdminDistrictTwo.replace(/\s/g, "+");
                var adminDistrictOneFormatted = location.AdminDistrictOne.replace(/\s/g, "+");
                locationWidget._navigateQuery = lineOneFormatted + ',+' + adminDistrictTwoFormatted + ',+' + adminDistrictOneFormatted + '&z=13&ll=' + location.Latitude + ',' + location.Longitude;
                //if not, use the latitude and longitude
            } else {
                locationWidget._navigateQuery = location.Latitude + ',+' + location.Longitude + '&z=13&ll=' + location.Latitude + ',' + location.Longitude;
            }

            //show the navigate button if this is not the initial load
            if (!initial) {
                $(locationWidget.element).find(".navigateBtn").attr("style", "display:block");
            }
        },
        //open a new window with google maps directions to the current location
        _navigateToLink: function () {
            var currentPosition, locationWidget = this;
            //get the users location
            navigator.geolocation.getCurrentPosition(function (position) {
                // If geolocation is successful get directions to the location from current position.
                currentPosition = position.coords.latitude + "," + position.coords.longitude;
                generalTools.goToUrl("http://maps.google.com/maps?saddr=" + currentPosition + "&daddr=" + locationWidget._navigateQuery);
            }, function () {
                // If geolocation is NOT successful just show the location.
                generalTools.goToUrl("http://maps.google.com/maps?q=" + locationWidget._navigateQuery);
            }, {timeout: 10000, enableHighAccuracy: true});
        }
//endregion - Map Methods
    });
});