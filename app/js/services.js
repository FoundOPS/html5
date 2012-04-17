var module = angular.module('foundOPS.services', []);

//module.factory('trackPointsStore', function ($http) {
//    var readUrl = ROOTAPI + 'api/trackpoints';

//    function read() {
//        return $http({
//            method: 'JSONP',
//            url: readUrl + '?callback=JSON_CALLBACK'
//        }).then(function (response) {
//            return response.data;
//        });
//    }

//    return {
//        read: read
//    };
//});

module.factory('employeesDataSource', function () {
    var employeesData =
     [{
         Name: "Dan",
         Speed: 45,
         Heading: 0,
         Source: "iPhone",
         Latitude: 51.54,
         Longitude: -.045
     },
        {
            Name: "Tom",
            Speed: 10,
            Heading: 45,
            Source: "Android",
            Latitude: 51.53,
            Longitude: -0.05
        },
        {
            Name: "Bob",
            Speed: 20,
            Heading: 90,
            Source: "iPhone",
            Latitude: 51.545,
            Longitude: -0.06
        },
        {
            Name: "Frank",
            Speed: 30,
            Heading: 135,
            Source: "Android",
            Latitude: 51.54,
            Longitude: -0.07
        }];

    return { data: employeesData };
});