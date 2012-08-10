// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold selected service's logic.
 */

'use strict';

define(["jquery", "db/services", "db/saveHistory", "lib/kendo.all", "widgets/serviceDetails"], function ($, dbServices, saveHistory) {
    /**
     * routeTask = wrapper for all service objects
     */
    var routeTask = {}, vm;

    routeTask.vm = vm = kendo.observable({
        selectStatus: function (e) {
            var status = e.dataItem;
            var routeTask = vm.get("selectedTask");
            routeTask.set("TaskStatusId", status.Id);

            dbServices.updateRouteTask(routeTask);

            console.log(status);
        }});

    window.routeTask = routeTask;

    routeTask.undo = function (state) {
        //fixes a problem when the state is stored bc it is converted to json and back
        dbServices.convertServiceDates(state);
        vm.set("selectedService", state);
        //because the input will be re-rendered, re-hookup input change listeners
        saveHistory.saveInputChanges("#taskServiceDetails");
        routeTask.save();
    };

    routeTask.save = function () {
        dbServices.updateService(vm.get("selectedService"));
    };

    $.subscribe("selectedTask", function (data) {
        vm.set("selectedTask", data);
        dbServices.getServiceDetails(data.get("ServiceId"), data.get("Date"), data.get("RecurringServiceId"),
            function (service) {
                vm.set("selectedService", service);

                saveHistory.close();
                saveHistory.resetHistory();

                //watch for input changes
                saveHistory.saveInputChanges("#taskServiceDetails");
            });

        dbServices.getTaskStatuses(function (response) {
            vm.set("taskStatusesSource",
                new kendo.data.DataSource({
                    data: response
                }));
        });
    });
    //If when going back from routeTask prompt selection of task status.
    $.subscribe("hashChange", function (data) {
        if (data.comingFrom === "#view/routeTask.html" && data.goingTo === "#view/routeDestinationDetails.html") {
            //Open task statuses actionsheet
            $("#taskStatuses-actionsheet").kendoMobileActionSheet("open");
        }
    });

    routeTask.initialize = function () {
        $("#taskServiceDetails").kendoServiceDetails();

//        $("#taskStatuses").kendoTaskStatuses({
//            source: vm.get("selectedService")
//        });
    };

    routeTask.show = function () {
        saveHistory.close();

        //a task has not been selected, so jump there
        if (!vm.get("selectedTask")) {
            application.navigate("view/routeDestinationDetails.html");
            return;
        }

        saveHistory.setCurrentSection({
            page: "Route Task",
            save: routeTask.save,
            undo: routeTask.undo,
            state: function () {
                return vm.get("selectedService");
            }
        });
    };
});