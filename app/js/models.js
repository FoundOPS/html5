// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold FoundOPS models: ContactInfo, TrackPoint
 */
goog.provide('ops.models');
goog.provide('ops.models.ContactInfo');
goog.provide('ops.models.TrackPoint');
goog.provide('ops.models.ResourceWithLastPoint');

goog.require('ops');
goog.require('ops.Guid');

/**
 * Enum for info types.
 * @enum {string}
 */
ops.models.InfoType = {
    PHONE:"Phone Number",
    EMAIL:"Email Address",
    FAX:"Fax Number",
    WEBSITE:"Website",
    OTHER:"Other"
};

/**
 * Enum for device platforms.
 * @enum {string}
 */
ops.models.DevicePlatform = {
    ANDROID:"Android",
    BLACKBERRY:"BlackBerry",
    IPHONE:"iPhone",
    WEBOS:"webOS",
    WINCE:"WinCE",
    UNKNOWN: "Unknown"
};

/**
 * Class encapsulating a piece of contact info.
 * @param {ops.models.InfoType} type
 * @param {string} label Operations Manager Cell, Sales Number, Blog
 * @param {string} data 142-111-1111, sales@foundops.com, blog.foundops.com
 * @constructor
 */
ops.models.ContactInfo = function (type, label, data) {
    /**
     * @type {ops.models.InfoType}
     */
    this.type = type;

    /**
     * @type {String}
     */
    this.label = label;

    /**
     * @type {String}
     */
    this.data = data;
};

/**
 * The track point model.
 * @param {goog.Date.UtcDateTime} collectedTimeStamp
 * @param {?number} accuracy In meters
 * @param {number} heading 180
 * @param {number} latitude 31.1414
 * @param {number} longitude -24.2444
 * @param {ops.models.DevicePlatform} source The platform of mobile device the TrackPoint came from.
 * @param {number} speed In meters per second
 * @constructor
 */
ops.models.TrackPoint = function (collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed) {
    /**
     * When the TrackPoint was collected.
     * @type {goog.Date.UtcDateTime}
     */
    this.collectedTimeStamp = collectedTimeStamp;

    /**
     * Accuracy level of the latitude and longitude coordinates in meters.
     * @type {number}
     */
    this.accuracy = accuracy;

    /**
     * The compass heading in degrees from north. Ex. 180 = South
     * @type {number}
     */
    this.heading = heading;

    /**
     * @type {number}
     */
    this.latitude = latitude;

    /**
     * @type {number}
     */
    this.longitude = longitude;

    /**
     * Type of device that sent the TrackPoint. Ex. iPhone
     * @type {ops.models.DevicePlatform}
     */
    this.source = source;

    /**
     * Speed in meters per second.
     * @type {number}
     */
    this.speed = speed;
};

/**
 * Convert the TrackPoint to an API consumable model.
 * @return {Object}
 */
ops.models.TrackPoint.prototype.getApiModel = function () {
    var model = {};

    //TODO refactor to heading
    model.CompassDirection = this.heading;
    model.Latitude = this.latitude;
    model.Longitude = this.longitude;
    model.Speed = this.speed;
    model.CollectedTimeStamp = this.collectedTimeStamp.toUTCIsoString();
    model.Source = this.source;

    return model;
};

/**
 * Class encapsulating the last trackpoint of a resource (Employee or Vehicle).
 *
 * @param {?ops.Guid} employeeId If not null set the resource as an employee (and vehicleId should be null).
 * @param {?ops.Guid} vehicleId If not null set the resource as a vehicle (and employeeId should be null).
 * @param {string} entityName
 * @param {goog.Date.UtcDateTime} collectedTimeStamp
 * @param {?number} accuracy In meters
 * @param {number} heading 180
 * @param {number} latitude 31.1414
 * @param {number} longitude -24.2444
 * @param {ops.models.DevicePlatform} source The type of mobile device that the TrackPoint came from.
 * @param {number} speed In meters per second
 * @constructor
 * @extends {goog.date.TrackPoint}
 */
ops.models.ResourceWithLastPoint = function (employeeId, vehicleId, entityName, collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed) {
    ops.models.TrackPoint.call(this, collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed);

    /**
     * The employee's Id. If this is not null the resource is an employee.
     * @type {ops.Guid}
     */
    this.employeeId = employeeId;

    /**
     * The vehicle's Id. If this is not null the resource is a vehicle.
     * @type {ops.Guid}
     */
    this.vehicleId = vehicleId;

    /**
     * The name of the employee of vehicle.
     * @type {string}
     */
    this.entityName = entityName;
};
goog.inherits(ops.models.ResourceWithLastPoint, ops.models.TrackPoint);

/**
 * This should not be sent back to the server and therefore
 * does not need to be converted back to an api model.
 */
ops.models.TrackPoint.prototype.getApiModel = null;