// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview The main class for the mobile application.
 */

'use strict';

require.config({
    baseUrl: "js",
    paths: {
        // JavaScript folders
        lib: "../lib",

        // Libraries
        cordova: "../lib/cordova",
        jquery: '../lib/jquery',
        underscore: "../lib/underscore"
    },
    shim: {
        cordova: {},
        underscore: {
            exports: "_"
        }
    }
});

require(["jquery", "db/developer", "tools", "db/services", "db/models", "widgets/contacts", "lib/moment", "lib/kendo.all", "underscore"], function ($, developer, tools, dbServices, models) {
    /**
     * mobile = wrapper for all mobile objects
     * app = the kendoUI mobile app
     * serviceDate = the date for the routes that are acquired form the server
     * intervalId = used to start and stop a route
     * trackPointsToSend = stores the track points that will be sent to the API
     * e = the email used to login
     * p = the password used to login
     */
    var mobile = {}, app, serviceDate, intervalId = null, trackPointsToSend = [];

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
    mobile.onBack = function () {
        if (window.location.hash === "#view/routeList.html") {
            mobile.logout();
        } else if (window.location.hash === "#view/routeDestinations.html") {
            app.navigate("view/routeList.html");
        } else if (window.location.hash === "#view/routeDestinationDetails.html") {
            app.navigate("view/routeDestinations.html");
        } else if (window.location.hash === "#view/taskDetails.html") {
            app.navigate("view/routeDestinationDetails.html");
        }
    };

    //Fires when cordova is ready
    function onDeviceReady() {
        //set the OS of the device running the app
        mobile.CONFIG.DEVICE_PLATFORM = device.platform;

        //Listens for back button being pressed on Android.
        document.addEventListener("backbutton", mobile.onBack, false);
    }

    //Listens for Cordova to load
    document.addEventListener("deviceready", onDeviceReady, false);

    //region Login/Logout - Eventually will be moved to new navigator
    var email;
    mobile.login = function () {
        email = $("#email").val();
        var password = $("#pass").val();

        if ($("#rememberMe").prop("checked") === true) {
            localStorage.setItem("rememberMe", true);
            localStorage.setItem("email", email);
        } else {
            localStorage.setItem("rememberMe", false);
            localStorage.removeItem("email");
        }

        dbServices.authenticate(email, password, function (data) {
            //if this was authenticated refresh routes and navigate to routeslist
            //TODO: Fix case where user fails authentication.
            if (data) {
                //Save the application's login state.
                localStorage.setItem("loggedIn", true);
                app.navigate("view/routeList.html");
            } else {
                if (developer.CURRENT_DATA_SOURCE === developer.DataSource.BROWSER_LOCALAPI) {
                    alert("Login information is incorrect.");
                } else {
                    navigator.notification.alert("Login information is incorrect.");
                }
            }
        });
    };

    mobile.logout = function () {
        navigator.notification.confirm("Are you sure you want to logout?", function (buttonIndex) {
            if (buttonIndex === 1) {
                //Clear application's login state
                localStorage.setItem("loggedIn", false);
                mobile.viewModel.routesSource.data();
                app.navigate("view/clearhist.html");

                dbServices.logout();
            }
        }, "Logout", "Yes,No");
    };

    mobile.checkLogin = function () {
        //Wait until the application is initialized
        setTimeout(function () {
            if (localStorage.getItem("loggedIn") === "true") {
                app.navigate("view/routeList.html");
            } else if (localStorage.getItem("rememberMe") === "true") {
                $("#email").val(localStorage.getItem("email"));
                $("#rememberMe").prop("checked", true);
            }
        }, 0);
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
            //Add a trackpoint for now in UTC
            var collectedTime = moment.utc().toDate();

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

            dbServices.postTrackPoints(trackPointsToSend, function (data) {
                if (data) {
                    //flush trackpoints if successful
                    trackPointsToSend = [];
                }
            });

        };

        var onError = function (error) {
            navigator.notification.alert("Can not collect track points at this time. Please check your GPS settings.", mobile.viewModel.endRoute(), "Alert", "Confirm");
        };

        //Phonegap geolocation function
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    };

    mobile.pushServiceData = function (e) {
        var field,
            fields = _.first(mobile.viewModel.taskDetailsSource.Fields, mobile.viewModel.taskDetailsSource.Fields.length);
        for (field in fields) {
            if (e.getAttribute("data-fieldid") === fields[field].Id) {
                if (e.id === "checkbox" || e.id === "checklist") {
                    var option;
                    for (option in mobile.viewModel.taskDetailsSource.Fields[field].Options) {
                        if (mobile.viewModel.taskDetailsSource.Fields[field].Options[option].Id === e.getAttribute("data-optionid")) {
                            if (e.checked === false) {
                                mobile.viewModel.taskDetailsSource.Fields[field].Options[option].IsChecked = true;
                            } else if (e.checked === true) {
                                mobile.viewModel.taskDetailsSource.Fields[field].Options[option].IsChecked = false;
                            }
                        }
                    }
                } else {
                    mobile.viewModel.taskDetailsSource.Fields[field].Value = e.value;
                }
            }
        }

        dbServices.postServiceDetails(mobile.viewModel.taskDetailsSource.toJSON(), function (data) {
            // On error -> log response.
            console.log(data);
        });
    };

    //region viewModel - Contains all the information and resources relating to the route views.
    mobile.viewModel = kendo.observable({
        /**
         * A kendo data source for Routes for the current user's routes.
         * @type {kendo.data.DataSource}
         */
        routesSource: new kendo.data.DataSource({
            transport: {
                read: {
                    url: dbServices.API_URL + "routes/GetRoutes",
                    type: "GET",
                    dataType: "jsonp",
                    contentType: "application/json; charset=utf-8"
                }
            },
            change: function (e) {

            },
            serverPaging: true
        }),
        refreshRoutes: function () {
            this.routesSource.read();
        },
        /**
         * Select a route
         * @param e The event args from a list view click event (the selected Route)
         */
        selectRoute: function (e) {
            this.set("selectedRoute", e.dataItem);
            this.set("routeDestinationsSource",
                new kendo.data.DataSource({
                    data: this.get("selectedRoute.RouteDestinations")
                }));
            dbServices.getTaskStatuses(this.get("selectedRoute").BusinessAccountId, function (response) {
                mobile.viewModel.set("taskStatusesSource",
                    new kendo.data.DataSource({
                        data: response
                    }));
            });
            app.navigate("view/routeDestinations.html");
        },
        /**
         * Select a route destination
         * @param e The event args from a list view click event (the selected Destination)
         */
        selectRouteDestination: function (e) {
            this.set("selectedDestination", e.dataItem);

            this.set("routeTasksSource",
                new kendo.data.DataSource({
                    data: this.get("selectedDestination.RouteTasks")
                }));

            app.navigate("view/routeDestinationDetails.html");
        },

        contacts: function () {
            return _.union(this.get("selectedDestination.Client.ContactInfoSet").slice(0), this.get("selectedDestination.Location.ContactInfoSet").slice(0));
        },
        /**
         * Select a task and create a dataSource for the task input fields.
         * @param e The event args from a list view click event (the selected Task)
         */
        selectTask: function (e) {
            this.set("selectedTask", e.dataItem);
            dbServices.getTaskDetails(this.get("selectedTask").Id, function (data) {
                mobile.viewModel.set("taskDetailsSource", data[0]);
                mobile.viewModel.set("taskFieldsSource", mobile.viewModel.get("taskDetailsSource").Fields);
                app.navigate("view/taskDetails.html");
            });
        },
        /**
         * Select a status for a certain route and send it to the server.
         */
        selectStatus: function (e) {
            console.log(e.dataItem);
        },
        //Dictate the visibility of the startRoute and endRoute buttons.
        startVisible: true,
        endVisible: false,
        /**
         * Starts collecting and sending trackpoints for the selected route.
         */
        startRoute: function () {
            this.set("startVisible", false);
            this.set("endVisible", true);
            serviceDate = new Date();

            //store the intervalId
            intervalId = window.setInterval(function () {
                addPushTrackPoints(mobile.viewModel.get("selectedRoute").Id);
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
        },
        openStatuses: function () {
            $("#taskStatuses-actionsheet").kendoMobileActionSheet("open");
        },
        closeStatuses: function () {
            $("#taskStatuses-actionsheet").kendoMobileActionSheet("close");
        }
    });
    //endregion

    //Start the mobile application - must be at the bottom of the code.
    app = new kendo.mobile.Application($(document.body), {
        transition: "slide"
    });
});