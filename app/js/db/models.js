// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(function () {
    var models = {};
    /**
     * Enum for device platforms.
     * @enum {string}
     */
    models.DevicePlatform = {
        ANDROID: "android",
        BLACKBERRY: "blackBerry",
        FIRE: "fire",
        IPAD: "ipad",
        IPHONE: "iphone",
        MEEGO: "meego",
        PLAYBOOK: "playbook",
        WEBOS: "webos",
        WINDOWS: "windows",
        WINPHONE: "winphone",
        UNDEFINED: "undefined"
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
    models.TrackPoint = function TrackPoint(accuracy, date, heading, latitude, longitude, routeId, source, speed) {
        this.Accuracy = accuracy;
        this.CollectedTimeStamp = date.toJSON();
        this.Heading = heading;
        this.Latitude = latitude;
        this.Longitude = longitude;
        this.RouteId = routeId;
        this.Source = source;
        this.Speed = speed;
    };

    /**
     * Gets the destination field of a service
     * @param service
     */
    models.getDestinationField = function (service) {
        return _.find(service.Fields, function (field) {
            return field.$type.indexOf("LocationField") !== -1;
        });
    };

    /**
     * Returns the first element in a collection if it's id matches
     * @param arrayElements
     * @param id
     */
    models.firstFromId = function (elements, id) {
        return _.find(elements, function (element) {
            return element.Id === id;
        });
    };

    return models;
});



