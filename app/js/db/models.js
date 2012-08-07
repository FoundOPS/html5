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

    /**
     * Creates a TrackPoint to send to the API server.
     * @param {Number} Accuracy In meters.
     * @param {Date} date
     * @param {Number} heading An angle that dictates the direction the phone is facing.
     * @param {Number} latitude
     * @param {Number} longitude
     * @param {Guid} routeId
     * @param {models.DevicePlatform} source The OS of the device using the app.
     * @param {Number} speed Speed at which the phone is moving.
     * @constructor
     */
    models.TrackPoint = function TrackPoint (accuracy, date, heading, latitude, longitude, routeId, source, speed) {
        this.Accuracy = accuracy;
        this.CollectedTimeStamp = date.toJSON();
        this.Heading = heading;
        this.Latitude = latitude;
        this.Longitude = longitude;
        this.RouteId = routeId;
        this.Source = source;
        this.Speed = speed;
    };

    return models;
});



