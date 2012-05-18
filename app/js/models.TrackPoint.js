// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold FoundOPS models: ContactInfo, TrackPoint
 */
goog.provide('ops.models.TrackPoint');
goog.provide('ops.models.ResourceWithLastPoint');

goog.require('goog.date.UtcDateTime');
goog.require('ops');
goog.require('ops.Guid');
goog.require('ops.models');
goog.require('ops.models.IEditable');

/**
 * The track point model.
 * @param {ops.Guid} routeId The route this was collected on
 * @param {goog.date.UtcDateTime} collectedTimeStamp
 * @param {?number} accuracy In meters
 * @param {number} heading 180
 * @param {number} latitude 31.1414
 * @param {number} longitude -24.2444
 * @param {ops.models.DevicePlatform} source The platform of mobile device the TrackPoint came from.
 * @param {number} speed In meters per second
 * @constructor
 * @implements {ops.models.IEditable}
 */
ops.models.TrackPoint = function (routeId, collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed) {
    /**
     * The route this was collected on.
     * @type {ops.Guid}
     */
    this.routeId = routeId;

    /**
     * When the TrackPoint was collected.
     * @type {goog.date.UtcDateTime}
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
 * Create a TrackPoint from the api model.
 * @param apiModel
 * @return {ops.models.TrackPoint}
 */
ops.models.TrackPoint.createFromApiModel = function (apiModel) {
    //noinspection JSUnresolvedVariable
    return new ops.models.TrackPoint(ops.Guid.convert(apiModel.RouteId), goog.Date.fromRfc822String(apiModel.CollectedTimeStamp),
        apiModel.Accuracy, apiModel.Heading, apiModel.Latitude, apiModel.Longitude, apiModel.Source, apiModel.Speed);
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
 * @param {ops.Guid} routeId The route this was collected on
 * @param {goog.date.UtcDateTime} collectedTimeStamp
 * @param {?number} accuracy In meters
 * @param {number} heading 180
 * @param {number} latitude 31.1414
 * @param {number} longitude -24.2444
 * @param {ops.models.DevicePlatform} source The type of mobile device that the TrackPoint came from.
 * @param {number} speed In meters per second
 * @constructor
 * @extends {goog.date.TrackPoint}
 */
ops.models.ResourceWithLastPoint = function (employeeId, vehicleId, entityName, routeId, collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed) {
    goog.base(this, routeId, collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed);

    /**
     * The employee's Id. If this is not null the resource is an employee.
     * @type {ops.Guid}
     */
    this.employeeId = employeeId;

    /**
     * The vehicle's Id. If this is not null the resource is an vehicle.
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
 * Create a ResourceWithLastPoint from the api model.
 * @param apiModel
 * @return {ops.models.ResourceWithLastPoint}
 */
ops.models.ResourceWithLastPoint.createFromApiModel = function (apiModel) {
    //noinspection JSUnresolvedVariable
    return new ops.models.ResourceWithLastPoint(ops.Guid.convert(apiModel.EmployeeId), ops.Guid.convert(apiModel.VehicleId), apiModel.EntityName,
        ops.Guid.convert(apiModel.RouteId), goog.Date.fromRfc822String(apiModel.CollectedTimeStamp), apiModel.Accuracy, apiModel.Heading, apiModel.Latitude, apiModel.Longitude, apiModel.Source, apiModel.Speed);
};

/**
 * This should not be sent back to the server and therefore
 * does not need to be converted back to an api model.
 */
ops.models.ResourceWithLastPoint.prototype.getApiModel = null;