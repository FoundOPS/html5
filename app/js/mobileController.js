'use strict';
/* App Controllers */

var TRACK_POINT_ACQUISITION_DELAY = 1 * 1000; //First factor is amount of seconds (second factor is milliseconds).

var routeInProgress; //Indicates whether a route has been started or not.
var intervalId;
var trackPoints = []; //Array where track points are stored.
var routeStartTime, routeEndTime, routeTotalTime;
var watchId; //References the watch position interval.
var lastTrackPointTime; //The time that the last trackPoint was sent.

var trackPoint = function () {}; // A trackpoint object

angular.module("ops.mobile").controller('MobileController', function ($scope, $navigate, routesStore, $window, trackPointsStore) {
    //In order of usage

    $scope.data = {
        routes: [],
        inputEmail: '',
        inputPass: ''
    };

    $scope.back = function () {
        $navigate('back');
    };

    $scope.login = function () {
        $navigate("#routeslist");
        //TODO validate
        //$scope.inputEmail
        //$scope.inputPass
    };

    $scope.skipLogin = function () {
        $navigate('#routeslist');
    };

    $scope.refreshRoutes = function () {
        routesStore.read().then(function (data) {
            if (!data) {
                data = [];
            };
            $scope.routes = data;
        });
    };

    $scope.showRouteDetails = function (routeId) {
        var routeToSelect = Enumerable.From($scope.routes).First(function (route) {
            return route.Id === routeId;
        });

        $scope.selectedRoute = routeToSelect;
        $navigate("#routedetails");
    };

    $scope.showRouteDestinationDetails = function (routeDestinationId) {
        var routeDestinationToSelect = Enumerable.From($scope.selectedRoute.RouteDestinations).First(function (routeDestination) {
            return routeDestination.Id === routeDestinationId;
        });

        $scope.selectedRouteDestination = routeDestinationToSelect;

        var clientContactInfo = $scope.selectedRouteDestination.Client.ContactInfoSet;
        var locationContactInfo = $scope.selectedRouteDestination.Location.ContactInfoSet;

        var phoneNumbers = Enumerable.From(clientContactInfo).Union(Enumerable.From(locationContactInfo)).Where(function (contactInfo) {
            return contactInfo.Type === "Phone Number";
        }).ToArray();

        $scope.selectedPhoneNumbers = phoneNumbers;

        //Show the route destination dialog
        $navigate('#routedestinationdialog');
    };

    //Start the route and continuously get track points, show end button.
    $scope.startRoute = function (routeId) {
        routeInProgress = true;

        var date = new Date();
        routeStartTime = date.getSeconds();

        if (routeInProgress) {
            $('#startButton').hide();
            $('#endButton').show();

            intervalId = $window.setInterval(function () {
                getTrackPoints(routeId);
            }, TRACK_POINT_ACQUISITION_DELAY);
        };
    };

    //Ends track point accumulation, clears trackPoints array, removes end button, displays start button.
    $scope.endRoute = function (watchId) {
        routeInProgress = false;

        $window.clearInterval(intervalId);

        var date = new Date();
        routeEndTime = date.getSeconds();
        routeTotalTime = routeEndTime - routeStartTime;

        trackPoints = [];

        if (!routeInProgress) {
            $('#startButton').show();
            $('#endButton').hide();
        };
    };

    //Creates TrackPoints, stores them on the trackPoints array and sends them to the server.
    var getTrackPoints = function (routeId) {

        var onSuccess = function (position) {
            console.log("In onSuccess");
            console.log("Longitude: " + position.longitude + " Latitude: " + position.latitude);
            
            //TODO: Convert the position to a trackPoint and push a trackPoint.
            trackPoints.push(position);
            trackPointsStore.write(trackPoints, routeId);
        };

        var onError = function (error) {
            alert("Error Code: " + error.code + '\n' + error.message);
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
        });
    };
});