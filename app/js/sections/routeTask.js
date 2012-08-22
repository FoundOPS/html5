// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold selected service's logic.
 */

'use strict';

define(["jquery", "db/services", "db/saveHistory", "lib/kendo.all", "widgets/serviceDetails"], function ($, dbServices, saveHistory) {
    /**
     * routeTask = wrapper for all service objects
     */
    var routeTask = {}, vm, statusUpdated;

    routeTask.vm = vm = kendo.observable({
        openTaskStatuses: function () {
            $("#taskStatuses-actionsheet").kendoMobileActionSheet("open");
        },
        selectStatus: function (e) {
            var statusId = e.dataItem.Id;

            var task = vm.get("selectedTask");
            task.TaskStatusId = statusId;

            dbServices.updateRouteTask(task);
            updateSelectedStatus();

            statusUpdated = true;
        }
    });

    window.routeTask = routeTask;

    var updateSelectedStatus = function () {
        var selectedStatusId = vm.get("selectedTask.TaskStatusId");
        var selectedStatus = _.find(vm.get("taskStatusesSource").data(), function (status) {
            return status.Id === selectedStatusId;
        });
        vm.set("selectedTaskStatus", selectedStatus);
    };

    routeTask.undo = function (state) {
        //fixes a problem when the state is stored bc it is converted to json and back
        dbServices.convertServiceDates(state);
        vm.set("selectedService", state);
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
            });

        dbServices.getTaskStatuses(function (response) {
            var taskStatuses = new kendo.data.DataSource({data: response});
            vm.set("taskStatusesSource", taskStatuses);
            updateSelectedStatus();
        });
    });

    //If when going back from routeTask prompt selection of task status.
    $.subscribe("hashChange", function (data) {
        if (data.comingFrom === "#view/routeTask.html" && data.goingTo === "#view/routeDestinationDetails.html") {
            //Open task statuses actionsheet
            if (!statusUpdated) {
                $("#taskStatuses-actionsheet").kendoMobileActionSheet("open");
            }
        }
    });

    routeTask.initialize = function () {
        //a task has not been selected, so jump there
        if (!vm.get("selectedTask")) {
            application.navigate("view/routeDestinationDetails.html");
            return;
        }

        $("#taskServiceDetails").kendoServiceDetails({
            clientIsReadOnly: true
        });

        //save changes whenever the selected service has a change
        vm.bind("change", function (e) {
            if (e.field.indexOf("selectedService.") > -1) {
                saveHistory.save();
            }
        });
    };

    routeTask.show = function () {
        //clear statusUpdated
        statusUpdated = false;

        saveHistory.close();

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