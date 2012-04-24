var module = angular.module('foundOPS.services', []).
  value('version', '0.1');

module.factory('resourcesStore', function ($http) {
    var readUrl = APIURL + "api/trackpoint/GetResourcesWithLatestPoints";
    readUrl = readUrl + '?callback=JSON_CALLBACK';

    function read() {
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

//module.factory('employeesDataSource', function () {
//    var employeesData =
//     [{
//         Name: "Dan",
//         Speed: 45,
//         Heading: 0,
//         Source: "iPhone",
//         Latitude: 51.54,
//         Longitude: -.045
//     },
//        {
//            Name: "Tom",
//            Speed: 10,
//            Heading: 45,
//            Source: "Android",
//            Latitude: 51.53,
//            Longitude: -0.05
//        },
//        {
//            Name: "Bob",
//            Speed: 20,
//            Heading: 90,
//            Source: "iPhone",
//            Latitude: 51.545,
//            Longitude: -0.06
//        },
//        {
//            Name: "Frank",
//            Speed: 30,
//            Heading: 135,
//            Source: "Android",
//            Latitude: 51.54,
//            Longitude: -0.07
//        }];

//    return { data: employeesData };
//});