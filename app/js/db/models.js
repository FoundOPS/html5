// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(function () {
    var models = {};
    /**
     * Enum for device platforms.
     * @enum {string}
     */
    models.DevicePlatform = {
        ANDROID: "Android",
        BLACKBERRY: "BlackBerry",
        IPHONE: "iPhone",
        WEBOS: "webOS",
        WINCE: "WinCE",
        UNKNOWN: "Unknown"
    };

    /**
     * Enum for info types.
     * @enum {string}
     */
    models.InfoType = {
        PHONE: "Phone Number",
        EMAIL: "Email Address",
        FAX: "Fax Number",
        WEBSITE: "Website",
        OTHER: "Other"
    };

    models.TrackPoint = function (date, accuracy, heading, latitude, longitude, routeId, source, speed) {
        this.collectedTimeStamp = date;
        this.accuracy = accuracy;
        this.heading = heading;
        this.latitude = latitude;
        this.longitude = longitude;
        this.routeId = routeId;
        this.source = source;
        this.speed = speed;
    };

    return models;
});



