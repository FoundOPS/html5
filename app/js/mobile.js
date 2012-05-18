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