// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold selected service's logic.
 */

'use strict';

define(["jquery", "db/services", "lib/kendo.all", "widgets/serviceDetails"], function ($, dbServices) {
    /**
     * routeTask = wrapper for all service objects
     */
    var routeTask = {}, vm = kendo.observable();

    routeTask.vm = vm;

    window.routeTask = routeTask;

    $.subscribe("selectedTask", function (data) {
        vm.set("selectedTask", data);
        dbServices.getServiceDetails(vm.get("selectedTask.ServiceId"), new Date(), vm.get("selectedTask.recurringServiceId"),
            function (service) {
                vm.set("selectedService", service);
            });
    });

    routeTask.initialize = function () {
        $("#taskServiceDetails").kendoServiceDetails({
            source: vm.get("selectedService")
        });
    };
});