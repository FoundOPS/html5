// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold general tools. This will be split up as it grows and the divisions become obvious.
 */

goog.provide('ops.tools');
goog.provide('ops.tools.ValueSelector');

///**
// * TODO replace with default methods Change a Date to UTC, then format it as an acceptable API date string.
// * @param {Date} The date to format.
// * @return {string} The date formatted in "m-dd-yyyy".
// */
//ops.tools.formatDate = function (date) {
//    var month = date.getUTCMonth() + 1,
//        day = date.getUTCDate(),
//        year = date.getUTCFullYear();
//    return month + "-" + day + "-" + year;
//};

/**
 * This associates keys with an array of values.
 * It stores the associations/will always return the same value for a key.
 * The values are associated when they are retrieved in order of the next item in the values array.
 * @param {Array.<Object>} values The values to associate with keys.
 * @constructor
 */
ops.tools.ValueSelector = function (values) {
    /**
     * The values to retrieve for keys.
     * @private
     */
    this.values = values;

    this.keysCache = [];
};

/**
 * Gets the value for a key.
 * @param {Object} key The key to retrieve.
 * @return {Object} The value for a value.
 */
ops.tools.ValueSelector.prototype.getValue = function (key) {
    //find the index of the key
    var index = goog.array.indexOf(this.keysCache, key);

    //if the key was not found, add it to keysCache
    if (index === -1) {
        this.keysCache.push(key);
        index = this.keysCache.length - 1;
    }

    //the index of the value will be the index of the key % values.count()
    var valueIndex = index % this.values.length;
    return this.values[valueIndex];
};

/**
 * Generates a compass direction from rotation degrees.
 * Example: NW, or NNW.
 *
 * @param {number} deg The degree. It will be modd.
 * @return {string} The direction.
 */
ops.tools.getDirection = function (deg) {
    // account for negative degrees, make the deg absolute
    deg = Math.abs(deg);

    // account for values above 360
    deg = deg % 360;

    var dir;
    if ((deg >= 0 && deg <= 11.25) || (deg > 348.75 && deg <= 360)) {
        dir = "N";
    } else if (deg > 11.25 && deg <= 33.75) {
        dir = "NNE";
    } else if (deg > 33.75 && deg <= 56.25) {
        dir = "NE";
    } else if (deg > 56.25 && deg <= 78.75) {
        dir = "ENE";
    } else if (deg > 78.75 && deg <= 101.25) {
        dir = "E";
    } else if (deg > 101.25 && deg <= 123.75) {
        dir = "ESE";
    } else if (deg > 123.75 && deg <= 146.25) {
        dir = "SE";
    } else if (deg > 146.25 && deg <= 168.75) {
        dir = "SSE";
    } else if (deg > 168.75 && deg <= 191.25) {
        dir = "S";
    } else if (deg > 191.25 && deg <= 213.75) {
        dir = "SSW";
    } else if (deg > 213.75 && deg <= 236.25) {
        dir = "SW";
    } else if (deg > 236.25 && deg <= 258.75) {
        dir = "WSW";
    } else if (deg > 258.75 && deg <= 281.25) {
        dir = "W";
    } else if (deg > 281.25 && deg <= 303.75) {
        dir = "WNW";
    } else if (deg > 303.75 && deg <= 326.25) {
        dir = "NW";
    } else { //deg > 326.25 && deg <= 348.75
        dir = "NNW";
    }
    return dir;
};

/**
 * Converts an array based on the convert function.
 * @param {Array.<Object>) items
    * @param {function(Object): Object} converter A function that converts an item.
 * @return {Array.<*>} The converted array.
 */
ops.tools.convertArray = function (items, converter) {
    var convertedData = [];

    var i;
    for (i in items) {
        convertedData.push(converter(items[i]));
    }

    return convertedData;
};