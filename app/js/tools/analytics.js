// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold analytics.
 */

"use strict";

define(['tools/silverlight', 'developer', 'tools/parameters', 'db/session'], function (silverlight, developer, parameters, session) {
    var analytics = {}, totango, totangoServiceId;

    if (developer.DEPLOY) {
        totangoServiceId = "SP-1268-01";
    } else {
        totangoServiceId = "SP-12680-01";
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

    /**
     * Track an activity in totango (for engagement)
     * @param activity {string} The action performed ex. Opened
     */
    analytics.track = function (activity) {
        var user = session.get("user");

        var organization = session.get("role.name");
        var email = session.get("email");
        //don't include foundops emails
        if (email && _.str.include(email, "foundops.com")) {
            return;
        }

        var section = _.str.capitalize(parameters.getSection().name);

        //triggered before session loaded or not in a section
        if (!organization || !user || !section) {
            return;
        }

        totango.track(activity, section, organization, user);
    };

    //track whenever a section is opened
    parameters.section.changed.add(function (section) {
        if (!section) {
            return;
        }

        analytics.track("Open");
    });

    window.analytics = analytics;

    return analytics;
});