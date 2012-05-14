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
    TRACKPOINT_COLLECTION_FREQUENCY_SECONDS:1
};

/**
 * Whether there is a route in progress or not.
 * @type {Boolean}
 */
ops.mobile.RouteInProgress = false;
