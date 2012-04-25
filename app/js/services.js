var module = angular.module('foundOPS.services', []).
  value('version', '0.1');

module.factory('resourcesStore', function ($http) {
    var readUrl = APIURL + "api/trackpoint/GetResourcesWithLatestPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read(date) {
    	/// <summary>
        /// Performs an HTTP GET to get the resources for the given date.
    	/// </summary>
    	/// <returns>The resources.</returns>
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: 'CD877F56-C4FA-4CF2-8534-393E101C56A5', serviceDate: date }
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});

module.factory('routesStore', function ($http) {
    var readUrl = APIURL + "api/routes/GetRoutes";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read(date) {
        /// <summary>
        /// Performs an HTTP GET to get the trackpoints for the given date.
        /// </summary>
        /// <returns>The trackpoints.</returns>
        return $http({
            method: 'JSONP',
            url: readUrl
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});

module.factory('trackPointsStore', function ($http) {
    var readUrl = APIURL + "api/trackpoint/GetTrackPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read(date) {
        /// <summary>
        /// Performs an HTTP GET to get the trackpoints for the given date.
        /// </summary>
        /// <returns>The trackpoints.</returns>
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: 'CD877F56-C4FA-4CF2-8534-393E101C56A5', serviceDate: date }
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});