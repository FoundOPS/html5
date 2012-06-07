// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific settings
 */

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
        LOCAL:0,
        LOCALAPI:1,
        ANDROIDLA:2,
        LIVE:3
    };

    /**
     * The current development mode.
     * @type {ops.developer.Mode}
     */
    developer.CURRENT_MODE = developer.Mode.LOCALAPI;

    /**
     * The local server's RoleId for GotGrease.
     * @type {ops.Guid}
     */
    developer.GOTGREASE_ROLE_ID = 'd4173da6-f4b0-444e-a9a2-e293a7598ef9';

    return developer;
});