// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold selected service's logic.
 */

'use strict';

define(["jquery", "db/services", "db/saveHistory", "lib/kendo.all", "widgets/serviceDetails"], function ($, dbServices, saveHistory) {
    /**
     * routeTask = wrapper for all service objects
     * popupCaller the button who's click opened the popup.
     */
    var routeTask = {}, vm, initialized = false, popupCaller;

    routeTask.vm = vm = kendo.observable({
        openTaskStatuses: function (originator) {
            $("#taskStatuses-dimmer").css("z-index", "1000");
            $("#taskStatuses-dimmer").fadeTo(400, 0.5);
            $("#taskStatuses").css("z-index", "10000");
            $("#taskStatuses").fadeTo(400, 1);
            popupCaller = originator;
        },
        closeTaskStatuses: function (e) {
            console.log(e);
            $("#taskStatuses-dimmer").fadeTo(400, 0);
            $("#taskStatuses").fadeTo(400, 0);
            setTimeout(function () {
                $("#taskStatuses-dimmer").css("z-index", "-10");
                $("#taskStatuses").css("z-index", "-1");
            }, 400);
            // If popup was opened by clicking backButton go back if and only if user selects status.
            if (popupCaller === "backButton" && !e) {
                application.navigate("view/routeDestinationDetails.html");
            }
        },
        selectStatus: function (e) {
            var statusId = e.dataItem.Id;

            var task = vm.get("selectedTask");
            task.TaskStatusId = statusId;

            dbServices.updateRouteTask(task);
            updateSelectedStatus();

            vm.statusUpdated = true;
            this.closeTaskStatuses();
        },
        statusUpdated: false
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
        dbServices.getServiceDetails(data.get("ServiceId"), data.get("Date"), data.get("RecurringServiceId"), data.get("ServiceTemplateId"),
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

    routeTask.initialize = function () {
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
        if (!initialized) {
            //a task has not been selected, so go to routes view
            if (!vm.get("selectedTask")) {
                application.navigate("view/routes.html");
                return;
            }
            initialized = true;
        }

        //clear statusUpdated
        vm.statusUpdated = false;

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