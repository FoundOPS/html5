var module = angular.module('foundOPS.services', []).
  value('version', '0.1');

module.factory('depotStore', function ($http) {
    /// <summary>
    /// Performs an HTTP GET to get the depot.
    /// </summary>
	/// <param name="$http"></param>
    /// <returns>The depot.</returns>
    var readUrl = APIURL + "api/trackpoint/GetDepot";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read() {
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: '8528E50D-E2B9-4779-9B29-759DBEA53B61'}
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});

module.factory('resourcesStore', function ($http) {
	/// <summary>
    /// Performs an HTTP GET to get the resources for the given date.
	/// </summary>
	/// <param name="$http"></param>
    /// <returns>The resources.</returns>
    var readUrl = APIURL + "api/trackpoint/GetResourcesWithLatestPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read(date) {
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: '8528E50D-E2B9-4779-9B29-759DBEA53B61', serviceDate: date }
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});

module.factory('routesStore', function ($http) {
	/// <summary>
    /// Performs an HTTP GET to get the routes for the given date.
	/// </summary>
	/// <param name="$http"></param>
    /// <returns>The routes.</returns>
    var readUrl = APIURL + "api/routes";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read() {
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: '8528E50D-E2B9-4779-9B29-759DBEA53B61'}
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});

module.factory('trackPointsStore', function ($http) {
	/// <summary>
    /// Performs an HTTP GET to get the trackpoints for the given date.
	/// </summary>
	/// <param name="$http"></param>
    /// <returns>The trackpoints.</returns>
    var readUrl = APIURL + "api/trackpoint/GetTrackPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read(date, routeId) {
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: '8528E50D-E2B9-4779-9B29-759DBEA53B61', routeId: routeId, serviceDate: date }
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});