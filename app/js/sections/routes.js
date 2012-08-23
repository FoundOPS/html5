// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["jquery", "db/services", "db/saveHistory", "lib/kendo.all"], function ($, dbServices, saveHistory) {
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
            change: function (e) {
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

            localStorage.setItem("selectedRoute", vm.get("selectedRoute.Id"));
            $.publish('selectedRoute', [vm.get("selectedRoute")]);
            application.navigate("view/routeDetails.html");
        };
        kendo.bind($("#routes"), vm, kendo.mobile.ui);

        // If user refreshes app on browser -> automatically redirect based on user's previous choices.
        if (main.history[0] !== "#view/routes.html" && main.history.previousPage !== "#view/updates.html") {
            setTimeout(function () {
                if (localStorage.getItem("selectedRoute")) {
                    var route;
                    for (route in vm.get("routesSource")._data) {
                        if (localStorage.getItem("selectedRoute") === vm.get("routesSource")._data[route].Id) {
                            var e = {};
                            e.dataItem = vm.get("routesSource")._data[route];
                            vm.selectRoute(e);
                        }
                    }
                }
            }, 500);
        }
    };

    routes.show = function () {
        saveHistory.close();
        // Auto refresh - causes two calls on initializing.
        //vm.refreshRoutes();
    };
});