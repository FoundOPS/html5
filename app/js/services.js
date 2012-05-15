// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

goog.provide('ops.services');

goog.require('goog.date.UtcDateTime');
goog.require('ops');

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
    ops.services.setRoleId(new ops.Guid('2A4A2A74-4EB4-4569-B8D5-791C44160984'));

/**
 * Returns a standard http get.
 * @param {Object} $http The $http service.
 * @param {String} queryString The query string to use. Ex. "routes/GetDepots"
 * @param {Object.<string|Object>}  params The parameters to use. This will automatically add roleId as a parameter if it is not undefined.
 * @return {function(Object)} The generated http function.
 * @private
 */
ops.services._getHttp = function ($http, queryString, params) {
    return function () {
        if (ops.services.CONFIG.RoleId)
            params.roleId = ops.services.CONFIG.RoleId.toString();

        var url = ops.services.CONFIG.ApiUrl + queryString + '?callback=JSON_CALLBACK';

        return $http({
            method:'JSONP',
            url:url,
            params:params
        });
    };
};

/*
 Setup the resource services. Use the injector to get the $http service.
 */
angular.injector(['ng']).invoke(function ($http) {
    /**
     * Get the Routes of the current RoleId's service provider.
     * @return {function(Object)} The generated http function.
     */
    ops.services.getRoutes = ops.services._getHttp($http, 'routes/GetRoutes', {});

    /**
     * Get the Depots of the current RoleId's service provider.
     * @return {function(Object)} The generated http function.
     */
    ops.services.getDepots = ops.services._getHttp($http, 'routes/GetDepots', {});

    /**
     * Get the TrackPoints of the current RoleId's service provider.
     * @param {goog.date.UtcDateTime} serviceDate The service date to retrieve TrackPoints for.
     * @param {ops.Guid} routeId The Id of the route to retrieve TrackPoints for.
     * @return {function(Object)} The generated http function.
     */
    ops.services.getTrackPoints = function (serviceDate, routeId) {
        return ops.services._getHttp($http, 'trackpoint/GetTrackPoints', {routeId:routeId, serviceDate:serviceDate.toUTCIsoString()});
    };
});