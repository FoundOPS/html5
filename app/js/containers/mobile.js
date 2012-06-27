// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold mobile models/logic.
 */

'use strict';

require.config({
    waitSeconds: 10,
    baseUrl: 'js',
    paths: {
        // JavaScript folders
        lib: "../lib",
        ui: "ui",
        db: "db",

        // Libraries
        cordova: "../lib/cordova",
        underscore: "../lib/underscore"
    },
    shim: {
        underscore: {
            exports: "_"
        }
    }
});

require(["jquery", "lib/kendo.mobile.min", "developer", "db/services", "db/models"], function ($, k, developer, services, models) {
    /**
     * mobile = wrapper all mobile objects
     * app = the kendoUI mobile app
     * serviceDate = the date for the routes that are acquired form the server
     * intervalId = used to start and stop a route
     * trackPointsToSend = stores the track points that will be sent to the API
     * e = the email used to login
     * p = the password used to login
     */
    var mobile = {}, app, serviceDate, intervalId = null, trackPointsToSend = [], e, p;

    //set mobile to a global function, so the functions are accessible from the HTML element
    window.mobile = mobile;

    /**
     * The configuration object for the mobile application.
     * @const
     * @type {Array.<Object>}
     */
    mobile.CONFIG = {
        /**
         * The frequency to collect trackPoints in seconds.
         * @const
         * @type {number}
         */
        TRACKPOINT_COLLECTION_FREQUENCY_SECONDS: 1,

        /**
         * The accuracy threshold that determines whether to record a trackPoint (in meters).
         * @const
         * @type {number}
         */
        ACCURACY_THRESHOLD: 50
    };

    //Overrides phone's back button navigation - Phonegap
    function onBack() {
        if (window.location.hash === "#views/routeList.html") {
            mobile.logout();
        } else if (window.location.hash === "") {
            app.navigate("#:back");
        } else if (window.location.hash === "#views/routeDetails.html") {
            app.navigate("views/routeList.html");
        } else if (window.location.hash === "#views/routeDestinationDetails.html") {
            app.navigate("views/routeDetails.html");
        }
    }

    //Fires when cordova is ready
    function onDeviceReady() {
        //set the OS of the device running the app
        mobile.CONFIG.DEVICE_PLATFORM = device.platform;

        //Used to disallow user from navigating back to login screen if already logged in.
        document.addEventListener("backbutton", onBack, false);
    }

    //Listens for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);

    //region Login/Logout - Eventually will be moved to new navigator
    mobile.login = function () {
        if (localStorage.getItem("loggedIn") === "true") {
            e = localStorage.getItem("email");
            p = localStorage.getItem("pass");
        } else {
            e = $("#email").val();
            p = $("#pass").val();
        }
        services.authenticate(e, p, function (data) {
            //if this was authenticated refresh routes and navigate to routeslist
            if (data) {
                //Save the application's login state.
                localStorage.setItem("loggedIn", true);
                localStorage.setItem("email", e);
                localStorage.setItem("pass", p);
                app.navigate("views/routeList.html");
            } else {
                navigator.notification.alert("Login information is incorrect.");
            }
        });
    };

    mobile.logout = function () {
        navigator.notification.confirm("Are you sure you want to logout?", function (buttonIndex) {
            if (buttonIndex === 1) {
                services.logout(function (data) {
                    if (data) {
                        //Clear application's login state.
                        localStorage.setItem("loggedIn", false);
                        mobile.viewModel.routesSource.data();
                        app.navigate("views/clearhist.html");
                    } else {
                        navigator.notification.alert("Logout cannot be completed at this time.");
                    }
                });
            }
        }, "Logout", "Yes,No");
    };

    mobile.checkLogin = function () {
        if (localStorage.getItem("loggedIn") === "true") {
            mobile.login();
        }
    };
    //endregion

    /**
     * Gets the latest trackpoint when called.
     * Then it attempts to push the trackpoint/non-sent trackpoints to the server
     * If successful, it flushes trackPointsToSend
     * @param routeId The routeId of the current trackpoint
     */
    var addPushTrackPoints = function (routeId) {
        var onSuccess = function (position) {
            var collectedTime = new Date(position.timestamp);

            var newTrackPoint = new models.TrackPoint(
                position.coords.accuracy,
                collectedTime,
                position.coords.heading,
                position.coords.latitude,
                position.coords.longitude,
                routeId,
                mobile.CONFIG.DEVICE_PLATFORM,
                position.coords.speed
            );
            trackPointsToSend.push(newTrackPoint);

            services.postTrackPoints(trackPointsToSend, function (e) {
                if (e) {
                    //flush trackpoints if successful
                    trackPointsToSend = [];
                }
            });

        };

        var onError = function (error) {
            navigator.notification.alert("Can not collect track points at this time. Please check your GPS settings.", mobile.viewModel.endRoute(), "Alert", "Confirm");
            //console.log("Error Code: " + error.code + '\n' + error.message);
        };

        //Phonegap geolocation function
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    };

    //region viewModel - Contains all the information and resources relating to the route view templates.
    mobile.viewModel = kendo.observable({
        routesSource: services.routesDataSource,
        /**
         * Select a route
         * @param e The event args from a list view click event
         */
        selectRoute: function (e) {
            this.set("selectedRoute", e.dataItem);
            this.set("routeDestinationsSource",
                new kendo.data.DataSource({
                    data: this.get("selectedRoute").RouteDestinations
                }));
            app.navigate("views/routeDetails.html");
        },
        /**
         * Select a route destination
         * @param e The event args from a list view click event
         */
        selectRouteDestination: function (e) {
            this.set("selectedDestination", e.dataItem);
            this.set("locationPhoneContactInfoSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination").Location.ContactInfoSet,
                    filter: {field: "Type", operator: "equal", value: "Phone Number"}
                }));
            this.set("locationEmailContactInfoSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination").Location.ContactInfoSet,
                    filter: {field: "Type", operator: "equal", value: "Email Address"}
                }));
            this.set("locationWebsiteContactInfoSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination").Location.ContactInfoSet,
                    filter: {field: "Type", operator: "equal", value: "Website"}
                }));
            this.set("clientPhoneContactInfoSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination").Client.ContactInfoSet,
                    filter: {field: "Type", operator: "equal", value: "Phone Number"}
                }));
            this.set("clientEmailContactInfoSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination").Client.ContactInfoSet,
                    filter: {field: "Type", operator: "equal", value: "Email Address"}
                }));
            this.set("clientWebsiteContactInfoSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination").Client.ContactInfoSet,
                    filter: {field: "Type", operator: "equal", value: "Website"}
                }));
            app.navigate("views/routeDestinationDetails.html");
        },
        //Dictate the visibility of the startRoute and endRoute buttons.
        startVisible: true,
        endVisible: false,
        /**
         * Starts collecting and sending trackpoints for the selected route.
         */
        startRoute: function () {
            //the viewmodel
            var that = this;

            that.set("startVisible", false);
            that.set("endVisible", true);
            serviceDate = new Date();

            //store the intervalId
            intervalId = window.setInterval(function () {
                addPushTrackPoints(that.get("selectedRoute").Id);
            }, mobile.CONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS * 1000);
        },
        /**
         * Ends the collection of trackpoints for the selected route.
         */
        endRoute: function () {
            this.set("startVisible", true);
            this.set("endVisible", false);

            //stop calling addPushTrackPoints
            clearInterval(intervalId);
            trackPointsToSend = [];
        }
    });
    //endregion

    //Start the mobile application - must be at the bottom of the code.
    app = new kendo.mobile.Application($(document.body));

});