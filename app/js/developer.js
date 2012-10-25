// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific settings.
 */

"use strict";

define(['lib/platform', "underscore", 'underscore.string'], function (platform, _, _s) {
    var developer = {};

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
     * DEFAULT: Load the application normally depending on the platform
     * DISABLE_SL: The application is loaded without the Silverlight app
     * @enum {number}
     */
    developer.Frame = {
        DEFAULT: 0,
        DISABLE_SL: 1
    };

    /**
     * The current web service source. Used when running local server for debugging
     * @type {developer.DataSource}
     */
    developer.CURRENT_DATA_SOURCE = developer.DataSource.REMOTE_API;

    /**
     * This is for sections that are in the Silverlight application and is used for debugging
     * @type {developer.Frame}
     */
    developer.CURRENT_FRAME = developer.Frame.DISABLE_SL;

    /**
     * The current silverlight version
     */
    developer.CURRENT_SILVERLIGHT_VERSION = 0.23;

    /**
     * Set to true if deploying
     * This will cause CURRENT_FRAME and CURRENT_DATA_SOURCE to be overridden
     * @type {boolean}
     */
    developer.DEPLOY = true;
    if (developer.DEPLOY) {
        developer.CURRENT_DATA_SOURCE = developer.DataSource.LIVE;
        developer.CURRENT_FRAME = developer.Frame.DEFAULT;
    }

    /**
     * Set to true if this is a mobile platform
     * @type {Boolean}
     */
    developer.IS_MOBILE = _s.include(platform.product, "iPhone") || _s.include(platform.product, "iPad") || _s.include(platform.os, "Android");

    return developer;
});