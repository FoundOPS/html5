// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

goog.provide('ops.services');

goog.require('goog.date.UtcDateTime');
goog.require('ops');
goog.require('ops.developer');

/**
 * Enum for the service mode.
 * LOCAL: load data from JSON files in the application's directory. Works for both Android & Browser Debugging. TODO: Implement this mode.
 * LOCALAPI: load data from the local api server.
 * ANDROIDLA: debug in Android Emulator using the local api server.
 * LIVE: load from the main server. TODO: Implement this mode.
 * @type {String}
 * @enum {number}
 */
ops.services.Mode = {
    LOCAL:0,
    LOCALAPI:1,
    ANDROIDLA:2,
    LIVE:3
};

/**
 * The configuration object for data services.
 * It holds the current RoleId, Mode, and ApiUrl.
 * @const
 * @type {Array.<Object>}
 */
ops.services.CONFIG = {
    /*
     * The current RoleId for the user.
     * @type {ops.Guid}
     */
    RoleId:null,
    /*
     * The current service mode.
     * @type {ops.services.Mode}
     */
    Mode:ops.services.Mode.LOCALAPI
};

//setup the api url depending on the mode
var mode = ops.services.CONFIG.Mode;
if (mode == ops.services.Mode.LOCALAPI) {
    apiUrl = 'http://localhost:9711/api/';
} else if (mode == ops.services.Mode.ANDROIDLA) {
    apiUrl = 'http://10.0.2.2:9711/api/';
}

/*
 * The url for the API.
 */
ops.services.CONFIG.ApiUrl = apiUrl;

/**
 * Set the current RoleId.
 * @param {ops.Guid} The roleId.
 */
ops.services.setRoleId = function (roleId) {
    ops.services.CONFIG.RoleId = roleId;
};

//Set the roleId to GotGrease's role (for debugging)
if (ops.services.CONFIG.Mode != ops.services.Mode.LIVE)
    ops.services.setRoleId(ops.developer.GOTGREASE_ROLE_ID);

/**
 * Returns a standard http get.
 * @param {Object} $http The $http service.
 * @param {String} queryString The query string to use. Ex. "routes/GetDepots"
 * @param {Object.<string|Object>=}  opt_params The parameters to use (optional).
 * @param {boolean=} opt_excludeRoleId Do not include the roleId in the params (optional).
 * @return {function(!function(Object), Object=)} A function to perform the get and invoke the callback.
 * @private
 */
ops.services._getHttp = function ($http, queryString, opt_params, opt_excludeRoleId) {
    /**
     * A function to perform the get operation on the api (defined by the parameters above)
     * and invoke the callback with the loaded data.
     * @param {!function(Object)} callback A callback to pass the loaded data to.
     */
    var getThenInvokeCallback;
    getThenInvokeCallback = function (callback) {
        var params = opt_params || {};

        //if opt_excludeRoleId was not set or true and the RoleId exists add it as a parameter
        if (!opt_excludeRoleId && ops.services.CONFIG.RoleId)
            params.roleId = ops.services.CONFIG.RoleId.toString();

        var url = ops.services.CONFIG.ApiUrl + queryString + '?callback=JSON_CALLBACK';

        $http({
            //must use JSONP because the javascript may be hosted on a different url than the api
            method:'JSONP',
            url:url,
            params:params
        }).then(function (response) {
                //perform the callback function by passing the response data
                callback(response.data);
            });
    };

    return getThenInvokeCallback;
};

/*
 Setup the resource services. Use the injector to get the $http service.
 */
angular.injector(['ng']).invoke(function ($http) {
    //TODO change all the callback function definitions to have Array.<closure classes> instead of Array.<Object>

    /**
     * Get the current service provider's Routes.
     * TODO wrap this in a function with optional parameters to either get the service provider's routes, or to get the current user's routes or create another function and rename this
     * @param {!function(Array.<Object>)} callback A callback to pass the loaded routes to.
     */
    ops.services.getRoutes = ops.services._getHttp($http, 'routes/GetRoutes', {});

    /**
     * Get the current service provider's depots.
     * @param {!function(Array.<Object>)} callback A callback to pass the loaded depots.
     */
    ops.services.getDepots = ops.services._getHttp($http, 'routes/GetDepots', {});

    /**
     * Get the current service provider's TrackPoints.
     * @param {goog.date.UtcDateTime} serviceDate The service date to retrieve TrackPoints for.
     * @param {ops.Guid} routeId The Id of the route to retrieve TrackPoints for.
     * @param {!function(Array.<Object>)} callback The callback to pass the TrackPoints to after they are loaded.
     */
    ops.services.getTrackPoints = function (serviceDate, routeId, callback) {
        return ops.services._getHttp($http, 'trackpoint/GetTrackPoints', {routeId:routeId, serviceDate:serviceDate.toUTCIsoString()})(callback);
    };

    /**
     * Authenticate the user.
     * @param {!string} email
     * @param {!string} password
     * @param {!function(boolean)} callback The callback to pass true (success) or false (failed) to after attempting to authenticate the credentials.
     */
    ops.services.authenticate = function (email, password, callback) {
        return ops.services._getHttp($http, 'auth/Login', {email:email, pass:password}, true)(callback);
    };
});