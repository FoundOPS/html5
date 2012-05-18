// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold FoundOPS models.
 */
goog.provide('ops.models');

goog.require('ops');
goog.require('ops.Guid');

/**
 * The track point model.
 * @param {number} accuracy
 * @param {number} compassDirection
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} speed
 * @param {*} collectedTimeStamp
 * @param {string=} source The type of mobile device that the TrackPoint came from.
 * @constructor
 */
ops.models.TrackPoint = function (accuracy, compassDirection, latitude, longitude, speed, collectedTimeStamp, source) {
    /**
     * The accuracy that our TrackPoints is valued at.
     * @type {ops.Number}
     */
    this.accuracy = accuracy;
    /**
     * The compass direction in degrees from north. Ex. 180 = South
     * @type {ops.Number}
     */
    this.compassDirection = compassDirection;
    /**
     * Latitude
     * @type {ops.Number}
     */
    this.latitude = latitude;
    /**
     * Longitude
     * @type {ops.Number}
     */
    this.longitude = longitude;
    /**
     * Speed in meters per second.
     * @type {*}
     */
    this.speed = speed;
    /**
     * Time TrackPoint was created.
     * @type {*}
     */
    this.collectedTimeStamp = collectedTimeStamp;
    /**
     * Type of device that sent the TrackPoint.
     * @type {*}
     */
    this.source = source;
};

/**
 * Convert the TrackPoint to an API consumable model.
 * @return {Object}
 */
ops.models.TrackPoint.prototype.getApiModel = function () {
    var model = {};

    model.Accuracy = this.accuracy;
    model.CompassDirection = this.compassDirection;
    model.Latitude = this.latitude;
    model.Longitude = this.longitude;
    model.Speed = this.speed;
    model.CollectedTimeStamp = this.collectedTimeStamp;
    model.Source = this.source;

    return model;
};

/**
 * Class encapsulating a ContactInfo.
 * @param {string} type
 * @param {string} label
 * @param {string} data
 * @constructor
 */
ops.models.ContactInfo = function(type, label, data){
    /**
     *
     * @type {String}
     */
    this.type = type;

    /**
     *
     * @type {String}
     */
    this.label = label;

    /**
     *
     * @type {String}
     */
    this.data = data;
};
