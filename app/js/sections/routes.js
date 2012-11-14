// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["db/services", "sections/linkedEntitySection", "db/session", "widgets/location", "ui/popup", "widgets/searchSelect"], function (dbServices, createBase, session) {
    var section = createBase("routeDetails", "routeId");
    window.routes = section;

    var vm = section.vm;

//public methods

    section.initialize = function () {
        $(".testLocationWidget").popup({contents: $("<div class='locationWidget'></div>")});
        $(".testLocationWidget").on("click", function (e) {
            var popupElement = $("#popupContent");
            popupElement.find(".locationWidget").location();
            var locationWidget = popupElement.find(".locationWidget").data("location");
            locationWidget.renderMap(null, false);
        });
        $(document).on('popup.closing', function (e) {
            //remove the location widget, if it exists
            if ($(e.target).find(".locationWidget").data("location")) {
                $(e.target).find(".locationWidget").data("location").removeWidget();
                //remove the repeat widget, if it exists
            } else if ($(e.target).find(".repeatWidget").data("repeat")) {
                $(e.target).find(".repeatWidget").data("repeat").removeWidget();
                //remove the contactInfo widget, if it exists
            } else if ($(e.target).find(".contactInfoWidget").data("contactInfo")) {
                $(e.target).find(".contactInfoWidget").data("contactInfo").removeWidget();
            }
        });
        $(".searchSelectWidget").searchSelect({
            data: [{name: "Jon"}, {name: "Oren"}, {name: "Andrew"}, {name: "Zach"}, {name: "Patrick"}, {name: "Jordan"}, {name: "Denis"}, {name: "Rod"}],
            dataTextField: "name",
            onSelect: function (selectedItem) {
                console.log(selectedItem);
            }
        });

        kendo.bind($("#routes"), vm, kendo.mobile.ui);
    };

    section.onBack = function () {
        var r = confirm("Are you sure you would like to log out?");
        if (r) {
            window.location.hash = "view/logout.html";
        }
    };

//vm additions

    /**
     * A kendo data source for the current user's routes.
     * @type {kendo.data.DataSource}
     */
    vm.set("dataSource", new kendo.data.DataSource({
        transport: {
            read: {
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8"
            }
        },
        change: function () {
            section._moveForward();
        }
    }));

    session.followRole(function (role) {
        vm.dataSource.transport.options.read.url = dbServices.API_URL + "routes/GetRoutes?deep=true&assigned=true&roleId=" + role.id;
        vm.refresh();
    });

    vm.refresh = function () {
        dbServices.taskStatuses.read().done(function (response) {
            var taskStatuses = new kendo.data.DataSource({data: response});
            //set it up for use
            taskStatuses.read();
            vm.set("taskStatusesSource", taskStatuses);
        });

        vm.get("dataSource").read();
    };

    return section;
});