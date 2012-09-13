// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["db/services", "entityJumperBase"], function (dbServices, createBase) {
    var routes = createBase(null, null, "routeDetails", "routeId");
    window.routes = routes;

    var vm = routes.vm;

//region public
    routes.initialize = function () {
        kendo.bind($("#routes"), vm, kendo.mobile.ui);
    };

    routes.onBack = function () {
        var r = confirm("Are you sure you would like to log out?");
        if (r) {
            hasher.setHash("view/logout.html");
        }
    };
//endregion

//region vm

    /**
     * A kendo data source for the current user's routes.
     * @type {kendo.data.DataSource}
     */
    vm.set("dataSource", new kendo.data.DataSource({
        transport: {
            read: {
                url: dbServices.API_URL + "routes/GetRoutes",
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8"
            }
        },
        change: function () {
            routes._moveForward();
        }
    }));

    vm.refresh = function () {
        vm.dataSource.read();
    };
//endregion

    return routes;
});