var module = angular.module('foundOps.services', []).
    value('version', '0.1');

//region Constants

/**
 * The current mode.
 * "LOCAL": load data from JSON files in the application's directory. Works for both Android & Browser Debugging.  TODO: Implement this mode.
 * "LOCALAPI": load data from the local api server.
 * "ANDROIDLA": debug in Android Emulator using the local api server.
 * "LIVE": load from the main server. TODO: Implement this mode.
 */
module.factory('mode', function () {
    return "LOCALAPI";
});

/** The api root url. */
module.factory('apiUrl', function (mode) {
// setup the api url depending on the mode
    var apiUrl;
    if (mode === "LOCALAPI") {
        //For the local api, use a different root url
        apiUrl = 'http://localhost:9711/';
    } else if (mode === "ANDROIDLA") {
        apiUrl = 'http://10.0.2.2:9711/';
    }
//  TODO   else if (mode === "LOCAL") {
//  TODO  } else if (mode === "LIVE") {
//    }

    return apiUrl;
});

//#endregion

var roleId = "862C50D7-3884-41C2-AE39-80AB17923B1E";

/** Performs an HTTP GET to get the depot. */
module.factory('depotsStore', function ($http) {
    var readUrl = F.API_URL + "api/routes/GetDepots";
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
module.factory('resourcesStore', function ($http) {
    var readUrl = F.API_URL + "api/trackpoint/GetResourcesWithLatestPoints";
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

/** Performs an HTTP GET to get the routes for the given date. */
module.factory('routesStore', function ($http) {
    var readUrl = F.API_URL + "api/routes/GetRoutes";
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

/** Performs an HTTP GET to get the trackpoints for the given date */
module.factory('trackPointsStore', function ($http) {
    var readUrl = F.API_URL + "api/trackpoint/GetTrackPoints";
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