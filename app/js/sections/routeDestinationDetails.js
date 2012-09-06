// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["jquery", "db/saveHistory", "lib/kendo.all", "widgets/contacts"], function ($, saveHistory) {
    /**
     * routeDestinationDetails = wrapper for all routeDestinationDetails objects
     */
    var routeDestinationDetails = {}, vm = kendo.observable(), initialized = false;
    window.routeDestinationDetails = routeDestinationDetails;

    routeDestinationDetails.vm = vm;

    var onRefresh = function (params) {
        setTimeout(function () {
            var pageRefreshedOn = (main.history[0].slice(main.history[0].indexOf("/") + 1, main.history[0].indexOf(".")));
            if (pageRefreshedOn !== "routes" && pageRefreshedOn !== "routeDetails" && pageRefreshedOn !== "routeDestinationDetails" && main.history.length === 4) {
                var source = vm.get("routeTasksSource")._data;
                var task;
                for (task = 0; task < source.length; task++) {
                    if (params.routeTaskId === source[task].Id) {
                        var e = {};
                        e.dataItem = source[task];
                        vm.selectTask(e);
                        break;
                    }
                }
            }
        }, 0);
    };

//region routeDestinationDetails Objects
    routeDestinationDetails.initialize = function () {
        main.route.matched.add(function (section, query) {
            if (section !== "routeDestinationDetails") {
                return;
            }
            vm.getDestinationDetails(query);
        });
        onRefresh(main.parseURLParams(main.history[0]));
    };
    routeDestinationDetails.show = function () {
        main.parseHash();

        saveHistory.close();

        if (!initialized) {
            // Routes has not been opened yet, so jump there
            if (!vm.get("selectedDestination")) {
                hasher.setHash("view/routes.html");
                return;
            }
            initialized = true;
        }
        kendo.bind($("#routeDestinationDetails"), vm, kendo.mobile.ui);
        kendo.bind($("#directionsButton"), vm);
    };
//endregion

//region VM Objects
    vm.getDestinationDetails = function (query) {
        var destination;
        var source = routeDetails.vm.get("routeDestinationsSource");
        if (source) {
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
        }
    };
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

        var params = {routeId: routeDetails.vm.get("selectedRoute.Id"), routeDestinationId: vm.get("selectedDestination.Id"), routeTaskId: vm.get("selectedTask.Id")};
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
//endregion
});