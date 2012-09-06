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
    var routeTask = {}, vm = kendo.observable(), initialized = false, popupCaller;
    window.routeTask = routeTask;

    routeTask.vm = vm;

    var updateSelectedStatus = function () {
        var selectedStatusId = vm.get("selectedTask.TaskStatusId");
        var selectedStatus = _.find(vm.get("taskStatusesSource").data(), function (status) {
            return status.Id === selectedStatusId;
        });
        vm.set("selectedTaskStatus", selectedStatus);
    };

//region routeTask Objects
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
        main.route.matched.add(function (section, query) {
            if (section !== "routeTask") {
                return;
            }
            vm.getTaskAndServiceInfo(query);
        });
    };
    routeTask.show = function () {
        main.parseHash();

        if (!initialized) {
            // Routes has not been opened yet, so jump there
            if (!vm.get("selectedTask")) {
                hasher.setHash("view/routes.html");
                return;
            }
            initialized = true;
        }
        //clear statusUpdated
        vm.statusUpdated = false;

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
    routeTask.undo = function (state) {
        //fixes a problem when the state is stored bc it is converted to json and back
        dbServices.convertServiceDates(state);
        vm.set("selectedService", state);
        routeTask.save();
    };
    routeTask.save = function () {
        dbServices.updateService(vm.get("selectedService"));
        vm.statusUpdated = false;
    };
//endregion

//region VM Objects
    vm.getTaskAndServiceInfo = function (query) {
        var task;
        var source = routeDestinationDetails.vm.get("routeTasksSource");
        if (source) {
            for (task in source._data) {
                if (query.routeTaskId === source._data[task].Id) {
                    vm.set("selectedTask", source._data[task]);
                }
            }
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
        }
    };
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
        if (popupCaller === "backButton" && !e) {
            var params = {routeId: routeDetails.vm.get("selectedRoute.Id"), routeDestinationId: routeDestinationDetails.vm.get("selectedDestination.Id")};
            main.setHash("routeDestinationDetails", params);
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
//endregion
});