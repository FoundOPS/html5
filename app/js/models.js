// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold FoundOPS models: ContactInfo, TrackPoint
 */
goog.provide('ops.models');
goog.provide('ops.models.IEditable');

goog.provide('ops.models.ContactInfo');

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
    UNKNOWN:"Unknown"
};

/**
 * An interface for defining editable models.
 * @interface
 */
ops.models.IEditable = function () {
};

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
