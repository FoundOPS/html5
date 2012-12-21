// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["sections/linkedEntitySection", "sections/routeDetails", "tools/parameters", "developer", "tools/generalTools", "tools/analytics",
    "db/services", "widgets/contactInfo"], function (createBase, routeDetails, parameters, developer, generalTools, analytics, dbServices) {
    var vm, contacts,
    //true if on an Android device with cordova
        section = createBase("routeDestinationDetails", "routeTask", "routeTaskId",
            //on show
            function () {
                var routeDestination = routeDetails.vm.get("nextEntity");

                if (!routeDestination || !routeDestination.RouteTasks) {
                    parameters.set({section: {name: "routeDetails"}, replace: true});
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

//                $("#routeDestinationDetails .contactInfoWidget").contactInfo("destroy");

                //initiate the contactInfo widget
                $("#routeDestinationDetails .contactInfoWidget").contactInfo({
                    contacts: contacts,
                    entity: {
                        create: function (contactInfo) {
                            contactInfo.ClientId = vm.get("selectedEntity.Client.Id");
                            contactInfo.Id = generalTools.newGuid();
                            dbServices.contactInfo.create({body: contactInfo});
                            //Add contact from local data structure.
                            vm.get("selectedEntity.Client.ContactInfoSet").unshift(contactInfo);
                        },
                        update: function (contactInfo) {
                            dbServices.contactInfo.update({body: contactInfo});
                        },
                        destroy: function (id) {
                            dbServices.contactInfo.destroy({params: {id: id}});
                            var clientContacts = vm.get("selectedEntity.Client.ContactInfoSet"),
                                locationContacts = vm.get("selectedEntity.Location.ContactInfoSet"),
                                i;
                            //Remove contact from local data structure.
                            for (i = 0; i<clientContacts.length; i++) {
                                if (clientContacts[i].Id === id) {
                                    vm.get("selectedEntity.Client.ContactInfoSet").splice(i, 1);
                                }
                            }
                            for (i = 0; i<locationContacts.length; i++) {
                                if (locationContacts[i].Id === id) {
                                    vm.get("selectedEntity.Location.ContactInfoSet").splice(i, 1);
                                }
                            }
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
            if (currentPosition) {
                window.open("http://maps.google.com/maps?saddr=" + currentPosition + "&daddr=" + destination);
            } else {
                window.open("http://maps.google.com/maps?q=" + destination);
            }
        };

        if (generalTools.checkPlatform.isAndroid() && generalTools.checkPlatform.isCordova()) {
            window.location.href = "geo:0,0?q=" + destination; //Opens google navigation on Android phones
        } else {
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
        }
    };

    return section;
});