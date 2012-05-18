// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold the Route and RouteDestination models.
 */

goog.provide('ops.models.RouteDestination');
goog.provide('ops.models.Route');

goog.require('ops');
goog.require('ops.Guid');
goog.require('ops.models.Client');
goog.require('ops.models.Location');


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
    return new ops.models.RouteDestination(ops.Guid.convert(apiModel.Id), apiModel.OrderInRoute, client, location);
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

    return new ops.models.Route(ops.Guid.convert(apiModel.Id), apiModel.Name, routeDestinations);
};