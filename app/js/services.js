// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

goog.provide('ops.services');

goog.require('ops');

/**
 * The configuration object for data services.
 * @const
 * @type {Array.<Object>}
 */
ops.services.CONFIG = {
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

/**
 * Update the current RoleId.
 * @param {ops.Guid} The roleId.
 */
ops.services.setRoleId = function (roleId) {
    ops.services.CONFIG.RoleId = roleId;
};

//The angular module to define the services in.
var module = angular.module('ops.services', []);

// use the injector to get the $resource and apiUrl
angular.injector(['ops.services']).invoke(function ($resource) {
    /**
     * The route resource object
     * @param {Object} The resource object.
     * @constructor
     */
    ops.services.prototype.Routes = $resource(apiUrl + '/routes/:roleId', [],
        {get:{method:'JSONP', params:{roleId:ops.services.CONFIG.RoleId}},
            replies:{method:'JSONP', params:{visibility:'@self', comments:'@comments'}}
        });
});


/** Performs an HTTP GET to get the depot. */
module.factory('depotsStore', function ($http, apiUrl) {
    var readUrl = apiUrl + "api/routes/GetDepots";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    /** Reads the data from the readUrl */
    function read() {
        return $http({
            method:'JSONP',
            url:readUrl,
            params:{ roleId:roleId }
        }).then(function (response) {
                return response.data;
            });
    }

    return {
        read:read
    };
});

/** Performs an HTTP GET to get the resources for the given date. */
module.factory('resourcesStore', function ($http, apiUrl) {
    var readUrl = apiUrl + "api/trackpoint/GetResourcesWithLatestPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    /** Reads the data from the readUrl
     * @param {string} date
     */
    function read(date) {
        return $http({
            method:'JSONP',
            url:readUrl,
            params:{ roleId:roleId, serviceDate:date }
        }).then(function (response) {
                return response.data;
            });
    }

    return {
        read:read
    };
});

/** Performs an HTTP GET to get the trackpoints for the given date */
module.factory('trackPointsStore', function ($http, apiUrl) {
    var readUrl = apiUrl + "api/trackpoint/GetTrackPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    /** Reads the data from the readUrl
     * @param {string} date
     * @param {string} routeId
     */
    function read(date, routeId) {
        return $http({
            method:'JSONP',
            url:readUrl,
            params:{ roleId:roleId, routeId:routeId, serviceDate:date }
        }).then(function (response) {
                return response.data;
            });
    }

    return {
        read:read
    };
});