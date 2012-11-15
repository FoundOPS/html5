// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["db/services", "sections/linkedEntitySection", "db/session", "tools/generalTools", "widgets/location", "widgets/selector"], function (dbServices, createBase, session, generalTools, location) {
    var section = createBase("routeDetails", "routeId");
    window.routes = section;

    var vm = section.vm;

//public methods

    section.initialize = function () {
        $(".selectorWidget").searchSelect({
//            query: function (options) {
//                return dbServices.locations.read({params: {search: options.searchTerm}}).done(function (locations) {
//                    options.render(locations);
//                });
//            },
//            format: function (location) {
//                var returnString = generalTools.locationDisplayString(location);
//                if (returnString) {
//                    return returnString;
//                    //if none do, display the latitude and longitude
//                } else {
//                    return location.Latitude + "," + location.Longitude;
//                }
//            },
            data: [{name: "Jon"}, {name: "Oren"}, {name: "Andrew"}, {name: "Zach"}, {name: "Patrick"}, {name: "Jordan"}, {name: "Dennis"}, {name: "Rod"}],
            format: function (data) {
                return data.name;
            },
            onSelect: function (selectedData) {
                console.log(selectedData);
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