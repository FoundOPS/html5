// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold parameter tools.
 */

"use strict";

define(['jquery', 'hasher', 'underscore.string', 'signals'], function ($, hasher, _s, signals) {
    var parameters = {
        //whenever the parameters change, trigger parameters.changed
        changed: new signals.Signal(),
        //whenever the section changes, trigger parameters.section.changed
        section: {
            changed: new signals.Signal()
        }
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
     * @param {*} config
     * [params] (Optional) If not set it will use the current parameters
     * {boolean} [replace] (Optional) If set and true it will replace the current hash (and not add it to history)
     * {{name: string, isSilverlight: boolean}} [section] (Optional) The section to set. If null it will keep the current section
     */
    parameters.set = function (config) {
        var params = config.params, replace = config.replace, section = config.section;

        if (!params) {
            params = parameters.get();
        }

        //always set the role id
        if (!params.roleId) {
            var roleId = session.get("role.id");
            if (roleId) {
                params.roleId = roleId;
            }
        }

        var lastSection = parameters.getSection();

        //if there is no section set, choose the current section
        if (!section) {
            section = lastSection;
            if (!lastSection) {
                //there must be a section set to set parameters, so return
                return;
            }
        }

        //set the hash
        var query = buildQuery(params, section);
        setHash(query, replace);
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
        parameters.set({params: query, replace: replace});
    };

    /**
     * Force parse the parameters and trigger the parameters changed event
     */
    parameters.parse = function () {
        parameters.changed.dispatch(parameters.getSection(), parameters.get());
    };

    //only dispatch section changes when they have stabilized for 1/5th second
    var sectionChanged = _.debounce(function (section) {
        parameters.section.changed.dispatch(section);
    }, 200);

    // Setup Hasher
    hasher.prependHash = '';
    hasher.init();
    hasher.changed.add(function (newHash, oldHash) {
        parameters.parse();

        var lastSection = oldHash ? parameters.getSection(oldHash) : null;
        var newSection = newHash ? parameters.getSection(newHash) : null;

        //if the section changed, dispatch a section changed event
        if (!lastSection || !newSection || lastSection.name !== newSection.name) {
            sectionChanged(newSection);
        }
    });

    return parameters;
});