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
    window.service = service;

    service.vm = vm;

    $.subscribe("selectedTask", function (data) {
        vm.selectedTask = data;
    });
    $.subscribe("selectedService", function (data) {
        vm.selectedService = data;
    });

    service.initialize = function () {
//        dbServices.getServiceDetails(vm.get("selectedTask").Id, function (data) {
//            vm.set("serviceDetailsSource", data[0]);
//            vm.set("serviceFieldsSource", vm.get("serviceDetailsSource").Fields);
//        });
    };

});