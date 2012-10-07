// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold parameter tools.
 */

"use strict";

define(['jquery', 'hasher', 'underscore.string', 'signals'], function ($, hasher, _s, signals) {
    var parameters = {
        //whenever the parameters, section, or roleId changes trigger changed
        changed: new signals.Signal(),
        section: {
            changed: new signals.Signal()
        },
        roleId: {
            changed: new signals.Signal()
        }
    };

    //constructor
    (function () {
        // Setup hasher
        hasher.prependHash = '';
        hasher.init();
    })();

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
     * Add parameters to a query
     * @param {string} query
     * @param {*} params
     */
    parameters.addParameters = function (query, params) {
        query += "?";

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
     * Build a query string from a record object
     * @param params Ex. { prop1: value1, prop2: value2 }
     * @param [section] (Optional) The section to set. If null it will keep the current section
     * @return {String} Ex. ?prop1=value1&prop2=value2
     */
    var buildQuery = function (params, section) {
        if (!section) {
            section = parameters.getSection();
        }
        var query = "";

        if (section) {
            if (section.isSilverlight) {
                query = "silverlight";
                params.section = section.name;
            } else {
                query = "view/" + section.name + ".html";
            }
        }

        query = parameters.addParameters(query, params);

        return query;
    };

    /**
     * Set the parameters/section
     * @param {{params, replace, section: {name: string, isSilverlight: boolean}}} config
     * [params] (Optional) If not set it will use the current parameters
     * {boolean} [replace] (Optional) If set and true it will replace the current hash (and not add it to history)
     * [section] (Optional) The section to set. If null it will keep the current section
     */
    parameters.set = function (config) {
        var params = config.params, replace = config.replace, section = config.section;

        if (!params) {
            params = parameters.get();
        }

        //always set the role id
        if (!params.roleId) {
            var roleId = session.get("role.id");
            if (!roleId) {
                throw "Cannot set parameters without a role";
            }

            params.roleId = roleId;
        }

        var lastSection = parameters.getSection();

        //if there is no section set, choose the current section
        if (!section) {
            section = lastSection;
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

    var lastSection;
    //only dispatch changes when they have stabilized for 1/5th second
    var sectionChanged = _.debounce(function (section) {
        if (!section) {
            return;
        }

        lastSection = section;
        parameters.section.changed.dispatch(section);
    }, 200);

    //initialize the roleId to the current url parameter (if it exists)
    var lastRoleId = parameters.get().roleId;
    var roleIdChanged = _.debounce(function (roleId) {
        if (!roleId) {
            return;
        }

        lastRoleId = roleId;
        parameters.roleId.changed.dispatch(roleId);
    }, 200);

    hasher.changed.add(function (newHash, oldHash) {
        //ignore empty hashes (this happens when main is reloading the view)
        if (oldHash === '' || newHash === '') {
            return;
        }

        //if there is no roleId set (a section was chosen without adding the parameter)
        //set the roleId
        if (!parameters.get(newHash).roleId && lastRoleId) {
            parameters.setOne("roleId", lastRoleId, true);
            return;
        }

        //TODO include old parameters
        //update the parameters whenever the hash has changed
        parameters.parse();

        //TODO generalize this w the above todo
        //track changes to section and roleId
        var newSection = newHash ? parameters.getSection(newHash) : null;
        var newRoleId = newHash ? parameters.get(newHash).roleId : null;

        //if the section or role changed: dispatch a changed event
        if (!lastSection || !newSection || lastSection.name !== newSection.name) {
            sectionChanged(newSection);
        }
        if (!lastRoleId || !newRoleId || lastRoleId !== newRoleId) {
            roleIdChanged(newRoleId);
        }
    });


    return parameters;
});