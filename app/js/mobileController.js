'use strict';

goog.require('ops.services');
goog.require('ops.mobile');

var intervalId;
var trackPoints = []; //Array where track points are stored.
var routeStartTime, routeEndTime, routeTotalTime;
var lastTrackPointTime; //The time that the last trackPoint was sent.

angular.module("ops.mobile").controller('MobileController', function ($scope, $navigate) {
    //In order of usage

    $scope.back = function () {
        $navigate('back');
    };

    $scope.refreshRoutes = function () {
        ops.services.getRoutes(function (data) {
            $scope.routes = data;
        }, $scope);
    };

    $scope.login = function () {
        ops.services.authenticate(this.email, this.pass, function (data) {
            //data will be true if this was authenticated
            if (data) {
                $navigate("#routeslist");
                $scope.refreshRoutes();
            }
            else
                alert("wrong login info dawg");
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

        var phoneNumbers = Enumerable.From(clientContactInfo).Union(Enumerable.From(locationContactInfo)).Where(
            function (contactInfo) {
                return contactInfo.Type === "Phone Number";
            }).ToArray();

        $scope.selectedPhoneNumbers = phoneNumbers;

        //Show the route destination dialog
        $navigate('#routedestinationdialog');
    };

    //Start the route and continuously get track points, show end button.
    $scope.startRoute = function (routeId) {
        ops.mobile.RouteInProgress = true;

        //TODO change the selected route

//
//        intervalId = $window.setInterval(function () {
//            getTrackPoints(routeId);
//        }, ops.mobile.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
    };

//Ends track point accumulation, clears trackPoints array, removes end button, displays start button.
    $scope.endRoute = function (watchId) {
        ops.mobile.RouteInProgress = false;

//        $window.clearInterval(intervalId);

        var date = new Date();
        routeEndTime = date.getSeconds();
        routeTotalTime = routeEndTime - routeStartTime;

        trackPoints = [];
    };

//Creates TrackPoints, stores them on the trackPoints array and sends them to the server.
    var getTrackPoints = function (routeId) {

        var onSuccess = function (position) {
            console.log("In onSuccess");
            console.log("Longitude: " + position.longitude + " Latitude: " + position.latitude);

            //TODO: Convert the position to a trackPoint and push a trackPoint.
            trackPoints.push(position);
//            trackPointsStore.write(trackPoints, routeId);
        };

        var onError = function (error) {
            alert("Error Code: " + error.code + '\n' + error.message);
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy:true
        });
    };
});