// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["jquery", "db/services", "db/saveHistory", "hasher", "lib/kendo.all"], function ($, dbServices, saveHistory, hasher) {
    /**
     * routes = wrapper for all route list objects/logic
     * app = the kendoUI mobile app
     * serviceDate = the date for the routes that are acquired form the server
     * vm = viewModel
     */
    var routes = {}, vm = kendo.observable();
    window.routes = routes;

    routes.vm = vm;

    routes.initialize = function () {
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
            change: function (e) { },
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
        kendo.bind($("#routes"), vm, kendo.mobile.ui);

        main.route.matched.add(function (section, query) {
            console.log(query);
            if (section !== "route") {
                return;
            }
        });
    };

    routes.show = function () {
        main.parseHash();

        saveHistory.close();
    };
});