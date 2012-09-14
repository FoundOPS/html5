// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold general tools. This will be split up as it grows and the divisions become obvious.
 */

"use strict";

define(['hasher', 'underscore.string'], function (hasher, _s) {
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
        if (typeof date === "string") {
            date = moment(date).toDate();
        }
        var month = date.getUTCMonth() + 1,
            day = date.getUTCDate(),
            year = date.getUTCFullYear();
        return month + "-" + day + "-" + year;
    };

    /**
     * Gets the hash's query parameters
     */
    tools.getParameters = function (urlHash) {
        var hash,
            urlParams = {};
        if (urlHash) {
            hash = urlHash;
        } else {
            hash = hasher.getHash();
        }
        var query = hash.substring(hash.indexOf('?') + 1);
        (function () {
            var match,
                pl = /\+/g, // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) {
                    return decodeURIComponent(s.replace(pl, " "));
                };
            while (match = search.exec(query))
                urlParams[decode(match[1])] = decode(match[2]);
        })();

        //remove the view parameter
        var viewParameter = _.find(_.keys(urlParams), function (key) {
            return _s.startsWith(key, "view");
        });
        if (viewParameter) {
            delete urlParams[viewParameter];
        }

        return urlParams;
    };

    //gets the current section from the url
    tools.getCurrentSection = function () {
        //var currentView = hasher.getHash().slice(hash.indexOf("/"), hasher.getHash().indexOf("."));

        var url = document.URL;
        //get the section name(what's between "view/" and ".html")
        var section = url.match(/view\/(.*)\.html/)[1];
        return section;
    };

    /**
     * Build a query string from a record object
     * @param parameters Ex. { prop1: value1, prop2: value2 }
     * @return {String} Ex. ?prop1=value1&prop2=value2
     */
    tools.buildQuery = function (parameters) {
        var query = "";
        var first = true;
        _.each(parameters, function (value, key) {
            if (!first) {
                query += "&";
            } else {
                first = false;
            }
            query += key + "=" + value;
        });

        return query;
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
     * Converts the API date string to UTC
     */
    tools.toUtc = function (dateString) {
        var result = moment.utc(dateString).toDate();
        return result;
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

    /**
     * Resize an image using the proper ratio to have no dimension larger than maxSize
     * Then center the image based on the parent container's width
     * @param element The jQuery element selector
     * @param {number} maxSize
     * @param {number} containerWidth
     */
    tools.resizeImage = function (element, maxSize, containerWidth) {
        //get the original dimensions of the image
        var width = element[0].width;
        var height = element[0].height;
        //get the ratio for each dimension
        var w = maxSize / width;
        var h = maxSize / height;
        //find the lowest ratio(will be the shortest dimension)
        var ratio = Math.min(w, h);
        //use the ratio to set the new dimensions
        var newW = ratio * width;
        var newH = ratio * height;

        //set the final sizes
        element.css("width", newW + "px");
        element.css("height", newH + "px");
        //center the image
        var margin = (containerWidth - newW) / 2;
        element.css("marginLeft", margin + "px");
    };

    //enable the save and cancel buttons
    tools.enableButtons = function (page) {
        $(page + " .cancelBtn").removeAttr("disabled");
        $(page + " .saveBtn").removeAttr("disabled");
    };

    //disable the save and cancel buttons
    tools.disableButtons = function (page) {
        $(page + " .cancelBtn").attr("disabled", "disabled");
        $(page + " .saveBtn").attr("disabled", "disabled");
    };

    /**
     * watches all input elements on page for value change
     * param {string} pageDiv the id of the view. ex: "#personal"
     */
    tools.observeInput = function (pageDiv) {
        $(pageDiv + ' input').each(function () {
            // Save current value of element
            $(this).data('oldVal', $(this).val());
            // Look for changes in the value
            $(this).bind("propertychange keyup input paste change", function () {
                // If value has changed...
                if ($(this).data('oldVal') != $(this).val()) {
                    // Updated stored value
                    $(this).data('oldVal', $(this).val());
                    //enable save and cancel buttons
                    tools.enableButtons(pageDiv);
                }
            });
        });
    };

    tools.getLocalTimeZone = function () {
        var today = new Date().toString();

        var timezone, id;
        if (today.match(/Eastern/)) {
            timezone = "(UTC-05:00) Eastern Time (US & Canada)";
            id = "Eastern Standard Time";
        } else if (today.match(/Central/)) {
            timezone = "(UTC-06:00) Central Time (US & Canada)";
            id = "Central Standard Time";
        } else if (today.match(/Mountain/)) {
            timezone = "(UTC-07:00) Mountain Time (US & Canada)";
            id = "Mountain Standard Time";
        } else if (today.match(/Pacific/)) {
            timezone = "(UTC-08:00) Pacific Time (US & Canada)";
            id = "Pacific Standard Time";
        } else if (today.match(/Alaska/)) {
            timezone = "(UTC-09:00) Alaska";
            id = "Alaskan Standard Time";
        } else if (today.match(/Hawaii/)) {
            timezone = "(UTC-10:00) Hawaii";
            id = "Hawaiian Standard Time";
        }

        return {DisplayName: timezone, TimeZoneId: id};
    };

    return tools;
});