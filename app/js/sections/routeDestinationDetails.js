// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["jquery", "db/saveHistory", "lib/kendo.all", "widgets/contacts"], function ($, saveHistory) {
    /**
     * routeDestinationDetails = wrapper for all routeDestinationDetails objects
     */
    var routeDestinationDetails = {}, vm = kendo.observable();
    window.routeDestinationDetails = routeDestinationDetails;

    routeDestinationDetails.vm = vm;

    var initialized = false;

    routeDestinationDetails.show = function () {
        main.parseHash();

        saveHistory.close();

        if (!initialized) {
            //a destination has not been selected, so go to routes view
            if (!vm.get("selectedDestination")) {
                application.navigate("view/routes.html");
                return;
            }
            initialized = true;
        }

        /**
         * Creates dataSources for the contacts widget.
         * @return {*}
         */
        vm.contacts = function () {
            return _.union(vm.get("selectedDestination.Client.ContactInfoSet").slice(0), vm.get("selectedDestination.Location.ContactInfoSet").slice(0));
        };
        /**
         * Select a task and create a dataSource for the task input fields.
         * @param e The event args from a list view click event (the selected Task)
         */
        vm.selectTask = function (e) {
            vm.set("selectedTask", e.dataItem);

            var params = {routeId: vm.get("selectedRoute.Id"), routeDestinationId: vm.get("selectedDestination.Id"), routeTaskId: vm.get("selectedTask.Id")};
            main.setHash("routeTask", params);
        };
        vm.getDirections = function () {
            $("#directionsButton").toggleClass("buttonClicked");
            // This timeout makes the buttonClicked animation visible to the user (otherwise it happens too fast).
            setTimeout(function () {
                window.location = "http://maps.google.com/maps?q=" + vm.get("selectedDestination.Location.Latitude") + "," + vm.get("selectedDestination.Location.Longitude");
                $("#directionsButton").toggleClass("buttonClicked");
            }, 500);
        };
        kendo.bind($("#routeDestinationDetails"), vm, kendo.mobile.ui);
        kendo.bind($("#directionsButton"), vm);
    };

    routeDestinationDetails.initialize = function () {
        main.route.matched.add(function (section, query) {
            if (section !== "routeDestinationDetails") {
                return;
            }

            var destination;
            var source = routeDetails.vm.get("routeDestinationsSource");
            for (destination in source._data) {
                if (query.routeDestinationId === source._data[destination].Id) {
                    vm.set("selectedDestination", source._data[destination]);
                }
            }

            /**
             * A kendo data source for the current user's selected route destination.
             * @type {kendo.data.DataSource}
             */
            vm.set("routeTasksSource",
                new kendo.data.DataSource({
                    data: vm.get("selectedDestination.RouteTasks")
                }));
        });
    };
});