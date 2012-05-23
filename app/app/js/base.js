// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold base types.
 */

goog.provide('ops');
goog.provide('ops.Guid');

/**
 * Checks whether the date (without the time) are equal.
 * @param {goog.date.Date} a
 * @param {goog.date.Date} b
 * @return {Boolean}
 */
ops.dateEqual = function (a, b) {
    return a.getDayOfYear() === b.getDayOfYear() && a.getYear() === b.getYear();
};

/**
 * Create a new unique Guid.
 * @return {ops.Guid}
 */
ops.Guid.NewGuid = function () {
    var newGuidString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    return newGuidString;
};

/**
 * Try to convert the value to an ops.Guid
 * @param {*} value The value to convert to.
 * @return {?ops.Guid} If the value is empty or this cannot convert, it will return null.
 */
ops.Guid.convert = function (value) {
    if (goog.isDefAndNotNull(value)) {
        if (goog.isString(value) && !goog.string.isEmpty(value)) {
            return value;
        }

        //TODO add more conversions
    }

    return null;
};

/**
 * The layer group of resources for the selected route.
 * @type {window.L.LayerGroup}
 */
ops.resourcesGroup = new window.L.LayerGroup();

/**
 * The layer group of routes.
 * @type {window.L.LayerGroup}
 */
ops.routesGroup = new window.L.LayerGroup();

/**
 * The layer group of track points for the selected route.
 * @type {window.L.LayerGroup}
 */
ops.trackPointsGroup = new window.L.LayerGroup();