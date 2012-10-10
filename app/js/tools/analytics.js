// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold analytics.
 */

"use strict";

define(['jquery', 'containers/silverlight', 'developer', 'tools/parameters', 'db/session', 'underscore.string', 'totango'], function ($, silverlight, developer, parameters, session, _s) {
    var analytics = {}, totango, totangoServiceId;

    if (developer.TRACK_ANALYTICS === developer.TRACK_ANALYTICS_OPTION.DEBUG) {
        totangoServiceId = "SP-12680-01";
    } else if (developer.TRACK_ANALYTICS === developer.TRACK_ANALYTICS_OPTION.LIVE) {
        totangoServiceId = "SP-1268-01";
    }

    try {
        totango = new __totango(totangoServiceId);
    } catch (err) {
        // uncomment the alert below for debugging only
        console.log("Totango code load failure, tracking will be ignored");
        var quite = function () {
        };
        totango = {
            track: quite,
            identify: quite,
            setAccountAttributes: quite
        };
    }

    analytics.track = function (activity, section) {
        var user = session.get("user");

        var organization = session.get("role.name");

        var email = session.get("email");
        //don't include foundops emails
        if(email && _s.includes(email, "foundops.com")){
            return;
        }

        if (!section) {
            section = _s.capitalize(parameters.getSection().name);
        }

        totango.track(activity, section, organization, user);
    };

    //track whenever the section changes
    parameters.section.changed.add(function (section) {
        //section.name
        analytics.track(_s.capitalize(section.name), "navigator");
    });

    return analytics;
});