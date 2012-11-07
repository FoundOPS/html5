// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["sections/linkedEntitySection", "sections/routeDetails", "tools/parameters", "developer", "tools/generalTools", "tools/analytics",
    "lib/platform", "db/services", "underscore", "underscore.string", "widgets/contactInfo"], function (createBase, routeDetails, parameters, developer, generalTools, analytics, platform, dbServices, _, _s) {
    var vm, contacts,
    //true if on an Android device with cordova
        androidCordova = window.cordova && _s.include(platform.os, "Android"),
        section = createBase("routeTask", "routeTaskId",
            //on show
            function () {
                var routeDestination = routeDetails.vm.get("nextEntity");

                if (!routeDestination || !routeDestination.RouteTasks) {
                    parameters.set({section: {name: "routeDetails"}});
                    return;
                }

                vm.set("selectedEntity", routeDestination);
                vm.set("dataSource", new kendo.data.DataSource({
                    data: routeDestination.RouteTasks
                }));

                //get the list of contacts
                if (vm.get("selectedEntity.Location")) {
                    contacts = _.union(vm.get("selectedEntity.Client.ContactInfoSet").slice(0), vm.get("selectedEntity.Location.ContactInfoSet").slice(0));
                } else {
                    contacts = vm.get("selectedEntity.Client.ContactInfoSet").slice(0);
                }

                //initiate the contactInfo widget
                $("#routeDestinationDetails .contactInfoWidget").contactInfo({
                    contacts: contacts,
                    entity: {
                        create: function (contactInfo) {
                            contactInfo.ClientId = vm.get("selectedEntity.Client.Id");
                            contactInfo.Id = generalTools.newGuid();
                            dbServices.contactInfo.create({body: contactInfo});
                        },
                        update: function (contactInfo) {
                            dbServices.contactInfo.update({body: contactInfo});
                        },
                        destroy: function (id) {
                            dbServices.contactInfo.destroy({params: {contactInfoId: id}});
                        }
                    }
                });

                kendo.bind($("#routeDestinationDetails"), vm, kendo.mobile.ui);
                kendo.bind($("#directionsButton"), vm);

                //try to move forward
                section._moveForward();

                //Set touch/click animation for Direction's button.
                document.getElementById("directionsButton").addEventListener('touchstart', function (e) {
                    $("#directionsButton").toggleClass("buttonClicked");
                });
                document.getElementById("directionsButton").addEventListener('touchend', function (e) {
                    $("#directionsButton").toggleClass("buttonClicked");
                });
                document.getElementById("directionsButton").addEventListener('touchcancel', function (e) {
                    $("#directionsButton").toggleClass("buttonClicked");
                });
                document.getElementById("directionsButton").addEventListener('mousedown', function (e) {
                    $("#directionsButton").toggleClass("buttonClicked");
                });
                document.getElementById("directionsButton").addEventListener('mouseup', function (e) {
                    $("#directionsButton").toggleClass("buttonClicked");
                });
            });

    window.routeDestinationDetails = section;
    vm = section.vm;

    vm.getDirections = function () {
        var currentPosition,
            destination = vm.get("selectedEntity.Location.Latitude") + "," + vm.get("selectedEntity.Location.Longitude");

        var navigateTo = function (destination, currentPosition) {
            if (androidCordova) {
                window.location.href = "geo:0,0?q=" + destination; //Opens google navigation on Android phones
            } else if (currentPosition) {
                window.open("http://maps.google.com/maps?saddr=" + currentPosition + "&daddr=" + destination);
            } else {
                window.open("http://maps.google.com/maps?q=" + destination);
            }
        };
        //Attempt to get the user's current location.
        navigator.geolocation.getCurrentPosition(
            function (position) { // If geolocation is successful get directions. This is success function of geolocation API.
                currentPosition = position.coords.latitude + "," + position.coords.longitude;
                navigateTo(destination, currentPosition);
            },
            function () { // If geolocation is NOT successful find business location. This is error function of geolocation API.
                navigateTo(destination, false);
            },
            {timeout: 10000, enableHighAccuracy: true} //Options for geolocation API.
        );
    };

    return section;
});