// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold the Client model.
 */

goog.provide('ops.models.Client');

goog.require('ops.models.ContactInfo');

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