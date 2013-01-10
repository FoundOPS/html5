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
        {name: "green", color: "#5bad52"},
        {name: "darkred", color: "#872025"},
        {name: "yellow", color: "#d9ca20"},
        {name: "purple", color: "#542093"},
        {name: "orange", color: "#d95920"},
        {name: "darkgreen", color: "#043300"},
        {name: "red", color: "#d91c21"},
        {name: "pink", color: "#e779f2"},
        {name: "brown", color: "#884411"},
        {name: "blue", color: "#115588"}
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
