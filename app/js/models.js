//region Using
// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold FoundOPS models: ContactInfo, TrackPoint
 */

'use strict';

goog.provide('ops.models.Client');
goog.provide('ops.models.ContactInfo');
goog.provide('ops.models');
goog.provide('ops.models.IEditable');
goog.provide('ops.models.Location');
goog.provide('ops.models.RouteDestination');
goog.provide('ops.models.Route');
goog.provide('ops.models.TrackPoint');
goog.provide('ops.models.ResourceWithLastPoint');

goog.require('ops');
goog.require('ops.Guid');
//endregion

/**
 * Enum for info types.
 * @enum {string}
 */
ops.models.InfoType = {
    PHONE: "Phone Number",
    EMAIL: "Email Address",
    FAX: "Fax Number",
    WEBSITE: "Website",
    OTHER: "Other"
};

/**
 * Enum for device platforms.
 * @enum {string}
 */
ops.models.DevicePlatform = {
    ANDROID: "Android",
    BLACKBERRY: "BlackBerry",
    IPHONE: "iPhone",
    WEBOS: "webOS",
    WINCE: "WinCE",
    UNKNOWN: "Unknown"
};

/**
 * An interface for defining editable models.
 * @interface
 */
ops.models.IEditable = function () {};

/**
 * Convert to an API consumable model.
 * @return {Object}
 */
ops.models.IEditable.prototype.getApiModel = function () {
    return {};
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
 * Create a contact info from the api model.
 * @param apiModel
 * @return {function(Object}: ops.models.ContactInfo}
 */
ops.models.ContactInfo.createFromApiModel = function (apiModel) {
    //noinspection JSUnresolvedVariable
    return new ops.models.ContactInfo(apiModel.Type, apiModel.Label, apiModel.Data);
};

/**
 * Class encapsulating a client.
 * @param {string} name
 * @param {Array.<ops.models.ContactInfo>} contactInfoSet
 * @constructor
 */
ops.models.Client = function (name, contactInfoSet) {
    /**
     * @type {String}
     */
    this.name = name;

    /**
     * @type {array.<ops.models.ContactInfo>}
     */
    this.contactInfoSet = contactInfoSet;
};

/**
 * Create a client from the api model.
 * @param apiModel
 * @return {ops.models.Client}
 */
ops.models.Client.createFromApiModel = function (apiModel) {
    //noinspection JSUnresolvedVariable
    var contactInfoSet = ops.tools.convertArray(apiModel.ContactInfoSet, ops.models.ContactInfo.createFromApiModel);

    //noinspection JSUnresolvedVariable
    return new ops.models.Client(apiModel.Name, contactInfoSet);
};

/**
 * Class encapsulating a location.
 * @param {string} name
 * @param {string} addressLineOne
 * @param {string} addressLineTwo
 * @param {string} city
 * @param {string} latitude
 * @param {string} longitude
 * @param {string} state
 * @param {string} zipCode
 * @param {Array.<ops.models.ContactInfo>} contactInfoSet
 * @constructor
 */
ops.models.Location = function (name, addressLineOne, addressLineTwo, city, latitude, longitude, state, zipCode, contactInfoSet) {
    /**
     * @type {String}
     */
    this.name = name;

    /**
     * Eg. "1401 English Garden Court"
     * @type {String}
     */
    this.addressLineOne = addressLineOne;

    /**
     * Eg. "Suite 201"
     * @type {String}
     */
    this.addressLineTwo = addressLineTwo;

    /**
     * Eg. "Herndon"
     * @type {String}
     */
    this.city = city;

    /**
     *  Eg. "40.04169400"
     *  @type {String}
     */
    this.latitude = latitude;

    /**
     * Eg. "-86.90121600"
     * @type {String}
     */
    this.longitude = longitude;

    /**
     * Eg. "VA"
     *  @type {String}
     */
    this.state = state;

    /**
     * Eg. "20171"
     * @type {String}
     */
    this.zipCode = zipCode;

    /**
     * @type {array.<ops.models.ContactInfo>}
     */
    this.contactInfoSet = contactInfoSet;
};

/**
 * Create a location from the api model.
 * @param apiModel
 * @return {ops.models.Location}
 */
ops.models.Location.createFromApiModel = function (apiModel) {
    var contactInfoSet = ops.tools.convertArray(apiModel.ContactInfoSet, ops.models.ContactInfo.createFromApiModel);

    return new ops.models.Location(apiModel.Name, apiModel.AddressLineOne, apiModel.AddressLineTwo, apiModel.City,
        apiModel.Latitude, apiModel.Longitude, apiModel.State, apiModel.ZipCode, contactInfoSet);
};

/**
 * Class encapsulating a route destination.
 * @param {ops.Guid} id
 * @param {number} orderInRoute
 * @param {ops.models.Client} client
 * @param {ops.models.Location} location
 * @constructor
 */
ops.models.RouteDestination = function (id, orderInRoute, client, location) {
    /**
     * @type {ops.Guid}
     */
    this.id = id;

    /**
     * @type {number}
     */
    this.orderInRoute = orderInRoute;

    /**
     * @type {ops.models.Client}
     */
    this.client = client;

    /**
     * @type {ops.models.Location}
     */
    this.location = location;
};

/**
 * Create a route destination from the api model.
 * @param apiModel
 * @return {ops.models.RouteDestination}
 */
ops.models.RouteDestination.createFromApiModel = function (apiModel) {
    var client = ops.models.Client.createFromApiModel(apiModel.Client);
    var location = ops.models.Location.createFromApiModel(apiModel.Location);

    //noinspection JSUnresolvedVariable
    return new ops.models.RouteDestination(apiModel.Id, apiModel.OrderInRoute, client, location);
};

/**
 * Class that encapsulates a route.
 * @param {ops.Guid} id
 * @param {string} name
 * @param {Array.<ops.models.RouteDestination>} routeDestinations
 * @constructor
 */
ops.models.Route = function (id, name, routeDestinations) {
    /**
     * @type {ops.Guid}
     */
    this.id = id;

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @type {Array.<ops.models.RouteDestination>}
     */
    this.routeDestinations = routeDestinations;
};

/**
 * Create a route from the api model.
 * @param apiModel
 * @return {ops.models.Route}
 */
ops.models.Route.createFromApiModel = function (apiModel) {
    //noinspection JSUnresolvedVariable
    var routeDestinations = ops.tools.convertArray(apiModel.RouteDestinations, ops.models.RouteDestination.createFromApiModel);

    return new ops.models.Route(apiModel.Id, apiModel.Name, routeDestinations);
};

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
ops.models.TrackPoint = function (id, routeId, collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed) {
    /**
     * The route this was collected on.
     * @type {ops.Guid}
     */
    this.id = id;

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
     * The heading in degrees from north. Ex. 180 = South
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
    return new ops.models.TrackPoint(apiModel.Id, apiModel.RouteId, apiModel.CollectedTimeStamp,
        apiModel.Accuracy, apiModel.Heading, apiModel.Latitude, apiModel.Longitude, apiModel.Source, apiModel.Speed);
};

/**
 * Convert the TrackPoint to an API consumable model.
 * @return {Object}
 */
ops.models.TrackPoint.prototype.getApiModel = function () {
    var model = {};

    //TODO refactor to heading
    model.Id = this.id;
    model.Heading = this.heading;
    model.Latitude = this.latitude;
    model.Longitude = this.longitude;
    model.Speed = this.speed;
    model.CollectedTimeStamp = this.collectedTimeStamp;
    model.Source = this.source;
    model.Accuracy = this.accuracy;

    return model;
};

/**
 * Class encapsulating the last TrackPoint of a resource (Employee or Vehicle).
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
    var id;

    if (employeeId) {
        id = employeeId;
    } else {
        id = vehicleId;
    }

    ops.models.TrackPoint.call(this, id, routeId, collectedTimeStamp, accuracy, heading, latitude, longitude, source, speed);

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
    return new ops.models.ResourceWithLastPoint(apiModel.EmployeeId, apiModel.VehicleId, apiModel.EntityName,
        apiModel.RouteId, apiModel.CollectedTimeStamp, apiModel.Accuracy, apiModel.Heading, apiModel.Latitude, apiModel.Longitude, apiModel.Source, apiModel.Speed);
};

/**
 * This should not be sent back to the server and therefore
 * does not need to be converted back to an api model.
 */
ops.models.ResourceWithLastPoint.prototype.getApiModel = null;