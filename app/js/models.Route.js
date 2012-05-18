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
 * Class that encapsulates a route.
 * @param {ops.Guid} id
 * @param {string} name
 * @constructor
 */
ops.models.Route = function (id, name) {
    /**
     * @type {ops.Guid}
     */
    this.id = id;

    /**
     * @type {string}
     */
    this.name = name;
};