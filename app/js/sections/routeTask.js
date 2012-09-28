// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold the selected route task's logic.
 */

'use strict';

define(["sections/routeDestinationDetails", "db/services", "db/saveHistory", "tools/parameters", "widgets/serviceDetails"], function (routeDestinationDetails, dbServices, saveHistory, parameters) {
    /**
     * routeTask = wrapper for all service objects
     * vm = viewModel
     * popupCaller = the button who's click opened the popup.
     */
    var section = {}, vm = kendo.observable(), popupCaller;
    window.routeTask = section;

    section.vm = vm;

    var updateSelectedStatus = function () {
        var selectedStatusId = vm.get("selectedTask.TaskStatusId");
        var selectedStatus = _.find(vm.get("taskStatusesSource").data(), function (status) {
            return status.Id === selectedStatusId;
        });
        vm.set("selectedTaskStatus", selectedStatus);
    };

//public methods

    section.initialize = function () {
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
    /**
     * Move back to routeDestinationDetails
     * @param force Do not require task status selection
     */
    section.onBack = function (force) {
        /* If user has already selected a status -> go back
         otherwise open the task status popup */
        if (force || vm.statusUpdated) {
            var query = parameters.get();
            //remove the routeTaskId so it does not jump back here
            delete query.routeTaskId;
            parameters.set(query, true, {name: "routeDestinationDetails"});
        } else {
            vm.openTaskStatuses("backButton");
        }
    };
    section.show = function () {
        saveHistory.close();
        var routeTask = routeDestinationDetails.vm.get("nextEntity");
        if (!routeTask) {
            section.onBack(true);
            return;
        }

        vm.set("selectedTask", routeTask);

        //clear statusUpdated
        vm.statusUpdated = false;

        dbServices.getTaskStatuses(function (response) {
            var taskStatuses = new kendo.data.DataSource({data: response});
            vm.set("taskStatusesSource", taskStatuses);
            updateSelectedStatus();
        });
        dbServices.getServiceDetails(vm.get("selectedTask.ServiceId"), vm.get("selectedTask.Date"), vm.get("selectedTask.RecurringServiceId"), vm.get("selectedTask.ServiceTemplateId"),
            function (service) {
                vm.set("selectedService", service);

                saveHistory.close();
                saveHistory.resetHistory();
            });

        saveHistory.setCurrentSection({
            page: "Route Task",
            save: section.save,
            undo: section.undo,
            state: function () {
                return vm.get("selectedService");
            }
        });
    };

    section.save = function () {
        dbServices.updateService(vm.get("selectedService"));
        vm.statusUpdated = false;
    };
    section.undo = function (state) {
        //fixes a problem when the state is stored bc it is converted to json and back
        dbServices.convertServiceDates(state);
        vm.set("selectedService", state);
        section.save();
    };

//vm methods

    vm.openTaskStatuses = function (originator) {
        $("#taskStatuses-dimmer").css("visibility", "visible");
        $("#taskStatuses").css("visibility", "visible");
        $("#taskStatuses-dimmer").css("z-index", "1000");
        $("#taskStatuses-dimmer").fadeTo(400, 0.8);
        $("#taskStatuses").css("z-index", "10000");
        $("#taskStatuses").fadeTo(400, 1);
        popupCaller = originator;
    };
    vm.closeTaskStatuses = function (e) {
        $("#taskStatuses-dimmer").fadeTo(400, 0);
        $("#taskStatuses").fadeTo(400, 0);
        setTimeout(function () {
            $("#taskStatuses-dimmer").css("z-index", "-1");
            $("#taskStatuses").css("z-index", "-10");
            $("#taskStatuses-dimmer").css("visibility", "hidden");
            $("#taskStatuses").css("visibility", "hidden");
        }, 400);
        // If popup was opened by clicking backButton go back if and only if user selects status.
        if (popupCaller === "backButton" /*&& !e*/) { // Comment forces user to select status before going back.
            section.onBack(true);
        }
    };
    vm.selectStatus = function (e) {
        var statusId = e.dataItem.Id;

        var task = vm.get("selectedTask");
        task.TaskStatusId = statusId;

        dbServices.updateRouteTask(task);
        updateSelectedStatus();

        vm.statusUpdated = true;
        this.closeTaskStatuses();
    };
    vm.statusUpdated = false;

    return section;
});