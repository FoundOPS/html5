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
     * LOCALAPI: load data from the local api server.
     * ANDROIDLA: debug in Android Emulator using the local api server.
     * LIVE: load from the main server. TODO: Implement this mode.
     * @enum {number}
     */
    developer.DataSource = {
        LOCALAPI: 0,
        ANDROIDLA: 1,
        LIVE: 2,
        TESTAPI: 3
    };

    /**
     * Enum for the map's frame.
     * SILVERLIGHT: The map is loaded inside the silverlight app.
     * BROWSER: The map is loaded directly from a browser.
     * @enum {number}
     */
    developer.Frame = {
        SILVERLIGHT: 0,
        BROWSER: 1
    };

    /**
     * The current web service source.
     * @type {developer.DataSource}
     */
    developer.CURRENT_DATA_SOURCE = developer.DataSource.LOCALAPI;

    /**
     * The current web service source.
     * @type {developer.Frame}
     */
    developer.CURRENT_FRAME = developer.Frame.BROWSER;

    /**
     * The local server's RoleId for GotGrease.
     * @type {string}
     */
    developer.GOTGREASE_ROLE_ID = '0422E014-A06A-451D-8D38-5E6EC0098843';

    return developer;
});