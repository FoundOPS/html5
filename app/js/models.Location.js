// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold the Location model.
 */

goog.provide('ops.models.Location');

goog.require('ops.models.ContactInfo');

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
ops.models.Location = function(name, addressLineOne, addressLineTwo, city, latitude, longitude, state, zipCode, contactInfoSet){
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