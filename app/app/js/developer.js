// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific code.
 */

goog.provide('ops.developer');

goog.require('ops.Guid');

/**
 * Enum for the service mode.
 * LOCAL: load data from JSON files in the application's directory. Works for both Android & Browser Debugging. TODO: Implement this mode.
 * LOCALAPI: load data from the local api server.
 * ANDROIDLA: debug in Android Emulator using the local api server.
 * LIVE: load from the main server. TODO: Implement this mode.
 * @enum {number}
 */
ops.developer.Mode = {
    LOCAL: 0,
    LOCALAPI: 1,
    ANDROIDLA: 2,
    LIVE: 3
};

/*
 * The current development mode.
 * @const
 * @type {ops.developer.Mode}
 */
ops.developer.CURRENT_MODE = ops.developer.Mode.LOCALAPI;

/**
 * The local server's RoleId for GotGrease
 * @const
 * @type {ops.Guid}
 */
ops.developer.GOTGREASE_ROLE_ID = '9DA1F232-7BA2-43F7-964B-513CBA04FEE1';