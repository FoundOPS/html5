// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold base types.
 */
goog.provide('ops');

/**
 * Represents a globally unique identifier. Similar to the .NET class.
 * @param {String|null} guid The guid value as a string. If it is null, this will create a unique Guid.
 * @constructor
 */
ops.Guid = function (guid) {
    //if the string is null, create a unique Guid
    if (guid == null)
        this.guid_ = ops._newGuidString();
    else
        this.guid_ = guid;
};

/**
 * Overloaded toString method for object.
 * @return {string} Guid string.
 */
ops.Guid.prototype.toString = function () {
    return this.guid_;
};

/**
 * Create a new Guid string.
 * @return {String}
 * @private
 */
ops._newGuidString = function () {
    var guidString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    return guidString;
}