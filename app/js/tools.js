// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold general tools. This will be split up as it grows and the divisions become obvious.
 */

define(function () {
    var tools = {};

    /**
     * Checks whether the date (without the time) are equal.
     * @param {goog.date.Date} a
     * @param {goog.date.Date} b
     * @return {Boolean}
     */
    tools.dateEqual = function (a, b) {
        return a.getDayOfYear() === b.getDayOfYear() && a.getYear() === b.getYear();
    };

    /**
     * Create a new unique Guid.
     * @return {string}
     */
    tools.newGuid = function () {
        var newGuidString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        return newGuidString;
    };

    /**
     * TODO replace with default methods Change a Date to UTC, then format it as an acceptable API date string.
     * @param {Date} The date to format.
     * @return {string} The date formatted in "m-dd-yyyy".
     */
    tools.formatDate = function (date) {
        var month = date.getUTCMonth() + 1,
            day = date.getUTCDate(),
            year = date.getUTCFullYear();
        return month + "-" + day + "-" + year;
    };

    /**
     * Generates a compass direction from rotation degrees.
     * Example: NW, or NNW.
     *
     * @param {number} deg The degree. It will be modd.
     * @return {string} The direction.
     */
    tools.getDirection = function (deg) {
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
     * @param {function(Object)} converter A function that converts an item.
     * @return {Array.<*>} The converted array.
     */
    tools.convertArray = function (items, converter) {
        var convertedData = [];

        var i;
        for (i in items) {
            convertedData.push(converter(items[i]));
        }

        return convertedData;
    };

    return tools;
});