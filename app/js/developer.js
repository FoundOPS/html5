// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific settings.
 */

"use strict";

define(function () {
    var developer = {};

    /**
     * Enum for analytics storage
     * @enum {number}
     */
    developer.AnalyticsStore = {
        OFF: 0,
        DEBUG: 1,
        LIVE: 2
    };

    /**
     * Enum for the data source.
     * BROWSER_LOCALAPI: load data from the local api server
     * ANDROID_EMULATOR_LOCALAPI: debug in Android Emulator using the local api server
     * LIVE: load from the main server
     * REMOTE_API: using the local computers ip address
     * TESTAPI: using the test api server
     * @enum {number}
     */
    developer.DataSource = {
        BROWSER_LOCALAPI: 0,
        ANDROID_EMULATOR_LOCALAPI: 1,
        LIVE: 2,
        REMOTE_API: 3,
        TESTAPI: 4
    };

    /**
     * Enum for the application's frame.
     * SILVERLIGHT: The application is loaded with the local SL app.
     * SILVERLIGHT_PUBLISHED: The application is loaded with the live SL app.
     * BROWSER: The application is loaded without the SL app.
     * MOBILE_APP: The application is loaded for mobile phones.
     * @enum {number}
     */
    developer.Frame = {
        SILVERLIGHT: 0,
        SILVERLIGHT_PUBLISHED: 1,
        BROWSER: 2,
        MOBILE_APP: 3
    };

    /**
     * The storage for analytics
     * @type {developer.AnalyticsStore}
     */
    developer.CURRENT_ANALYTICS = developer.AnalyticsStore.DEBUG;

    /**
     * The current web service source. Used when running local server for debugging
     * @type {developer.DataSource}
     */
    developer.CURRENT_DATA_SOURCE = developer.DataSource.BROWSER_LOCALAPI;

    /**
     * This is for sections that are in the Silverlight application and is used for debugging
     * @type {developer.Frame}
     */
    developer.CURRENT_FRAME = developer.Frame.BROWSER;

    /**
     * The current silverlight version
     */
    developer.CURRENT_SILVERLIGHT_VERSION = 0.23;

    return developer;
});