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
     * Enum for the map's frame.
     * SILVERLIGHT: The map is loaded inside the silverlight app.
     * BROWSER: The map is loaded directly from a browser.
     * @enum {number}
     */
    developer.Frame = {
        SILVERLIGHT: 0,
        BROWSER: 1,
        MOBILE_APP: 2
    };

    /**
     * The current web service source. Used when running local server for debugging.
     * @type {developer.DataSource}
     */
    developer.CURRENT_DATA_SOURCE = developer.DataSource.BROWSER_LOCALAPI;

    /**
     * This is for sections that are in the Silverlight application and is used for debugging.
     * @type {developer.Frame}
     */
    developer.CURRENT_FRAME = developer.Frame.MOBILE_APP;

    /**
     * The local server's RoleId for GotGrease.
     * @type {string}
     */
    developer.GOTGREASE_ROLE_ID = '7E31F602-C6AA-4F7A-AF46-E8FC1642DAB2';

    return developer;
});