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
 * Represents a globally unique identifier. Similar to the .NET class.
 * @param {String} value The guid value as a string.
 * @constructor
 */
ops.Guid = function (value) {
    this.guid_ = value;
};

/**
 * Overloaded toString method for object.
 * @return {string} Guid string.
 */
ops.Guid.prototype.toString = function () {
    return this.guid_;
};


/**
 * Tests whether the given guid is equal to this guid.
 * Note, this is a simple string comparison, it doesn't account
 * for comparisons like "{1234-2414-14241-142414} == 1234-2414-14241-142414".
 *
 * @param {ops.Guid} other The guid to test.
 * @return {boolean} Whether the guids are equal.
 */
ops.Guid.prototype.equals = function (other) {
    return other.guid_ === this.guid_;
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

    return new ops.Guid(newGuidString);
};

/**
 * Try to convert the value to an ops.Guid
 * @param {*} value The value to convert to.
 * @return {?ops.Guid} If the value is empty or this cannot convert, it will return null.
 */
ops.Guid.convert = function (value) {
    if (goog.isDefAndNotNull(value)) {
        if (goog.isString(value) && !goog.string.isEmpty(value)) {
            return new ops.Guid(value);
        }

        //TODO add more conversions
    }

    return null;
};