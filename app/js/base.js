// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold base types.
 */
goog.provide('ops');
goog.provide('ops.Guid');

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
 * Create a new unique Guid.
 * @return {ops.Guid}
 */
ops.Guid.NewGuid = function () {
    var newGuidString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    return new ops.Guid(newGuidString);
};