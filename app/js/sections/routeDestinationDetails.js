// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["sections/linkedEntitySection", "sections/routeDetails", "tools/parameters", "developer", "tools/analytics"], function (createBase, routeDetails, parameters, developer, analytics) {
    var vm, section = createBase("routeTask", "routeTaskId",
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

            kendo.bind($("#routeDestinationDetails"), vm, kendo.mobile.ui);
            kendo.bind($("#directionsButton"), vm);

            //try to move forward
            section._moveForward();

            //region Set touch/click animation for Direction's button.
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
            //endregion
        });

        //Boolean that states whether user is on Android device or not.
    var androidDevice = developer.CURRENT_FRAME === developer.Frame.MOBILE_APP && kendo.support.detectOS(navigator.userAgent).device === "android";

    window.routeDestinationDetails = section;
    vm = section.vm;

//vm additions

    /**
     * Creates dataSources for the contacts listview
     * @return {*}
     */
    vm.contacts = function () {
        if (vm.get("selectedEntity.Location")) {
            return _.union(vm.get("selectedEntity.Client.ContactInfoSet").slice(0), vm.get("selectedEntity.Location.ContactInfoSet").slice(0));
        } else {
            return vm.get("selectedEntity.Client.ContactInfoSet").slice(0);
        }
    };
    vm.getDirections = function () {
        var currentPosition,
            destination = vm.get("selectedEntity.Location.Latitude") + "," + vm.get("selectedEntity.Location.Longitude");

        var navigateTo = function (destination, currentPosition) {
            if (androidDevice) {
                window.location.href = "geo:0,0?q=" + destination; //Opens google navigation on Android phones.
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
    vm.contactClick = function (e) {
        if (e.dataItem.Type === "Phone Number") {
            analytics.track("Phone Contact Click");
            window.location.href = "tel:" + e.dataItem.Data;
        } else if (e.dataItem.Type === "Email Address") {
            analytics.track("Email Contact Click");
            window.location.href = "mailto:" + e.dataItem.Data;
        } else if (e.dataItem.Type === "Website") {
            analytics.track("Website Contact Click");
            if (androidDevice) {
                window.plugins.childBrowser.showWebPage("http://" + e.dataItem.Data);
            } else {
                window.open("http://" + e.dataItem.Data);
            }
        }
    };

    return section;
});