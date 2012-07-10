// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold general tools. This will be split up as it grows and the divisions become obvious.
 */

"use strict";

define(['underscore', 'developer', 'lib/moment'], function (_, developer, m) {
    var tools = {};

    /**
     * Converts an array based on the convert function.
     * @param {Array.<Object>) items
        * @param {function(Object): Object} converter A function that converts an item.
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

    /**
     * Checks whether the date (without the time) are equal.
     * Ignores UTC.  this is useful for choosing the client's
     * @param {Date} a
     * @param {Date} b
     * @param {Boolean} ignoreUtc If true it will compare the straight date and ignore utc
     * @return {Boolean}
     */
    tools.dateEqual = function (a, b, ignoreUtc) {
        if (ignoreUtc) {
            return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
        }

        return a.getUTCDate() === b.getUTCDate() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
    };

    /**
     * This will return the date's UTC date without the time,
     * in a format consumable for the web api.
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
     * Strips the time zone from a date (to UTC) but keeps the same date.
     * @param date
     * @return {Date}
     */
    tools.stripTimeZone = function (date) {
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    };

    /**
     * Generates a compass direction from rotation degrees.
     * Example: NW, or NNW.
     *
     * @param {number} deg The degree.
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
     * Converts a datasource's view to CSV and saves it using data URI.
     * Uses moment.js for date parsing (you can change this if you would like)
     * TODO save it using Downloadify to save the file name https://github.com/dcneiner/Downloadify
     * @param {Array.<Object>} data The data to convert.
     * @param {boolean} humanize If true, it will humanize the column header names.
     * It will replace _ with a space and split CamelCase naming to have a space in between names -> Camel Case
     * @param {Array.<String>} ignore Columns to ignore.
     * @returns {string} The csv string.
     */
    tools.toCSV = function (data, fileName, humanize, ignore) {
        var csv = '';
        if (!ignore) {
            ignore = [];
        }

        //ignore added datasource properties
        ignore = _.union(ignore, ["_events", "idField", "_defaultId", "constructor", "init", "get",
            "_set", "wrap", "bind", "one", "first", "trigger",
            "unbind", "uid", "dirty", "id", "parent" ]);

        //add the header row
        if (data.length > 0) {
            for (var col in data[0]) {
                //do not include inherited properties
                if (!data[0].hasOwnProperty(col) || _.include(ignore, col)) {
                    continue;
                }

                if (humanize) {
                    col = col.split('_').join(' ').replace(/([A-Z])/g, ' $1');
                }

                col = col.replace(/"/g, '""');
                csv += '"' + col + '"';
                if (col != data[0].length - 1) {
                    csv += ",";
                }
            }
            csv += "\n";
        }

        //add each row of data
        for (var row in data) {
            for (var col in data[row]) {
                //do not include inherited properties
                if (!data[row].hasOwnProperty(col) || _.include(ignore, col)) {
                    continue;
                }

                var value = data[row][col];
                if (value === null) {
                    value = "";
                } else if (value instanceof Date) {
                    value = moment(value).format("MM/D/YYYY");
                } else {
                    value = value.toString();
                }

                value = value.replace(/"/g, '""');
                csv += '"' + value + '"';
                if (col != data[row].length - 1) {
                    csv += ",";
                }
            }
            csv += "\n";
        }

        //TODO replace with downloadify so we can get proper file naming
        window.open("data:text/csv;charset=utf-8," + escape(csv))
    };

    /**
     * This associates keys with an array of values.
     * It stores the associations/will always return the same value for a key.
     * The values are associated when they are retrieved in order of the next item in the values array.
     * @param {Array.<Object>} values The values to associate with keys.
     * @constructor
     */
    tools.ValueSelector = function ValueSelector(values) {
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
    tools.ValueSelector.prototype.getValue = function (key) {
        //find the index of the key
        var index = _.indexOf(this.keysCache, key);

        //if the key was not found, add it to keysCache
        if (index === -1) {
            this.keysCache.push(key);
            index = this.keysCache.length - 1;
        }

        //the index of the value will be the index of the key % values.count()
        var valueIndex = index % this.values.length;
        return this.values[valueIndex];
    };

    return tools;
});