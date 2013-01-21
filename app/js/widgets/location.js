// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["db/services", "ui/ui", "tools/generalTools", "tools/generalTools"], function (dbServices, ui, generalTools, tools) {
    $.widget("ui.location", {
        options: {
            //Callback functions, each passed the location
            add: null, //called after the add button was clicked, and a location is selected/saved
            change: null, //called after the edit button was clicked, and a location is selected/saved
            delete: null,
            //Will return locations for this Client in queries
            clientId: null,
            //Locations array to display initially
            data: null
        },

        _init: function () {
            var widget = this, element = $(widget.element);

            if (!widget.options.data instanceof Array) {
                throw Error("Locations must be an array");
            }

            //"locationInput" class is used for all inputs so that their values can be cleared
            //"geocoded" class is used for the inputs that get disabled and enabled based on if "Manually Place Pin" was selected
            widget._location = $('<div id="locationWidgetMap"></div>' +
                '<ul class="splitBtnList"></ul>' +
                '<div class="addButtonWrapper">' +
                '<button class="k-button k-button-icontext add"><span class="k-icon k-add"></span>Add New</button>' +
                '</div>' +
                '<div class="editPane">' +
                '<div class="locationSearchSelect"></div>' +
                '<div id="addressWrapper">' +
                '<label for="nickname">Name</label><br />' +
                '<input name="nickname" class="nickname locationInput" type="text" /><br />' +
                '<label for="line1">Line 1</label><br />' +
                '<input name="line1" class="line1 locationInput geocoded" type="text" /><br />' +
                '<label for="line2">Line 2</label><br />' +
                '<input name="line2" class="line2 locationInput" type="text" /><br />' +
                '<label for="city">City</label><br />' +
                '<input name="city" class="city locationInput geocoded" type="text" /><br />' +
                '<div class="zipCodeWrapper">' +
                '<label for="zipCode">Zip Code</label><br />' +
                '<input name="zipCode" class="zipCode locationInput geocoded" type="text" />' +
                '<div class="stateWrapper">' +
                '<label for="state">State</label><br />' +
                '<div class="styled-select">' +
                '<select name="state" class="state selectBox locationInput geocoded">' +
                '<option selected="selected">Select a State</option>' +
                '</select>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="saveDeleteButtonWrapper">' +
                '<button class="k-button k-button-icontext saveBtn"><span class="k-icon k-update"></span>Save</button>' +
                '<button class="k-button k-button-icontext cancelBtn"><span class="k-icon k-delete"></span>Cancel</button>' +
                '<button class="k-button k-button-icontext deleteBtn"><span class="k-icon k-delete"></span>Delete</button>' +
                '</div>' +
                '</div>'
            );

            element.append(widget._location);

            var states = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL",
                "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
                "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
                "VA", "WA", "WV", "WI", "WY"];

            //populate the options list with states
            _.each(states, function (value) {
                var option = $("<option value='" + value + "'>" + value + "</option>");
                option.appendTo(element.find(".state"));
            });

            //if multiple locations, show the delete button
            if (widget.options.delete) {
                widget.multiple = true;
                element.find(".deleteBtn")[0].style.display = "inline-block";
                element.find(".saveDeleteButtonWrapper")[0].style.width = "220px";
            }

            //setup searchSelect
            element.find(".locationSearchSelect").searchSelect({
                query: function (searchTerm, callback) {
                    //show the loading image
                    element.find(".locationSearchSelect input").css("background-image", "url('img/spinner.gif')").css("background-position", "98% 50%").css("background-repeat", "no-repeat");
                    //get the search results
                    dbServices.locations.read({params: {search: searchTerm, ClientId: widget.options.clientId}}).done(function (locations) {
                        //hide the loading image
                        element.find("input").css("background", "");
                        element.find("#addressWrapper")[0].style.opacity = 0.3;
                        element.find(".optionList")[0].style.border = "1px solid #5bad52";
                        callback(locations);
                    });
                },
                formatItem: generalTools.getLocationDisplayString,
                onSelect: function (e, selectedData) {
                    var element = $(widget.element);

                    //if "Manually Place Pin" was selected
                    if (e.target.innerText === "Manually Place Pin") {
                        //allow the marker to move on map click
                        widget._allowMapClick = true;
                        //hide the save button
                        element.find(".saveBtn")[0].style.display = "none";
                        if (widget.options.delete) {
                            element.find(".saveDeleteButtonWrapper")[0].style.width = "155px";
                        } else {
                            element.find(".saveDeleteButtonWrapper")[0].style.width = "80px";
                        }

                        widget._clearMarkers();
                        widget._enableFields();

                        //generate a new guid
                        selectedData = {Id: tools.newGuid(), IsNew: true};
                    }
                    //if a location was selected
                    else {
                        widget._disableFields();
                        widget._populateFields(selectedData);
                        widget._showMarker(selectedData);
                        widget.showSaveButton();
                    }

                    //update the selected data client id to the location ClientId
                    if (selectedData.IsNew) {
                        selectedData.ClientId = widget.options.clientId;
                    }

                    //update the item to the selected location
                    widget.options.data[widget.editIndex] = selectedData;
                },
                onClose: function () {
                    element.find("#addressWrapper")[0].style.opacity = 1;
                    element.find(".optionList")[0].style.border = "none";
                },
                queryDelay: 750,
                minimumInputLength: 0,
                showPreviousSelection: true,
                //add "manually place pin" option
                additionalListItem: '<li><span class="manuallyPlacePin"></span><span class="name">Manually Place Pin</span></li>',
                dontCloseOn: true
            });

            //initialize the map on the "locationWidgetMap" div with a given center and zoom
            widget._map = L.map('locationWidgetMap', {
                //center on 'merica!
                center: [40, -89],
                zoom: 4,
                attributionControl: false,
                zoomControl: false
            });

            //create a CloudMade tile layer and add it to the map
            widget._cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18
            });
            widget._map.addLayer(widget._cloudmade);

            //create an icon to be used for all map markers
            widget.icon = L.icon({
                iconUrl: ui.ImageUrls.MARKER,
                iconAnchor: [13, 30],
                popupAnchor: [0, -30],
                shadowUrl: ui.ImageUrls.MARKER_SHADOW
            });

            //if "Manually Place Pin" mode move the marker on map click
            widget._map.on('click', function (e) {
                //check if in "Manually Place Pin" mode
                if (widget._allowMapClick) {
                    //add a marker at the location
                    widget._showMarker({Latitude: e.latlng.lat, Longitude: e.latlng.lng});

                    //save the lat/lng
                    var location = widget.options.data[widget.editIndex];

                    location.Latitude = e.latlng.lat;
                    location.Longitude = e.latlng.lng;

                    widget.showSaveButton();
                }
            });

            element.find(".add").on("click", function () {
                widget.edit(null, true);
            });

            element.find(".saveBtn").on("click", function () {
                var location = widget.options.data[widget.editIndex];

                //update values from the inputs
                location.Name = element.find(".nickname").val();
                location.AddressLineOne = element.find(".line1").val();
                location.AddressLineTwo = element.find(".line2").val();
                location.AdminDistrictOne = element.find(".state").val();
                location.AdminDistrictTwo = element.find(".city").val();
                location.PostalCode = element.find(".zipCode").val();

                //if adding a new location
                if (widget.entityIsAdded) {
                    widget.options.add(location);
                }
                //if editing the current location
                else {
                    //update the properties of the existing location that could have changed
                    if (location.Id === widget._selectedEntity.Id) {
                        widget._selectedEntity.Name = location.Name;
                        widget._selectedEntity.AddressLineOne = location.AddressLineOne;
                        widget._selectedEntity.AddressLineTwo = location.AddressLineTwo;
                        widget._selectedEntity.AdminDistrictOne = location.AdminDistrictOne;
                        widget._selectedEntity.AdminDistrictTwo = location.AdminDistrictTwo;
                        widget._selectedEntity.PostalCode = location.PostalCode;
                        widget._selectedEntity.CountryCode = location.CountryCode;
                        widget._selectedEntity.Latitude = location.Latitude;
                        widget._selectedEntity.Longitude = location.Longitude;
                        location = widget.options.data[widget.editIndex] = widget._selectedEntity;
                    }

                    widget.options.change(location);
                }
                //switch to the location list
                widget.showList();

                widget._allowMapClick = false;
                widget.entityIsAdded = false;
            });

            element.find(".deleteBtn").on("click", function () {
                var answer = confirm("Are you sure you want to delete this location?");
                if (answer) {
                    widget.options.data.splice(widget.editIndex, 1);
                    if (!widget.entityIsAdded)
                        widget.options.delete(widget.options.data[widget.editIndex]);
                    widget.showList();
                }
            });

            element.find(".cancelBtn").on("click", function () {
                //reset to the initially selected entity
                widget.options.data[widget.editIndex] = widget._selectedEntity;

                //switch to the location list
                widget.showList();

                widget._allowMapClick = false;

                widget.showSaveButton();
            });

            //check there is at least one location
            if (!widget.options.data || !widget.options.data[0]) {
                widget.edit(null, false);
                return;
            }
            widget.showList();
        },

        /**
         * Animate to the edit screen
         * @param {number} index
         * @param {boolean} isAdded if this is a newly added location
         */
        edit: function (index, isAdded) {
            var widget = this, element = $(widget.element);
            widget.entityIsAdded = isAdded;

            if (isAdded) {
                index = widget.options.data.length;
                widget.options.data.push({});
            }

            widget.editIndex = index;

            //store the entity before it is changed
            var location = widget._selectedEntity = widget.options.data[widget.editIndex];

            element.find(".locationSearchSelect input").val("");

            //switch to edit screen
            element.find(".addButtonWrapper")[0].style.display = "none";
            //only animate if in skinny mode
            if (element[0].clientWidth > 500) {
                element.find(".splitBtnList")[0].style.display = "none";
                element.find(".editPane")[0].style.display = "block";
                //keep the map height equal to the edit pane height
                $("#locationWidgetMap")[0].style.height = element.find(".editPane").height() + "px";
            } else {
                element.find(".splitBtnList").animate({
                    height: 'hide'
                }, "swing", function () {
                    element.find(".editPane").animate({
                        height: 'show'
                    }, "swing");
                });
            }


            if (location) {
                widget._populateFields(location);
            } else {
                //clear the inputs
                element.find(".locationInput").val("");
                widget._clearMarkers();
            }

            widget._disableFields();

            widget.invalidateMap(50);

            //TODO: add an option to do this, or just always do this if multiple locations
            //element.find(".locationSearchSelect").searchSelect("open", []);
        },

        //repopulate the list, show it, and place the corresponding markers on the map
        showList: function () {
            var widget = this, element = $(this.element), li;

            //clear selected
            widget._selectedEntity = null;
            widget.editIndex = null;

            var locations = widget.options.data;
            //clear current list
            element.find(".splitBtnList")[0].innerHTML = "";

            widget._clearMarkers();

            widget._markers = L.layerGroup();

            //re-populate the list
            for (var i in locations) {
                var location = locations[i];

                if (!location.Latitude || !location.Longitude) {
                    continue;
                }

                //add a marker at the location
                widget._marker = L.marker([location.Latitude, location.Longitude], {
                    icon: widget.icon
                });

                widget._marker.addTo(widget._markers);

                //keep "num" between 0 and 9 because there are only 10 colors
                var num = i;
                while (num > 9) {
                    num -= 10;
                }
                //create a location list item
                li = "<li><span class='colorBar' style='background: " + ui.ITEM_COLORS[num].color + "'></span>" +
                    "<div class='splitEditBtn' id='index" + i + "'><span></span></div>" +
                    "<a class='navigateBtn' id='index" + i + "'>" +
                    generalTools.getLocationDisplayString(location, true) + "</a></li>";

                //add the location to the location list
                $(li).appendTo(element.find(".splitBtnList"));
            }

            //edit button click
            element.find(".splitEditBtn").on("click", function () {
                var index = parseInt(this.id.substring(5));
                widget.edit(index, false);
            });

            //navigate button click
            element.find(".navigateBtn").on("click", function () {
                var index = parseInt(this.id.substring(5));
                widget._navigateToLink(index);
            });

            //add the marker(s) to the map
            widget._map.addLayer(widget._markers);

            widget._colorMarkers(null);

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
                    widget._map.fitBounds([bounds]);
                } else {
                    widget._map.setView([locations[0].Latitude, locations[0].Longitude], 15);
                }

                widget.invalidateMap(50);

                //zoom out one more level
                //TODO: not working
                //widget._map.zoomOut();
            }

            //don't show add button unless there are multiple locations
            if (widget.options.delete) {
                element.find(".addButtonWrapper")[0].style.display = "block";
            }
            //only animate if in skinny mode
            if ($("#locationSelector")[0].clientWidth > 500) {
                element.find(".editPane")[0].style.display = "none";
                element.find(".splitBtnList")[0].style.display = "block";
                //keep the map height equal to the list height(plus 38 to account for add button)
                $("#locationWidgetMap")[0].style.height = element.find(".splitBtnList").height() + 38 + "px";
            } else {
                element.find(".editPane").animate({
                    height: 'hide'
                }, "swing", function () {
                    element.find(".splitBtnList").animate({
                        height: 'show'
                    }, "swing");
                });
            }
        },

        //add a marker to the map at the given location
        _showMarker: function (location) {
            var widget = this;

            widget._clearMarkers();

            widget._markers = L.layerGroup();

            //add a marker at the location
            widget._marker = L.marker([location.Latitude, location.Longitude], {
                icon: widget.icon
            });

            widget._marker.addTo(widget._markers);
            //add the marker to the map
            widget._map.addLayer(widget._markers);
            //center the map at the location being edited
            widget._map.setView([location.Latitude, location.Longitude], 15);

            widget._colorMarkers(ui.ITEM_COLORS[0].color);

            widget.invalidateMap(50);
        },

        //remove any markers from the map
        _clearMarkers: function () {
            var widget = this;

            if (widget._markers) {
                widget._map.removeLayer(widget._markers);
            }
        },

        /**
         * colors all markers on the map
         * @param {string} color
         * @private
         */
        _colorMarkers: function (color) {
            var widget = this;
            //wait for the markers to be loaded
            _.delay(function () {
                //http://stackoverflow.com/questions/9303757/how-to-change-color-of-an-image-using-jquery
                var i = 0;
                $(widget.element).find(".leaflet-marker-pane").find("img").each(function () {
                    //prevent a canvas error because the widget isn't ready yet, try again
                    if (this.height === 0 || this.width === 0) {
                        return false; //break the loop
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
            var element = $(this.element);
            element.find(".nickname").val(location.Name);
            element.find(".line1").val(location.AddressLineOne);
            element.find(".line2").val(location.AddressLineTwo);
            element.find(".city").val(location.AdminDistrictTwo);
            element.find(".state").val(location.AdminDistrictOne);
            element.find(".zipCode").val(location.PostalCode);
            element.find(".countryCode").val(location.CountryCode);
            element.find(".lat").val(location.Latitude);
            element.find(".lng").val(location.Longitude);
        },

        //disable the address fields
        _disableFields: function () {
            var element = $(this.element);
            element.find(".geocoded").attr("disabled", "disabled");
            var color = "#999";
            element.find(".line1")[0].style.color = color;
            element.find(".city")[0].style.color = color;
            element.find(".zipCode")[0].style.color = color;
            element.find(".state")[0].style.color = color;
        },

        //enable the address fields
        _enableFields: function () {
            var element = $(this.element);
            element.find(".geocoded").removeAttr("disabled");
            var color = "#000";
            element.find(".line1")[0].style.color = color;
            element.find(".city")[0].style.color = color;
            element.find(".zipCode")[0].style.color = color;
            element.find(".state")[0].style.color = color;
        },

        invalidateMap: function (delay) {
            var widget = this;
            _.delay(function () {
                if (widget._map)
                    widget._map.invalidateSize(false);
            }, delay);
        },

        //switch to list on the left
        wideView: function (rightWidth) {
            var element = $(this.element);
            var newWidth = rightWidth - 57 - 280;
            var newHeight = element[0].clientWidth > 500 ? element.height() : element.height() - 150;
            $("#locationWidgetMap").attr("style", "float: right; width:" + newWidth + "px; height:" + newHeight + "px; border-left: 4px solid #e6e6e6;");
            element.find(".splitBtnList")[0].style.width = "276px";
            element.find(".editPane")[0].style.width = "276px";
            element.find(".addButtonWrapper")[0].style.margin = "10px 0 0 92px";
        },

        //switch to list on the bottom
        narrowView: function () {
            var element = $(this.element);

            $("#locationWidgetMap").attr("style", "float: none; width: 100%; height: 150px; border-left: none;");
            if (element.find(".splitBtnList")[0]) {
                element.find(".splitBtnList")[0].style.width = "100%";
                element.find(".editPane")[0].style.width = "100%";
                element.find(".addButtonWrapper")[0].style.margin = "10px auto 0 auto";
            }
        },

        showSaveButton: function () {
            var widget = this, element = $(widget.element);

            element.find(".saveBtn")[0].style.display = "inline-block";
            if (widget.options.delete) {
                element.find(".saveDeleteButtonWrapper")[0].style.width = "220px";
            } else {
                element.find(".saveDeleteButtonWrapper")[0].style.width = "155px";
            }
        },

        /**
         * opens a new window with google maps directions to the selected location
         * @param {number} index
         * @private
         */
        _navigateToLink: function (index) {
            var widget = this;
            var location = widget.options.data[index];

            generalTools.getDirections(location);
        },

        //remove all traces of the map
        removeWidget: function () {
            var widget = this;
            widget._map = null;
            $(widget.element).empty();
        }
    });
});