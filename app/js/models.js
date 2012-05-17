// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold FoundOPS models.
 */
goog.provide('ops.models');

goog.require('ops');
goog.require('ops.Guid');

/**
 * Represents a TrackPoint.
 * @constructor
 */
ops.models.TrackPoint = function () {
    this.id_ = new ops.Guid.NewGuid();

};

/**
 * The compass direction in degrees from north. Ex. 180 = South
 * @type {ops.Number}
 * @private
 */
ops.models.TrackPoint.prototype.compassDirection = null;

/**
 *
 */
ops.models.TrackPoint.prototype.getApiModel = function () {
    var model = {};

//    model.CompassDirection;
//    model.Latitude;
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
