// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["db/services", "sections/linkedEntitySection"], function (dbServices, createBase) {
    var section = createBase("routeDetails", "routeId");
    window.routes = section;

    var vm = section.vm;

//public methods

    section.initialize = function () {
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
        vm.dataSource.transport.options.read.url = dbServices.API_URL + "routes/GetRoutes?deep=true&roleId=" + role.id;


    });

    vm.refresh = function () {
        vm.dataSource.read();
    };

    return section;
});