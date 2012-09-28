// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold parameter tools.
 */

"use strict";

define(['jquery', 'hasher', 'underscore.string', 'signals'], function ($, hasher, _s, signals) {
    var parameters = {
        changed: new signals.Signal()
    };

    var setHash = function (hash, replace) {
        var currentHash = hasher.getHash();

        if (currentHash === hash) {
            return;
        }

        if (replace) {
            hasher.replaceHash(hash);
        }
        else {
            hasher.setHash(hash);
        }
    };

    /**
     * Gets the hash's query parameters
     * @param [hash] (Optional) The hash to get the section from
     */
    parameters.get = function (hash) {
        var urlParams = {};
        if (!hash) {
            hash = hasher.getHash();
        }

        var from = hash.indexOf('?');
        if (from === -1) {
            return urlParams;
        }

        var query = hash.substring(from + 1);

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

        return urlParams;
    };

    /**
     * Gets the current section from the url
     * @param [hash] (Optional) The hash to get the section from
     * @return {{name: string, isSilverlight: boolean}} section
     */
    parameters.getSection = function (hash) {
        //var currentView = hasher.getHash().slice(hash.indexOf("/"), hasher.getHash().indexOf("."));
        if (!hash) {
            hash = hasher.getHash();
        }

        if (_s.include(hash, "view")) {
            var from = hash.indexOf("view") + 5;
            var to = hash.indexOf(".html", from);
            return {
                name: hash.substring(from, to)
            };
        }
        //ex #silverlight?section=sectionName
        else {
            var params = parameters.get(hash);
            if (!params || !params.section) {
                return null;
            }
            return {
                name: params.section,
                isSilverlight: true
            };
        }

        return null;
    };

    /**
     * Build a query string from a record object
     * @param params Ex. { prop1: value1, prop2: value2 }
     * @param [section] (Optional) The section to set. If null it will keep the current section
     * @return {String} Ex. ?prop1=value1&prop2=value2
     */
    var buildQuery = function (params, section) {
        if (!section) {
            section = parameters.getSection();
        }
        var query = "?";

        if (section) {
            if (section.isSilverlight) {
                query = "silverlight?";
                params.section = section.name;
            } else {
                query = "view/" + section.name + ".html?";
            }
        }

        var first = true;
        _.each(params, function (value, key) {
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
     * Set the parameters/section
     * @param {*} params The parameters to set
     * @param {boolean} [replace] (Optional) If set, it will replace the current hash (and not add it to history).
     * @param {{name: string, isSilverlight: boolean}} [section] (Optional) The section to set. If null it will keep the current section
     */
    parameters.set = function (params, replace, section) {
        var query = buildQuery(params, section);
        setHash(query, replace);
        if (section) {
            parameters.setSection(section);
        }
    };

    /**
     * Change the url parameter (key) with the given value
     * @param key The parameter to change
     * @param value The value to set
     * @param {boolean} [replace] (Optional) If true, it will not add a new history item
     */
    parameters.setOne = function (key, value, replace) {
        var query = parameters.get();
        query[key] = value;
        parameters.set(query, replace);
    };

    /**
     * Sets the section, using the existing url parameters
     * @param section
     * @param [clearParams] (Optional) Defaults to false. Clear all parameters except roleId
     */
    parameters.setSection = function (section, clearParams) {
        if (!section || !section.name) {
            return;
        }

        //do not change sections if this is already the section
        var currentSection = parameters.getSection();
        if (currentSection && currentSection.name === section.name) {
            return;
        }

        var params = parameters.get();
        if (clearParams) {
            _.each(_.keys(params), function (key) {
                if (key !== "roleId") {
                    delete params[key];
                }
            });
        }

        var hash = buildQuery(params, section);

        setHash(hash);
    };

    /**
     * Force parse the parameters and trigger the parameters changed event
     */
    parameters.parse = function () {
        parameters.changed.dispatch(parameters.getSection(), parameters.get());
    };

    // Setup Hasher
    hasher.prependHash = '';
    hasher.init();
    hasher.changed.add(function () {
        parameters.parse();
    });

    return parameters;
});