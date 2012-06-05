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

$(document).ready(function () {
    //Start the mobile application
    var app = new kendo.mobile.Application(document.body);

    //navigate to routes
    app.navigate("views/routes.html");
});

ops.mobile.setupRoutesList = function () {
    $("#routes-listview").kendoMobileListView({
        dataSource: ops.services.routesDataSource,
        pullToRefresh: true,
        selectable: true,
        template : $("#routeListViewTemplate").html()
    });
};

ops.mobile.setupRouteDestinationsList = function () {
    $("#routedestinations-listview").kendoMobileListView({
        dataSource: ops.services.routeDestinationsDataSource,
        template : $("#routeDestinationsViewTemplate").html()
    });
};