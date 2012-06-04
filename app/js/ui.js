// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class dealing with the look and feel of the application.
 */

goog.provide('ops.ui');

/**
 * An array of item colors to iterate for multiple items.
 * @type {Array.<string>}
 * @const
*/
ops.ui.ITEM_COLORS = [
    "#194A91", //dark blue
    "#ff0000", //red
    "#03EA03", //lime green
    "#663300", //brown
    "#660099", //purple
    "#FF9900", //orange
    "#0099ff", //light blue
    "#006600", //dark green
    "#990000", //dark red
    "#FF00CC"  //pink
];

/**
 * An array of item opacities to iterate for multiple items.
 * @type {Array.<number>}
 * @const
 */
ops.ui.ITEM_OPACITIES = [
    0.80,
    0.75,
    0.70,
    0.65,
    0.60,
    0.55,
    0.50,
    0.45,
    0.40,
    0.35,
    0.30
];

/**
 * Enum for image urls.
 * @enum {String}
 */
ops.ui.ImageUrls = {
    ANDROID: "img/android.png",
    APPLE: "img/apple.png",
    DEPOT: "img/depot.png",
    OUTER_CIRCLE: "img/outerCircle.png",
    TRUCK: "img/truck.png"
};