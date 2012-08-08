// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold route list logic.
 */

"use strict";

define(["jquery", "db/services", "lib/kendo.all"], function ($, dbServices) {
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
                console.log("Route list change: ");
                console.log(e.items);
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
            vm.set("routeDestinationsSource",
                new kendo.data.DataSource({
                    data: vm.get("selectedRoute.RouteDestinations")
                }));
            //Commented out until new getTaskStatuses is worked out.
//            dbServices.getTaskStatuses(vm.get("selectedRoute").BusinessAccountId, function (response) {
//                mobile.viewModel.set("taskStatusesSource",
//                    new kendo.data.DataSource({
//                        data: response
//                    }));
//            });
            navigateToRouteDestinations();
        };
        kendo.bind($("#routes"), vm, kendo.mobile.ui);
    };

    routes.show = function () {
        // Auto refresh - causes two calls on initializing.
        //vm.refreshRoutes();
    };
});