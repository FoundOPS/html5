// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["sections/linkedEntitySection", "sections/routeDetails", "tools"], function (createBase, routeDetails, tools) {
    var vm, section = createBase("routeTask", "routeTaskId",
        //on init
        function () {
            var routeDestination = routeDetails.vm.get("nextEntity");

            if (!routeDestination || !routeDestination.RouteTasks) {
                main.setHash("routeDetails", tools.getParameters());
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
        });

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
        if (vm.get("selectedEntity.Location")) {
            window.location = "http://maps.google.com/maps?q=" + vm.get("selectedEntity.Location.Latitude") + "," + vm.get("selectedEntity.Location.Longitude");
        } else {
            window.location = "http://maps.google.com/maps?q=" + vm.get("selectedEntity.Client.Name");
        }
    };

    return section;
});