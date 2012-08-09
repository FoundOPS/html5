// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold selected service's logic.
 */

'use strict';

define(["jquery", "db/services", "lib/kendo.all", "widgets/serviceDetails"], function ($, dbServices) {
    /**
     * service = wrapper for all service objects
     */
    var service = {}, vm = kendo.observable();

    service.vm = vm;

    window.service = service;

    $.subscribe("selectedTask", function (data) {
        vm.set("selectedTask", data);
        dbServices.getServiceDetails(vm.get("selectedTask.ServiceId"), new Date(), vm.get("selectedTask.recurringServiceId"),
            function (service) {
                vm.set("selectedService", service);
            });
    });

    service.initialize = function () {
        $("#taskServiceDetails").kendoServiceDetails({
            source: vm.get("selectedService")
        });
    };
});