var module = angular.module('foundOPS.services', []).
    value('version', '0.1');
var roleId = "D1CABCCD-CCA2-476A-B472-99EE62AD9C96";

/** Performs an HTTP GET to get the depot */
module.factory('depotsStore', function ($http) {
    var readUrl = F.API_URL + "api/routes/GetDepots";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    /** Reads the data from the readUrl */
    function read() {
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: roleId }
        }).then(function (response) {
                return response.data;
            });
    }

    return {
        read: read
    };
});

/** Performs an HTTP GET to get the resources for the given date */
module.factory('resourcesStore', function ($http) {
    var readUrl = F.API_URL + "api/trackpoint/GetResourcesWithLatestPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    /** Reads the data from the readUrl
     * @param {string} date
     */
    function read(date) {
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: roleId, serviceDate: date }
        }).then(function (response) {
                return response.data;
            });
    }

    return {
        read: read
    };
});

/** Performs an HTTP GET to get the routes for the given date */
module.factory('routesStore', function ($http) {
    var readUrl = F.API_URL + "api/routes/GetRoutes";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    /** Reads the data from the readUrl */
    function read() {
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: roleId }
        }).then(function (response) {
                return response.data;
            });
    }

    return {
        read: read
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
            method: 'JSONP',
            url: readUrl,
            params: { roleId: roleId, routeId: routeId, serviceDate: date }
        }).then(function (response) {
                return response.data;
            });
    }

    return {
        read: read
    };
});