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

    $.subscribe("selectedDestination", function (data) {
        vm.set("selectedDestination", data);
    });


    var initialized = false;

    routeDestinationDetails.show = function () {
        saveHistory.close();

        if (initialized) {
            return;
        }
        //a destination has not been selected, so go to routes view
        if (!vm.get("selectedDestination")) {
            application.navigate("view/routes.html");
            return;
        }
        initialized = true;

        /**
         * Creates dataSources for the contacts widget.
         * @return {*}
         */
        vm.contacts = function () {
            return _.union(vm.get("selectedDestination.Client.ContactInfoSet").slice(0), vm.get("selectedDestination.Location.ContactInfoSet").slice(0));
        };
        /**
         * A kendo data source for the current user's selected route destination.
         * @type {kendo.data.DataSource}
         */
        vm.set("routeTasksSource",
            new kendo.data.DataSource({
                data: vm.get("selectedDestination.RouteTasks")
            }));
        /**
         * Select a task and create a dataSource for the task input fields.
         * @param e The event args from a list view click event (the selected Task)
         */
        vm.selectTask = function (e) {
            vm.set("selectedTask", e.dataItem);

            localStorage.setItem("selectedTask", vm.get("selectedTask.Id"));
            $.publish("selectedTask", [vm.get("selectedTask")]);
            application.navigate("view/routeTask.html");
        };
        kendo.bind($("#routeDestinationDetails"), vm, kendo.mobile.ui);
    };
});