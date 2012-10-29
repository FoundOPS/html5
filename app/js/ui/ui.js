// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold design settings and ui tools.
 */

"use strict";

define(function () {
    var ui = {};

    /**
     * An array of objects with the class and color to iterate for multiple items.
     * @type {Array.<object>}
     */
    ui.ITEM_COLORS = [
        {name: "darkblue", color: "#194A91"},
        {name: "red", color: "#ff0000"},
        {name: "limegreen", color: "#03EA03"},
        {name: "brown", color: "#663300"},
        {name: "purple", color: "#660099"},
        {name: "orange", color: "#FF9900"},
        {name: "lightblue", color: "#0099ff"},
        {name: "darkgreen", color: "#006600"},
        {name: "darkred", color: "#990000"},
        {name: "pink", color: "#FF00CC"}
    ];

    /**
     * An array of item opacities to iterate for multiple items.
     * @type {Array.<number>}
     * @const
     */
    ui.ITEM_OPACITIES = [
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

    var imageRootUrl = 'img/';
    /**
     * Enum for image urls.
     * @enum {String}
     */
    ui.ImageUrls = {
        ANDROID: imageRootUrl + "android.png",
        APPLE: imageRootUrl + "apple.png",
        PHONE: imageRootUrl + "phone.png",
        DEPOT: imageRootUrl + "depot.png",
        OUTER_CIRCLE: imageRootUrl + "outerCircle.png",
        TRUCK: imageRootUrl + "truck.png",
        MARKER: imageRootUrl + "marker.png",
        MARKER_UNSAVED: imageRootUrl + "marker-unsaved.png",
        MARKER_SHADOW: imageRootUrl + "marker-shadow.png"
    };

    return ui;
});
