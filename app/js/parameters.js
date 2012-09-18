// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold parameter tools.
 */

"use strict";

define(['hasher', 'underscore.string', 'signals'], function (hasher, _s, signals) {
    var parameters = {
        changed: new signals.Signal()
    };

    /**
     * Gets the hash's query parameters
     */
    parameters.get = function (urlHash) {
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
    parameters.getSection = function () {
        //var currentView = hasher.getHash().slice(hash.indexOf("/"), hasher.getHash().indexOf("."));

        var url = document.URL;
        //get the section name(what's between "view/" and ".html")
        var matches = url.match(/view\/(.*)\.html/);
        if (!matches) {
            return null;
        }
        return matches[1];
    };

    /**
     * Build a query string from a record object
     * @param parameters Ex. { prop1: value1, prop2: value2 }
     * @return {String} Ex. ?prop1=value1&prop2=value2
     */
    var buildQuery = function (params) {
        var query = "";
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
     * Set the parameters
     * @param {*} parameters The parameters to set
     * @param {string} [section] (Optional) If null it will keep the current section
     * @param {boolean} [replace] (Optional) If set, it will replace the current hash (and not add it to history).
     */
    parameters.set = function (params, section, replace) {
        if (section === null) {
            section = parameters.getSection();
        }

        var query = section ? "view/" + section + ".html?" : "?";
        query += buildQuery(params);

        //TODO
        if (replace) {
            hasher.replaceHash(query);
        }
        else {
            hasher.setHash(query);
        }
    };

    /**
     * Change the url parameter(key) with the given value
     * @param key The parameter to change
     * @param value The value to set
     * @param {boolean} [replace] (Optional) If true, it will not add a new history item
     */
    parameters.setOne = function (key, value, replace) {
        var query = parameters.get();
        query[key] = value;
        parameters.set(query, null, replace);
    };

    /**
     * Sets the section, using the existing url parameters
     * @param sectionName
     */
    parameters.setSection = function (sectionName) {
        parameters.set(parameters.get(), sectionName);
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