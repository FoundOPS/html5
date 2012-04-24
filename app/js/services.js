var module = angular.module('foundOPS.services', []).
  value('version', '0.1');

module.factory('resourcesStore', function ($http) {
    var readUrl = APIURL + "api/trackpoint/GetResourcesWithLatestPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read() {
    	/// <summary>
        /// Performs an HTTP GET to get the resources for the given date.
    	/// </summary>
    	/// <returns>The resources.</returns>
        return $http({
            method: 'JSONP',
            url: readUrl,
            params: { roleId: '48DBE99F-098E-404D-9550-628B6EAAB95A', serviceDate: '4-23-2012' }
        }).then(function (response) {
            return response.data;
        });
    }

    return {
        read: read
    };
});