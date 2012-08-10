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
    });
    //If when going back from routeTask prompt selection of task status.
    $.subscribe("hashChange", function (data) {
        if (data.comingFrom === "#view/routeTask.html" && data.goingTo === "#view/routeDestinationDetails.html") {
            //Open task statuses actionsheet
            $("#taskStatuses-actionsheet").kendoMobileActionSheet("open");
        }
    });

    routeTask.initialize = function () {
        dbServices.getServiceDetails(vm.get("selectedTask.ServiceId"), new Date(), vm.get("selectedTask.recurringServiceId"),
            function (service) {
                vm.set("selectedService", service);
            });
        dbServices.getTaskStatuses(function (response) {
            vm.set("taskStatusesSource",
                new kendo.data.DataSource({
                    data: response
                }));
        });
        vm.selectStatus = function () {
            alert("Thank you for selecting a status!");
        };

        $("#taskServiceDetails").kendoServiceDetails({
            source: vm.get("selectedService")
        });

//        $("#taskStatuses").kendoTaskStatuses({
//            source: vm.get("selectedService")
//        });
    };
});