// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["sections/linkedEntitySection", "sections/routeDetails", "parameters"], function (createBase, routeDetails, parameters) {
    var vm, section = createBase("routeTask", "routeTaskId",
        //on show
        function () {
            var routeDestination = routeDetails.vm.get("nextEntity");

            if (!routeDestination || !routeDestination.RouteTasks) {
                parameters.setSection("routeDetails");
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

    section.onBack = function () {
        var query = parameters.get();
        //remove the routeDestinationId so it does not jump back here
        delete query.routeDestinationId;
        parameters.set(query, true, {name: "routeDetails"});
    };

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
            var url = "http://maps.google.com/maps?q=" + vm.get("selectedEntity.Location.Latitude") + "," + vm.get("selectedEntity.Location.Longitude");
            window.plugins.childBrowser.showWebPage(url);
        } else {
            window.plugins.childBrowser.openExternal("http://maps.google.com/maps?q=" + vm.get("selectedEntity.Client.Name"));
        }
    };
    vm.contactClick = function (e) {
        if (e.dataItem.Type === "Phone Number") {
            window.location.href = "tel:" + e.dataItem.Data;
        } else if (e.dataItem.Type === "Email Address") {
            window.location.href = "mailto:" + e.dataItem.Data;
        } else if (e.dataItem.Type === "Website") {
            window.plugins.childBrowser.showWebPage("http://" + e.dataItem.Data);
        }
    };

    return section;
});