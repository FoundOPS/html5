// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific settings.
 */

"use strict";

define(function () {
    var developer = {};
    /**
     * Enum for the data source.
     * LOCAL: load data from JSON files in the application's directory. Works for both Android & Browser Debugging. TODO: Implement this mode.
     * BROWSER_LOCALAPI: load data from the local api server.
     * ANDROID_LOCALAPI: debug in Android Emulator using the local api server.
     * LIVE: load from the main server.
     * @enum {number}
     */
    developer.DataSource = {
        BROWSER_LOCALAPI: 0,
        ANDROID_LOCALAPI: 1,
        LIVE: 2,
        REMOTE_API: 3,
        TESTAPI: 4
    };

    /**
     * Enum for the application's frame.
     * SILVERLIGHT: The application is loaded with the local SL app.
     * SILVERLIGHT: The application is loaded with the live SL app.
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
     * The current web service source. Used when running local server for debugging.
     * @type {developer.DataSource}
     */
    developer.CURRENT_DATA_SOURCE = developer.DataSource.LIVE;

    /**
     * This is for sections that are in the Silverlight application and is used for debugging.
     * @type {developer.Frame}
     */
    developer.CURRENT_FRAME = developer.Frame.SILVERLIGHT_PUBLISHED;

    /**
     * The current silverlight version
     */
    developer.SILVERLIGHT_VERSION = 0.104;

    /**
     * The local server's RoleId for GotGrease.
     * @type {string}
     */
    developer.GOTGREASE_ROLE_ID = '7E31F602-C6AA-4F7A-AF46-E8FC1642DAB2';

    return developer;
});