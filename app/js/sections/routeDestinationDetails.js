// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route destinations details logic.
 */

'use strict';

define(["jquery", "db/services", "lib/kendo.all",  "widgets/contacts"], function ($, dbServices) {
    /**
     * routeDestinationDetails = wrapper for all routeDestinationDetails objects
     */
    var routeDestinationDetails = {}, vm = kendo.observable();
    window.routeDestinationDetails = routeDestinationDetails;

    routeDestinationDetails.vm = vm;

    routeDestinationDetails.initialize = function () {
        /**
         * Creates dataSources for the contacts widget.
         * @return {*}
         */
        vm.contacts = function () {
            return _.union(routeDestinations.vm.get("selectedDestination.Client.ContactInfoSet").slice(0), routeDestinations.vm.get("selectedDestination.Location.ContactInfoSet").slice(0));
        };
        /**
         * Select a task and create a dataSource for the task input fields.
         * @param e The event args from a list view click event (the selected Task)
         */
        vm.selectTask = function (e) {
            vm.set("selectedTask", e.dataItem);
            dbServices.getTaskDetails(vm.get("selectedTask").Id, function (data) {
                vm.set("taskDetailsSource", data[0]);
                vm.set("taskFieldsSource", vm.get("taskDetailsSource").Fields);
                //TODO: Navigate to task/service input fields when widget is implemented.
            });
        };
        kendo.bind($("#routeDestinationDetails"), vm, kendo.mobile.ui);
        kendo.bind($("#contacts"), routeDestinations.vm);
    };
});