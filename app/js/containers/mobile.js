'use strict';

// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold mobile models/logic.
 */
goog.provide('ops.mobile');

/**
 * The configuration object for the mobile application.
 * @const
 * @type {Array.<Object>}
 */
ops.mobile.CONFIG = {
    /**
     * The frequency to collect trackPoints in seconds.
     * @const
     * @type {number}
     */
    TRACKPOINT_COLLECTION_FREQUENCY_SECONDS:1,

    /**
     * The accuracy threshold that determines whether to record a trackPoint (in meters).
     * @const
     * @type {number}
     */
    ACCURACY_THRESHOLD:50
};

var app;
var selectedRoute = null;
var selectedRouteDestination = null;

var selectRoute = function (route) {
    selectedRoute = route;
    app.navigate("views/routedestinations.html");
};

var selectRouteDestination = function () {

};

$(document).ready(function () {
    //Start the mobile application
    app = new kendo.mobile.Application($(document.body), {platform: "ios"});

    //navigate to routes
    app.navigate("views/routes.html");
});

ops.mobile.setupRoutesList = function () {
    $("#routes-listview").kendoMobileListView({
        dataSource: ops.services.routesDataSource,
        pullToRefresh: true,
        selectable: true,
        style: "inset",
        template: $("#routeListViewTemplate").html(),
        click: function (e) {
            selectRoute(e.dataItem);
        }
    });
};

ops.mobile.setupRouteDestinationsList = function () {
    $("#routedestinations-listview").kendoMobileListView({
        dataSource: selectedRoute.RouteDestinations,
        selectable: true,
        style: "inset",
        template: $("#routeDestinationsViewTemplate").html()
    });
};