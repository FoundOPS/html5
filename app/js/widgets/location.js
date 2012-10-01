// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "ui/ui", "kendo", "lib/leaflet"], function ($, dbServices, fui) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        map,
        mapElement,
        locationA = {Id: 12345, Name: "Black Sparrow", AddressLineOne: "223 Main St", AddressLineTwo: null, City: "Lafayette", State: "IN",
            ZipCode: "47901", Latitude: 40.419119, Longitude: -86.894604},
        locationB = {Id: 67890, Name: "FoundOPS Headquarters", AddressLineOne: "1305 Cumberland Ave", AddressLineTwo: "Suite 205",
            City: "West Lafayette", State: "IN", ZipCode: "47906", Latitude: 40.459989, Longitude: -86.930867};
    var location = locationA;

    var Location = Widget.extend({
        init: function (element, options) {
            var _location, that = this;

            Widget.fn.init.call(that, element, options);

            options = this.options;

            _location = $('<h3>Location</h3>' +
                '<div id="locationWidgetMap">' +
                '</div>' +
                '<div id="editPane">' +
                '</div>'
            );

            this.element.append(_location);

            //region SetupMap

            // initialize the map on the "locationWidgetMap" div with a given center and zoom
            map = L.map('locationWidgetMap', {
                attributionControl: false,
                zoomControl: false
            }).setView([location.Latitude, location.Longitude], 16);
            // create a CloudMade tile layer and add it to the map
            L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18
            }).addTo(map);
            var icon = L.icon({
                iconUrl: fui.ImageUrls.MARKER,
                iconAnchor: [10,30],
                popupAnchor: [2,-30],
                shadowUrl: fui.ImageUrls.MARKER_SHADOW
            });
            // add a marker at the location, with a popup containing the location name
            L.marker([location.Latitude, location.Longitude],{
                icon: icon
            }).addTo(map).bindPopup('<button id="saveLocation" class="k-button k-button-icontext" onclick=""><span class="k-icon k-update"></span>Save</button>',{
                    closeButton: false
                });

            //endregion
        },

        options: new kendo.data.ObservableObject({
            name: "Location"
        })
    });

    ui.plugin(Location);
});