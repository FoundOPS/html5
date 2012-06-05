//region Using
// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

'use strict';

goog.provide('ops.services');

goog.require('ops');
goog.require('ops.developer');
goog.require('ops.models.Route');
goog.require('ops.models.RouteDestination');
goog.require('ops.models.TrackPoint');
goog.require('ops.models.ResourceWithLastPoint');
goog.require('ops.tools');

//endregion

/**
 * Enum for loading statuses.
 * @enum {number}
 */
ops.services.Status = {
    LOADING:0,
    LOADED:1
};

//setup the api url depending on the mode
var mode = ops.developer.CURRENT_MODE;
if (mode === ops.developer.Mode.LOCAL) {
    var apiUrl = 'routes.json';
} else if (mode === ops.developer.Mode.LOCALAPI) {
    var apiUrl = 'http://localhost:9711/api/';
} else if (mode === ops.developer.Mode.ANDROIDLA) {
    var apiUrl = 'http://10.0.2.2:9711/api/';
}

/**
 * The url for the API.
 * @type {string}
 * @const
 */
ops.services.API_URL = apiUrl;

/**
 * Set the current RoleId.
 * @param {ops.Guid} The roleId.
 */
ops.services.setRoleId = function (roleId) {
    ops.services.RoleId = roleId;
};

//Set the roleId to GotGrease's role (for debugging)
if (ops.developer.Mode !== ops.developer.Mode.LIVE) {
    ops.services.setRoleId(ops.developer.GOTGREASE_ROLE_ID);
}

/**
 * Returns a standard http get.
 * @param {String} queryString The query string to use. Ex. "routes/GetDepots"
 * @param {Object.<string|Object>=}  opt_params The parameters to use (optional).
 * @param {boolean=} opt_excludeRoleId Do not include the roleId in the params (optional).
 * @param {?function(Object):Object} The converter function for a loaded item (optional).
 * @return {function(!function(Object))} A function to perform the get and invoke the callback.
 * @private
 */
ops.services._getHttp = function (queryString, opt_params, opt_excludeRoleId, opt_convertItem) {
    /**
     * A function to perform the get operation on the api (defined by the parameters above)
     * and invoke the callback with the loaded data.
     * @param {!function(Object)} callback A callback to pass the loaded data to.
     */
    var getThenInvokeCallback = function (callback) {
        var params = opt_params || {};

        //if opt_excludeRoleId was not set or true and the RoleId exists add it as a parameter
        if (!opt_excludeRoleId && ops.services.RoleId) {
            params.roleId = ops.services.RoleId.toString();
        }

        var url = ops.services.API_URL + queryString;

        $.ajax({
            //must use JSONP because the javascript may be hosted on a different url than the api
            type:"GET",
            dataType:'JSONP',
            url:url,
            data:params
        }).success(function (response) {
                var convertedData = response;

                //if there is a converter, convert the data
                if (opt_convertItem) {
                    convertedData = ops.tools.convertArray(response, opt_convertItem);
                }

                //perform the callback function by passing the response data
                callback(convertedData);
            });
    };

    return getThenInvokeCallback;
};

//setup the resource services. Use the injector to get the $http service.
//TODO change all the callback function definitions to have Array.<closure classes> instead of Array.<Object>

/**
 * Get the current service provider's Routes.
 * TODO wrap this in a function with optional parameters to either get the service provider's routes, or to get the current user's routes or create another function and rename this
 * @param {!function(Array.<ops.models.Route>)} callback A callback to pass the loaded routes to.
 */
ops.services.getRoutes = ops.services._getHttp('routes/GetRoutes',
    {}, false, ops.models.Route.createFromApiModel);

/**
 * A kendo data source for Routes for the current user's routes.
 * @type {kendo.data.DataSource}
 */
ops.services.routesDataSource = new kendo.data.DataSource({
    transport:{
        read:{
            url:apiUrl + "routes/GetRoutes",
            type:"GET",
            dataType:"jsonp",
            contentType:"application/json; charset=utf-8"
        }
    }
});

/**
 * Get the service provider's depots.
 * @param {!function(Array.<ops.models.Location>)} callback A callback to pass the loaded depots.
 */
ops.services.getDepots = ops.services._getHttp('routes/GetDepots',
    {}, false, ops.models.Location.createFromApiModel);

/**
 * Get resources (Employees/Vehicles) and their last recorded location.
 * @param {!function(Array.<ops.models.ResourceWithLastPoint>)} callback The callback to pass the resources with latest points after they are loaded.
 */
ops.services.getResourcesWithLatestPoints = ops.services._getHttp('trackpoint/GetResourcesWithLatestPoints',
    {}, false, ops.models.ResourceWithLastPoint.createFromApiModel);

/**
 * Get the service provider's TrackPoints.
 * @param {goog.date.UtcDateTime} serviceDate The service date to retrieve TrackPoints for.
 * @param {ops.Guid} routeId The Id of the route to retrieve TrackPoints for.
 * @param {!function(Array.<Object>)} callback The callback to pass the TrackPoints to after they are loaded.
 */
ops.services.getTrackPoints = function (serviceDate, routeId, callback) {
    return ops.services._getHttp('trackPoint/GetTrackPoints',
        {routeId:routeId, serviceDate:serviceDate}, false, ops.models.TrackPoint.createFromApiModel)(callback);
};

/**
 * Authenticate the user.
 * @param {!string} email
 * @param {!string} password
 * @param {!function(boolean)} callback The callback to pass true (success) or false (failed) to after attempting to authenticate the credentials.
 */
ops.services.authenticate = function (email, password, callback) {
    return ops.services._getHttp('auth/Login', {email:email, pass:password}, true, null)(callback);
};