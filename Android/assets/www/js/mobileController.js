'use strict';

goog.require('goog.Timer');
goog.require('ops.services');
goog.require('ops.mobile');
goog.require('ops.models');

var intervalId;
var trackPoints = []; //Array where track points are stored.
var routeStartTime, routeEndTime, routeTotalTime;
var lastTrackPointTime; //The time that the last trackPoint was sent.

angular.module("ops.mobile").controller('MobileController', function ($scope, $navigate, $window) {
    $scope.back = function () {
        $navigate('back');
    };

    //if debugging skip to routeslist
    goog.Timer.callOnce(function () {
        $scope.refreshRoutes();
        $navigate("#routeslist");
    }, 100);

    $scope.refreshRoutes = function () {
        ops.services.getRoutes(function (routes) {
            $scope.routes = routes;
            //force apply (not yet sure why this is necessary)
            $scope.$apply();
        });
    };

    $scope.login = function () {
        ops.services.authenticate(this.email, this.pass, function (data) {
            //if this was authenticated refresh routes and navigate to routeslist
            if (data) {
                $scope.refreshRoutes();
                $navigate("#routeslist");
            } else {
                alert("wrong login info dawg");
            }
        });
    };

    $scope.showRouteDetails = function (routeId) {
        var routeToSelect = Enumerable.From($scope.routes).First(function (route) {
            return route.id === routeId;
        });

        $scope.selectedRoute = routeToSelect;
        $navigate("#routedetails");
    };

    $scope.showRouteDestinationDetails = function (routeDestinationId) {
        var routeDestinationToSelect = Enumerable.From($scope.selectedRoute.routeDestinations).First(function (routeDestination) {
            return routeDestination.id === routeDestinationId;
        });

        $scope.selectedRouteDestination = routeDestinationToSelect;

        var clientContactInfo = $scope.selectedRouteDestination.client.contactInfoSet;
        var locationContactInfo = $scope.selectedRouteDestination.location.contactInfoSet;

        var phoneNumbers = Enumerable.From(clientContactInfo).Union(Enumerable.From(locationContactInfo)).Where(
            function (contactInfo) {
                return contactInfo.type === "Phone Number";
            }
        ).ToArray();

        $scope.selectedPhoneNumbers = phoneNumbers;

        //Show the route destination dialog
        $navigate('#routedestinationdialog');
    };

    //Start the route and continuously get track points, show end button.
    $scope.startRoute = function (routeId) {
        $scope.routeInProgress = true;
        var serviceDate = new Date();

        //TODO change the selected route

        intervalId = $window.setInterval(function () {
            getTrackPoints(serviceDate, routeId);
        }, ops.mobile.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
    };

    //Ends track point accumulation, clears trackPoints array, removes end button, displays start button.
    $scope.endRoute = function () {
        $scope.routeInProgress = false;

        var date = new Date();
        routeEndTime = date.getSeconds();
        routeTotalTime = routeEndTime - routeStartTime;

        clearInterval(intervalId);

        trackPoints = [];
    };

    //Converts geolocation position into a TrackPoint, stores TrackPoint on the trackPoints array and sends it to the server.
    var getTrackPoints = function (serviceDate, routeId) {

        var onSuccess = function (position) {

            console.log("In onSuccess");
            console.log("Position: " + position.coords.latitude + " " + position.coords.longitude);

            var newTrackPoint = new ops.models.TrackPoint(
                new Date(position.timestamp),
                position.coords.accuracy,
                position.coords.heading,
                position.coords.latitude,
                position.coords.longitude,
                'Source',
                position.coords.speed
            );
            trackPoints.push(newTrackPoint);

            //TODO: Send trackPoints to server.
        };

        var onError = function (error) {
            alert("Error Code: " + error.code + '\n' + error.message);
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    };
});