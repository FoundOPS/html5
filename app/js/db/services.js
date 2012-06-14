//region Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

'use strict';

define(['lib/kendo.all.min', 'developer', 'tools'], function (k, developer, tools) {
    var services = {};

    /**
     * Enum for loading statuses.
     * @enum {number}
     */
    services.Status = {
        LOADING: 0,
        LOADED: 1
    };

    var apiUrl;
//setup the api url depending on the mode
    var mode = developer.CURRENT_DATA_SOURCE;
    if (mode === developer.DataSource.LOCALAPI) {
        apiUrl = 'http://localhost:9711/api/';
    } else if (mode === developer.DataSource.ANDROIDLA) {
        apiUrl = 'http://10.0.2.2:9711/api/';
    } else if (mode === developer.DataSource.LIVE) {
        apiUrl = 'http://api.foundops.com/api/';
    } else if (mode === developer.DataSource.TESTAPI) {
        apiUrl = 'http://testapi.foundops.com/api/';
    }

    /**
     * The url for the API.
     * @type {string}
     * @const
     */
    services.API_URL = apiUrl;

    /**
     * Set the current RoleId.
     * @param {string} The roleId.
     */
    services.setRoleId = function (roleId) {
        services.RoleId = roleId;
    };

    /**
     * Returns a standard http get.
     * @param {String} queryString The query string to use. Ex. "routes/GetDepots"
     * @param {Object.<string|Object>=}  opt_params The parameters to use (optional).
     * @param {boolean=} opt_excludeRoleId Do not include the roleId in the params (optional).
     * @param {?function(Object):Object} The converter function for a loaded item (optional).
     * @return {function(!function(Object))} A function to perform the get and invoke the callback.
     * @private
     */
    services._getHttp = function (queryString, opt_params, opt_excludeRoleId, opt_convertItem) {
        /**
         * A function to perform the get operation on the api (defined by the parameters above)
         * and invoke the callback with the loaded data.
         * @param {!function(Object)} callback A callback to pass the loaded data to.
         */
        var getThenInvokeCallback = function (callback) {
            var params = opt_params || {};

            //if opt_excludeRoleId was not set or true and the RoleId exists add it as a parameter
            if (!opt_excludeRoleId && services.RoleId) {
                params.roleId = services.RoleId.toString();
            }

            var url = services.API_URL + queryString;

            $.ajax({
                //must use JSONP because the javascript may be hosted on a different url than the api
                type: "GET",
                dataType: 'JSONP',
                url: url,
                data: params
            })
                .success(function (response) {
                    var convertedData = response;

                    //if there is a converter, convert the data
                    if (opt_convertItem) {
                        convertedData = tools.convertArray(response, opt_convertItem);
                    }

                    //perform the callback function by passing the response data
                    callback(convertedData);
                });
        };

        return getThenInvokeCallback;
    };

    /**
     * Get the current service provider's Routes.
     * TODO wrap this in a function with optional parameters to either get the service provider's routes, or to get the current user's routes or create another function and rename this
     * @param {!function(Array.<Object>)} callback A callback to pass the loaded routes to.
     */
    services.getRoutes = services._getHttp('routes/GetRoutes', {}, false);

    /**
     * A kendo data source for Routes for the current user's routes.
     * @type {kendo.data.DataSource}
     */
    services.routesDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: apiUrl + "routes/GetRoutes",
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8"
            }
        }
    });

    //Questionable?
//    /**
//     * A kendo data source for RouteDestinations of the selected route.
//     * @type {kendo.data.DataSource}
//     */
//    services.routeDestinationsDataSource = services.routesDataSource({
//        selectedRoute: null,
//        hasChanges: false,
//        save: function () {
//            this.routesSource.sync();
//            this.set("hasChanges", false);
//        },
//        showForm: function () {
//            return this.get("selectedRoute") !== null;
//        },
//        change: function () {
//            this.set("hasChanges", true);
//        }
//    });

    /**
     * Get the service provider's depots.
     * @param {!function(Array.<Object>)} callback A callback to pass the loaded depots.
     */
    services.getDepots = services._getHttp('routes/GetDepots', {}, false);

    /**
     * Get resources (Employees/Vehicles) and their last recorded location.
     * @param {!function(Array.<Object>)} callback The callback to pass the resources with latest points after they are loaded.
     */
    services.getResourcesWithLatestPoints = services._getHttp('trackpoint/GetResourcesWithLatestPoints', {}, false);

    /**
     * Get the service provider's TrackPoints.
     * @param {goog.date.UtcDateTime} serviceDate The service date to retrieve TrackPoints for.
     * @param {string} routeId The Id of the route to retrieve TrackPoints for.
     * @param {!function(Array.<Object>)} callback The callback to pass the TrackPoints to after they are loaded.
     */
    services.getTrackPoints = function (serviceDate, routeId, callback) {
        return services._getHttp('trackPoint/GetTrackPoints',
            {routeId: routeId, serviceDate: serviceDate}, false)(callback);
    };

    /**
     * Authenticate the user.
     * @param {!string} email
     * @param {!string} password
     * @param {!function(boolean)} callback The callback to pass true (success) or false (failed) to after attempting to authenticate the credentials.
     */
    services.authenticate = function (email, password, callback) {
        return services._getHttp('auth/Login', {email: email, pass: password}, true, null)(callback);
    };

    //TODO Move to appropriate location
    var viewModel = kendo.observable({
        routesSource: services.routeDestinationsDataSource
    });
    kendo.bind($("#route-listview"), viewModel);

    return services;
});