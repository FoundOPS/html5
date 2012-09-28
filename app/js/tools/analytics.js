// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold analytics.
 */

"use strict";

define(['jquery', 'containers/silverlight', 'developer', 'db/session'], function ($, silverlight, developer, session) {
    var analytics = {}, totangoServiceId;

    if (developer.TRACK_ANALYTICS === developer.TRACK_ANALYTICS_OPTION.DEBUG) {
        totangoServiceId = "SP-12680-01";
    } else if (developer.TRACK_ANALYTICS === developer.TRACK_ANALYTICS_OPTION.LIVE) {
        totangoServiceId = "SP-1268-01";
    }

    analytics.track = function (event) {
        var user = session.get("user");
        var organization = session.get("role.name");

        var section = window.location.href.match(/view\/(.*)\.html/)[1];

        var url = "http://sdr.totango.com/pixel.gif/?sdr_s=" + totangoServiceId + "&sdr_o=" + organization + "&sdr_u=" + user + "&sdr_a=" + event + "&sdr_m=" + section;

        silverlight.httpGetImage(url);
    };

    return analytics;
});