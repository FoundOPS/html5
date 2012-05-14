// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

goog.provide('ops.services');

goog.require('ops');

/**
 * The configuration object for data services.
 * It hold the current RoleId, Mode, and ApiUrl.
 * @const
 * @type {Array.<Object>}
 */
ops.services.CONFIG = {
    /*
     * The current RoleId for the user.
     */
    RoleId:new ops.Guid('862C50D7-3884-41C2-AE39-80AB17923B1E'),
    /**
     * The current mode.
     * "LOCAL": load data from JSON files in the application's directory. Works for both Android & Browser Debugging.  TODO: Implement this mode.
     * "LOCALAPI": load data from the local api server.
     * "ANDROIDLA": debug in Android Emulator using the local api server.
     * "LIVE": load from the main server. TODO: Implement this mode.
     */
    Mode:'LOCALAPI'
};

//setup the api url depending on the mode
var mode = ops.services.CONFIG.Mode;
if (mode === "LOCALAPI") {
    //For the local api, use a different root url
    apiUrl = 'http://localhost:9711/';
} else if (mode === "ANDROIDLA") {
    apiUrl = 'http://10.0.2.2:9711/';
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

/*
 Setup the Routes resource service.
 use the injector to get the $resource and apiUrl
 */
angular.injector(['ngResource']).invoke(function ($resource, $http) {
    var roleId = ops.services.CONFIG.RoleId;

    /**
     * The Routes resource object. Used to get Routes...
     */
    ops.services.Routes = $resource(apiUrl + '/routes', [],
        {
            get:{method:'JSONP', params:{roleId:roleId}}
        });

    /**
     * The Depots resource object. Used to get Depots...
     */
    ops.services.Depots = $resource(apiUrl + '/routes/GetDepots', [],
        {
            get:{method:'JSONP', params:{roleId:roleId}}
        });

    /**
     * Get the TrackPoints of the current RoleId's service provider.
     * @param {ops.Guid} routeId The Id of the route to retrieve TrackPoints for.
     * @param {goog.Date.UtcDate} serviceDate The service date to retrieve TrackPoints for.
     */
    ops.services.getTrackPoints = function (serviceDate, routeId) {
        //retrieve using $http instead of the resource service for performance
        return $http({
            method:'JSONP',
            url:apiUrl + "api/trackpoint/GetTrackPoints?callback=JSON_CALLBACK",
            params:{ roleId:roleId, routeId:routeId, serviceDate:serviceDate.toUTCIsoString() }
        }).then(function (response) {
                return response.data;
            });
    };
});