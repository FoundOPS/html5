// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["db/services", "sections/linkedEntitySection", "db/session", "tools/generalTools", "widgets/searchSelect"], function (dbServices, createBase, session, generalTools) {
    var section = createBase("routeDetails", "routeId");
    window.routes = section;

    var vm = section.vm;

//public methods

    section.initialize = function () {
        $("#1, #3").searchSelect({
            data: [{name: "Jon"}, {name: "Oren"}, {name: "Andrew"}, {name: "Zach"}, {name: "Patrick"}, {name: "Jordan"}, {name: "Dennis"}, {name: "Rod"}],
            format: function (data) {
                return data.name;
            },
            onSelect: function (selectedData) {
                console.log(selectedData);
            },
            minimumInputLength: 2,
            showPreviousSelection: true
        });
        $("#2, #4").searchSelect({
            query: function (searchTerm, callback) {
                dbServices.locations.read({params: {search: searchTerm}}).done(function (locations) {
                    callback(locations);
                });
            },
            format: function (location) {
                var dataString = generalTools.getLocationDisplayString(location);
                if (dataString) {
                    return '<span class="selectSearchOptionIcon" style="height: 18px;width: 22px;float: left;background: url(\'img/webIcon.png\') no-repeat left center;"></span>' + dataString;
                    //if none do, display the latitude and longitude
                } else {
                    return location.Latitude + "," + location.Longitude;
                }
            },
            onSelect: function (e, selectedData) {
                console.log(selectedData);
            },
            minimumInputLength: 2,
            showPreviousSelection: true
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