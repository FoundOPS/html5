// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["db/services", "ui/ui", "tools/generalTools", "tools/generalTools"], function (dbServices, ui, generalTools, tools) {
    $.widget("ui.location", {
        options: {
            //Callback functions, each passed the location
            add: null,
            change: null,
            delete: null,
            //Will return locations for this Client in queries
            clientId: null,
            //Locations array to display initially
            data: null
        },

        _init: function () {
            var locationWidget = this, widgetElement = $(locationWidget.element);

            if (!locationWidget.options.data instanceof Array) {
                throw Error("Locations must be an array");
            }

            //"locationInput" class is used for all inputs so that their values can be cleared
            //"geocoded" class is used for the inputs that get disabled and enabled based on if "Manually Place Pin" was selected
            locationWidget._location = $('<div id="locationWidgetMap"></div>' +
                '<ul class="splitBtnList"></ul>' +
                '<div class="addButtonWrapper">' +
                '<button class="k-button k-button-icontext add"><span class="k-icon k-add"></span>Add New</button>' +
                '</div>' +
                '<div class="editPane">' +
                '<div class="locationSearchSelect"></div>' +
                '<label for="nickname">Name</label><br />' +
                '<input name="nickname" class="nickname locationInput" type="text" /><br />' +
                '<label for="line1">Line 1</label><br />' +
                '<input name="line1" class="line1 locationInput geocoded" type="text" /><br />' +
                '<label for="line2">Line 2</label><br />' +
                '<input name="line2" class="line2 locationInput" type="text" /><br />' +
                '<label for="city">City</label><br />' +
                '<input name="city" class="city locationInput geocoded" type="text" /><br />' +
                '<input class="countryCode locationInput" type="hidden" />' +
                '<input class="lat locationInput" type="hidden" />' +
                '<input class="lng locationInput" type="hidden" />' +
                '<input class="id locationInput" type="hidden" />' +
                '<div class="stateWrapper">' +
                '<label for="state">State</label><br />' +
                '<div class="styled-select">' +
                '<select name="state" class="state selectBox locationInput geocoded">' +
                '<option selected="selected">Select a State</option>' +
                '</select>' +
                '</div>' +
                '</div>' +
                '<div class="zipCodeWrapper">' +
                '<label for="zipCode">Zip Code</label><br />' +
                '<input name="zipCode" class="zipCode locationInput geocoded" type="text" />' +
                '</div>' +
                '<div class="saveDeleteButtonWrapper">' +
                '<button class="k-button k-button-icontext saveBtn"><span class="k-icon k-update"></span>Save</button>' +
                '<button class="k-button k-button-icontext cancelBtn"><span class="k-icon k-delete"></span>Cancel</button>' +
                '<button class="k-button k-button-icontext deleteBtn"><span class="k-icon k-delete"></span>Delete</button>' +
                '</div>' +
                '</div>'
            );

            widgetElement.append(locationWidget._location);

            var states = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL",
                "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
                "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
                "VA", "WA", "WV", "WI", "WY"];

            //populate the options list with states
            _.each(states, function (value) {
                var option = $("<option value='" + value + "'>" + value + "</option>");
                option.appendTo(widgetElement.find(".state"));
            });

            //if multiple locations, show the delete button
            if (locationWidget.options.delete) {
                locationWidget.multiple = true;
                widgetElement.find(".deleteBtn")[0].style.display = "inline-block";
                widgetElement.find(".saveDeleteButtonWrapper")[0].style.width = "220px";
            }

            //setup searchSelect
            widgetElement.find(".locationSearchSelect").searchSelect({
                query: function (searchTerm, callback) {
                    //get the list of location matches
                    if (searchTerm) {
                        //show the loading image
                        widgetElement.find(".locationSearchSelect input").css("background-image", "url('img/spinner.gif')").css("background-position", "98% 50%").css("background-repeat", "no-repeat");
                        //get the search results
                        dbServices.locations.read({params: {search: searchTerm, ClientId: locationWidget.options.clientId}}).done(function (locations) {
                            //hide the loading image
                            widgetElement.find("input").css("background", "");
                            callback(locations);
                        });
                    }
                },
                formatOption: generalTools.getLocationDisplayString,
                onSelect: function (e, selectedData) {
                    //if "Manually Place Pin" was selected
                    if (e.target.innerText === "Manually Place Pin") {
                        //allow the marker to move on map click
                        locationWidget._allowMapClick = true;
                        locationWidget._clearMarkers();
                        locationWidget._enableFields();

                        //generate a new guid
                        widgetElement.find(".id").val(tools.newGuid());
                    }
                    //if a location was selected
                    else {
                        //update the location in the list with the selected one
                        locationWidget.options.data[locationWidget.editIndex] = selectedData;

                        locationWidget._disableFields();
                        locationWidget._populateFields(selectedData);
                        locationWidget._showMarker(selectedData);
                    }
                },
                queryDelay: 750,
                minimumInputLength: 0,
                showPreviousSelection: true,
                //add "manually place pin" option
                additionalListItem: '<li><span class="manuallyPlacePin"></span><span class="name">Manually Place Pin</span></li>',
                dontCloseOn: true
            });

            //initialize the map on the "locationWidgetMap" div with a given center and zoom
            locationWidget._map = L.map('locationWidgetMap', {
                //center on 'merica!
                center: [40, -89],
                zoom: 4,
                attributionControl: false,
                zoomControl: false
            });

            //create a CloudMade tile layer and add it to the map
            locationWidget._cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18
            });
            locationWidget._map.addLayer(locationWidget._cloudmade);

            //create an icon to be used for all map markers
            locationWidget.icon = L.icon({
                iconUrl: ui.ImageUrls.MARKER,
                iconAnchor: [13, 30],
                popupAnchor: [0, -30],
                shadowUrl: ui.ImageUrls.MARKER_SHADOW
            });

            //if "Manually Place Pin" mode move the marker on map click
            locationWidget._map.on('click', function (e) {
                //check if in "Manually Place Pin" mode
                if (locationWidget._allowMapClick) {
                    //add a marker at the location
                    locationWidget._showMarker({Latitude: e.latlng.lat, Longitude: e.latlng.lng});

                    //save the lat/lng
                    widgetElement.find(".lat").val(e.latlng.lat);
                    widgetElement.find(".lng").val(e.latlng.lng);
                }
            });

            widgetElement.find(".add").on("click", function () {
                locationWidget._editLocation(null, true);
            });

            widgetElement.find(".saveBtn").on("click", function () {
                //create a location with the values from the inputs
                var updatedLocation = {
                    Id: widgetElement.find(".id").val(),
                    Name: widgetElement.find(".nickname").val(),
                    AddressLineOne: widgetElement.find(".line1").val(),
                    AddressLineTwo: widgetElement.find(".line2").val(),
                    AdminDistrictOne: widgetElement.find(".state").val(),
                    AdminDistrictTwo: widgetElement.find(".city").val(),
                    PostalCode: widgetElement.find(".zipCode").val(),
                    CountryCode: widgetElement.find(".countryCode").val(),
                    Latitude: widgetElement.find(".lat").val(),
                    Longitude: widgetElement.find(".lng").val()
                };

                //if adding a new location
                if (locationWidget.newLocation) {
                    updatedLocation.IsNew = true;

                    //add the new location to the list
                    locationWidget.options.data.push(updatedLocation);

                    locationWidget.options.add(updatedLocation);
                    //if editing an already existing location
                } else {
                    var location = locationWidget.options.data[locationWidget.editIndex];

                    //update the properties of the existing location that could have changed
                    location.Name = updatedLocation.Name;
                    location.Id = updatedLocation.Id;
                    location.AddressLineOne = updatedLocation.AddressLineOne;
                    location.AddressLineTwo = updatedLocation.AddressLineTwo;
                    location.AdminDistrictOne = updatedLocation.AdminDistrictOne;
                    location.AdminDistrictTwo = updatedLocation.AdminDistrictTwo;
                    location.PostalCode = updatedLocation.PostalCode;
                    location.CountryCode = updatedLocation.CountryCode;
                    location.Latitude = updatedLocation.Latitude;
                    location.Longitude = updatedLocation.Longitude;

                    locationWidget.options.change(location);
                }
                //switch to the location list
                locationWidget.showList();

                locationWidget._allowMapClick = false;
            });

            widgetElement.find(".deleteBtn").on("click", function () {
                var answer = confirm("Are you sure you want to delete this location?");
                if (answer) {
                    locationWidget.options.data.splice(locationWidget.editIndex, 1);
                    locationWidget.options.delete(locationWidget.options.data[locationWidget.editIndex]);
                    locationWidget.showList();
                }
            });

            widgetElement.find(".cancelBtn").on("click", function () {
                //switch to the location list
                locationWidget.showList();

                locationWidget._allowMapClick = false;
            });

            //check there is at least one location
            if (!locationWidget.options.data || !locationWidget.options.data[0]) {
                locationWidget._editLocation(null, false);
                return;
            }
            locationWidget.showList();
        },

        /**
         * animate to the edit screen
         * @param {number} index
         * @param {boolean} newLocation if this is a new location
         * @private
         */
        _editLocation: function (index, newLocation) {
            var locationWidget = this, widgetElement = $(locationWidget.element);
            locationWidget.newLocation = newLocation;
            locationWidget.editIndex = index;

            //switch to edit screen
            widgetElement.find(".addButtonWrapper")[0].style.display = "none";
            //only animate if in skinny mode
            if (widgetElement[0].clientWidth > 500) {
                widgetElement.find(".splitBtnList")[0].style.display = "none";
                widgetElement.find(".editPane")[0].style.display = "block";
                //keep the map height equal to the edit pane height
                $("#locationWidgetMap")[0].style.height = widgetElement.find(".editPane").height() + "px";
            } else {
                widgetElement.find(".splitBtnList").animate({
                    height: 'hide'
                }, "swing", function () {
                    widgetElement.find(".editPane").animate({
                        height: 'show'
                    }, "swing");
                });
            }

            var location = locationWidget.options.data[index];

            if (location) {
                locationWidget._populateFields(location);

                //we don't need to refresh the marker if there's only one location
                if (!locationWidget.options.data.AddressLineOne) {
                    locationWidget._showMarker(location);
                }

            } else {
                //clear the inputs
                widgetElement.find(".locationInput").val("");
                locationWidget._clearMarkers();
            }

            locationWidget._disableFields();

            //TODO: add an option to do this, or just always do this if multiple locations
            //widgetElement.find(".locationSearchSelect").searchSelect("open", []);
        },

        //repopulate the list, show it, and place the corresponding markers on the map
        showList: function () {
            var locationWidget = this, widgetElement = $(this.element), li;
            var locations = locationWidget.options.data;
            //clear current list
            widgetElement.find(".splitBtnList")[0].innerHTML = "";

            locationWidget._clearMarkers();

            locationWidget._markers = L.layerGroup();

            //re-populate the list
            for (var i in locations) {
                var location = locations[i];

                //add a marker at the location
                locationWidget._marker = L.marker([location.Latitude, location.Longitude], {
                    icon: locationWidget.icon
                });

                locationWidget._marker.addTo(locationWidget._markers);

                //keep "num" between 0 and 9 because there are only 10 colors
                var num = i;
                while (num > 9) {
                    num -= 10;
                }
                //create a location list item
                li = "<li><span class='colorBar' style='background: " + ui.ITEM_COLORS[num].color + "'></span>" +
                    "<div class='splitEditBtn' onclick='$(\"#locationSelector\").data(\"location\")._editLocation(" + i + ", false)'><span></span></div>" +
                    "<a class='navigateBtn' target='_blank' onclick='$(\"#locationSelector\").data(\"location\")._navigateToLink(" + i + ")'>" +
                    generalTools.getLocationDisplayString(location, true) + "</a></li>";

                //add the location to the location list
                $(li).appendTo(widgetElement.find(".splitBtnList"));
            }

            //add the marker(s) to the map
            locationWidget._map.addLayer(locationWidget._markers);

            locationWidget._colorMarkers(null);

            //center the map on the locations
            if (locations && (locations[0] && locations[0].Latitude && locations[0].Longitude)) {
                //create an array of just the locations' lat's and lng's
                var bounds = [];

                for (var j in locations) {
                    var loc = locations[j];
                    if (loc.Latitude && loc.Longitude) {
                        bounds.push(L.latLng([loc.Latitude, loc.Longitude]));
                    }
                }

                //pan/zoom to a view that fits all the locations
                if (locations.length > 1) {
                    locationWidget._map.fitBounds([bounds]);
                } else {
                    locationWidget._map.setView([locations[0].Latitude, locations[0].Longitude], 15);
                }


                _.delay(function () {
                    locationWidget._map.invalidateSize(false);
                }, 50);

                //zoom out one more level
                //TODO: not working
                //locationWidget._map.zoomOut();
            }

            //don't show add button unless there are multiple locations
            if (locationWidget.options.delete) {
                widgetElement.find(".addButtonWrapper")[0].style.display = "block";
            }
            //only animate if in skinny mode
            if ($("#locationSelector")[0].clientWidth > 500) {
                widgetElement.find(".editPane")[0].style.display = "none";
                widgetElement.find(".splitBtnList")[0].style.display = "block";
                //keep the map height equal to the list height(plus 38 to account for add button)
                $("#locationWidgetMap")[0].style.height = widgetElement.find(".splitBtnList").height() + 38 + "px";
            } else {
                widgetElement.find(".editPane").animate({
                    height: 'hide'
                }, "swing", function () {
                    widgetElement.find(".splitBtnList").animate({
                        height: 'show'
                    }, "swing");
                });
            }
        },

        //add a marker to the map at the given location
        _showMarker: function (location) {
            var locationWidget = this;

            locationWidget._clearMarkers();

            locationWidget._markers = L.layerGroup();

            //add a marker at the location
            locationWidget._marker = L.marker([location.Latitude, location.Longitude], {
                icon: locationWidget.icon
            });

            locationWidget._marker.addTo(locationWidget._markers);
            //add the marker to the map
            locationWidget._map.addLayer(locationWidget._markers);
            //center the map at the location being edited
            locationWidget._map.setView([location.Latitude, location.Longitude], 15);

            locationWidget._colorMarkers(ui.ITEM_COLORS[0].color);

            _.delay(function () {
                locationWidget._map.invalidateSize(false);
            }, 50);
        },

        //remove any markers from the map
        _clearMarkers: function () {
            var locationWidget = this;

            if (locationWidget._markers) {
                locationWidget._map.removeLayer(locationWidget._markers);
            }
        },

        /**
         * colors all markers on the map
         * @param {string} color
         * @private
         */
        _colorMarkers: function (color) {
            //wait for the markers to be loaded
            _.delay(function () {
                //http://stackoverflow.com/questions/9303757/how-to-change-color-of-an-image-using-jquery
                var i = 0;
                $(".leaflet-marker-pane").find("img").each(function () {
                    //prevent a canvas error
                    if (this.height === 0 || this.width === 0) {
                        return;
                    }

                    var canvas = document.createElement("canvas");
                    var ctx = canvas.getContext("2d");
                    canvas.width = this.width;
                    canvas.height = this.height;

                    ctx.drawImage(this, 0, 0, this.naturalWidth, this.naturalHeight, 0, 0, this.width, this.height);
                    var originalPixels = ctx.getImageData(0, 0, this.width, this.height);
                    var currentPixels = ctx.getImageData(0, 0, this.width, this.height);

                    if (!originalPixels) return; // Check if image has loaded

                    //keep "num" between 0 and 9 because there are only 10 colors
                    var num = i;
                    while (num > 9) {
                        num -= 10;
                    }

                    var newColor = "";
                    if (color) {
                        newColor = generalTools.hexToRGB(color);
                    } else {
                        newColor = generalTools.hexToRGB(ui.ITEM_COLORS[num].color);
                    }

                    for (var I = 0, L = originalPixels.data.length; I < L; I += 4) {
                        if (currentPixels.data[I + 3] > 0) {
                            currentPixels.data[I] = originalPixels.data[I] / 255 * newColor.R;
                            currentPixels.data[I + 1] = originalPixels.data[I + 1] / 255 * newColor.G;
                            currentPixels.data[I + 2] = originalPixels.data[I + 2] / 255 * newColor.B;
                        }
                    }

                    ctx.putImageData(currentPixels, 0, 0);
                    this.src = canvas.toDataURL("image/png");
                    i++;
                });
            }, 100);
        },

        //populate the inputs with the data from the given location
        _populateFields: function (location) {
            var widgetElement = $(this.element);
            widgetElement.find(".nickname").val(location.Name);
            widgetElement.find(".line1").val(location.AddressLineOne);
            widgetElement.find(".line2").val(location.AddressLineTwo);
            widgetElement.find(".city").val(location.AdminDistrictTwo);
            widgetElement.find(".state").val(location.AdminDistrictOne);
            widgetElement.find(".zipCode").val(location.PostalCode);
            widgetElement.find(".countryCode").val(location.CountryCode);
            widgetElement.find(".lat").val(location.Latitude);
            widgetElement.find(".lng").val(location.Longitude);
            widgetElement.find(".id").val(location.Id);
        },

        //disable the address fields
        _disableFields: function () {
            var widgetElement = $(this.element);
            widgetElement.find(".geocoded").attr("disabled", "disabled");
            var color = "#999";
            widgetElement.find(".line1")[0].style.color = color;
            widgetElement.find(".city")[0].style.color = color;
            widgetElement.find(".zipCode")[0].style.color = color;
            widgetElement.find(".state")[0].style.color = color;
        },

        //enable the address fields
        _enableFields: function () {
            var widgetElement = $(this.element);
            widgetElement.find(".geocoded").removeAttr("disabled");
            var color = "#000";
            widgetElement.find(".line1")[0].style.color = color;
            widgetElement.find(".city")[0].style.color = color;
            widgetElement.find(".zipCode")[0].style.color = color;
            widgetElement.find(".state")[0].style.color = color;
        },

        /**
         * opens a new window with google maps directions to the selected location
         * @param {number} index
         * @private
         */
        _navigateToLink: function (index) {
            var locationWidget = this;
            var location = locationWidget.options.data[index];

            generalTools.getDirections(location);
        },

        //remove all traces of the map
        removeWidget: function () {
            var locationWidget = this;
            if (locationWidget._map) {
                locationWidget._clearMarkers();
                locationWidget._map.removeLayer(locationWidget._cloudmade);
                locationWidget._map = null;
            }
            $(locationWidget.element)[0].innerHTML = "";
        }
    });
});