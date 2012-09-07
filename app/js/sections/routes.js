// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["jquery", "db/services", "db/saveHistory", "hasher", "lib/kendo.all"], function ($, dbServices, saveHistory, hasher) {
    /**
     * routes = wrapper for all route list objects/logic
     * vm = viewModel
     */
    var routes = {}, vm = kendo.observable();
    window.routes = routes;

    routes.vm = vm;

    var onRefresh = function (params) {
        var pageRefreshedOn = (main.history[0].slice(main.history[0].indexOf("/") + 1, main.history[0].indexOf(".")));
        if (pageRefreshedOn !== "routes" && main.history.length === 2) {
            var source = vm.get("routesSource")._data;
            var route;
            for (route = 0; route < source.length; route++) {
                if (params.routeId === source[route].Id) {
                    var e = {};
                    e.dataItem = source[route];
                    vm.selectRoute(e);
                    break;
                }
            }
        }
    };

//region routes Objects
    routes.initialize = function () {
        kendo.bind($("#routes"), vm, kendo.mobile.ui);
    };
    routes.show = function () {
        main.parseHash();

        saveHistory.close();
    };
//endregion

//region VM Objects
    /**
     * A kendo data source for the current user's routes.
     * @type {kendo.data.DataSource}
     */
    vm.set("routesSource", new kendo.data.DataSource({
        transport: {
            read: {
                url: dbServices.API_URL + "routes/GetRoutes",
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8"
            }
        },
        change: function (e) {
            onRefresh(main.parseURLParams(main.history[0]));
        },
        serverPaging: true
    }));
    vm.refreshRoutes = function () {
        vm.routesSource.read();
    };
    /**
     * Select a route
     * @param e The event args from a list view click event (the selected Route)
     */
    vm.selectRoute = function (e) {
        vm.set("selectedRoute", e.dataItem);

        var params = {routeId: vm.get("selectedRoute.Id")};
        main.setHash("routeDetails", params);
    };
//endregion
});