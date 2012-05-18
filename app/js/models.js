// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold FoundOPS models.
 */
goog.provide('ops.models');

goog.require('ops');
goog.require('ops.Guid');

/**
 *
 * @param {number} compassDirection
 * @param {number} latitude
 * @param {number} longitude
 * @constructor
 */
ops.models.TrackPoint = function (compassDirection, latitude, longitude) {
    this.compassDirection_ = compassDirection;
};

/**
 * The compass direction in degrees from north. Ex. 180 = South
 * @type {ops.Number}
 * @private
 */
ops.models.TrackPoint.prototype.compassDirection_ = null;

ops.models.TrackPoint.prototype.getApiModel = function () {
    var model = {};

    model.CompassDirection = this.compassDirection_;
//    model.Latitude
//    model.Longitude;
//    model.Speed;
//    model.Source;
//    model.CollectedTimeStamp;

    return model;
};

/**
 *
 */
ops.models.TrackPoint.prototype.kendoModel = function () {

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