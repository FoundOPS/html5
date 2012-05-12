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
    if(guid == null)
       return ops._newGuid();

    return guid;
};

/**
 * Create a new Guid.
 * @return {Guid}
 * @private
 */
ops._newGuid = function () {
    var guidString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    return new ops.Guid(guidString);
}