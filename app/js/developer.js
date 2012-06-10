// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific settings.
 */

"use strict";

define(function () {
    var developer = {};
    /**
     * Enum for the service mode.
     * LOCAL: load data from JSON files in the application's directory. Works for both Android & Browser Debugging. TODO: Implement this mode.
     * LOCALAPI: load data from the local api server.
     * ANDROIDLA: debug in Android Emulator using the local api server.
     * LIVE: load from the main server. TODO: Implement this mode.
     * @enum {number}
     */
    developer.Mode = {
        LOCAL: 0,
        LOCALAPI: 1,
        ANDROIDLA: 2,
        LIVE: 3
    };

    /**
     * The current development mode.
     * @type {developer.Mode}
     */
    developer.CURRENT_MODE = developer.Mode.LOCALAPI;

    /**
     * The local server's RoleId for GotGrease.
     * @type {string}
     */
    developer.GOTGREASE_ROLE_ID = '68698f53-a894-4db2-9b65-995287b2580f';

    return developer;
});