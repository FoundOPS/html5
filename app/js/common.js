/** A common module (http://stackoverflow.com/questions/3722820/examples-of-practical-javascript-object-oriented-design-patterns/3722845#3722845) */
var F = {};

//region CONSTANTS

/**
 * A flag set to true when debuging in a browser
 * @const
 * @type {boolean}
 */
F.DEBUG = true;

/** setup the api url, depending on the mode
 *  @type {string}
 */
var apiUrl;
if (F.DEBUG)
    apiUrl = "http://localhost:9711/";
else
    apiUrl = "http://api.foundops.com/";

/**
 * The API url
 * @const
 * @type {string}
 */
F.API_URL = apiUrl;

/** A set of item colors to iterate for multiple items
 * @type {Array.<string>}
 */
F.ITEM_COLORS = [
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

/** A set of item opacities to iterate for multiple items
 * @type {Array.<number>}
 */
F.ITEM_OPACITIES = [
    .80,
    .75,
    .70,
    .65,
    .60,
    .55,
    .50,
    .45,
    .40,
    .35,
    .30
];

//endregion

var colorIndex = 0;
F.opacityIndex = 0;
var routeColors = [];
var resourceOpacities = [];

//region Methods

/** Change UTC format to "m-dd-yyyy" format */
F.formatDate = function (date) {
    var month = date.getUTCMonth() + 1,
        day = date.getUTCDate(),
        year = date.getUTCFullYear();
    return month + "-" + day + "-" + year;
};

/** Gets the color assigned to a route (or assigns a color if none is assigned)
 * @param {string} routeId
 * @return {string} color
 */
F.getColor = function (routeId) {
    /** Iterate through routeColors and check for the routeId*/
    for (var obj in routeColors) {
        if (routeColors[obj].routeId == routeId)
        /** return the color of the route if it exists */
            return routeColors[obj].color;
    }

    /** Add a new routeColor object to routeColors */
    routeColors.push(new F.routeColor(routeId, F.ITEM_COLORS[colorIndex]));
    /** Get the next color from the list
     * @type {string}
     */
    var color = F.ITEM_COLORS[colorIndex];

    /** reset the color index to 0 when the counter gets to 10 */
    colorIndex++;
    if (colorIndex > 9)
        colorIndex = 0;

    return color;
};

/** Generates a compass direction from rotation degrees
 * @param {number} deg
 * @return {string} dir
 */
F.getDirection = function (deg) {
    var dir;
    /** Account for negaive degrees(convert to number between 0 and 360) */
    while (deg < 0) {
        deg += 360;
    }
    /** Account for values above 360(convert to number between 0 and 360) */
    while (deg > 360) {
        deg -= 360;
    }
    if ((deg >= 0 && deg <= 11.25) || (deg > 348.75 && deg <= 360)) {
        dir = "N";
    } else if (deg > 11.25 && deg <= 33.75) {
        dir = "NNE";
    } else if (deg > 33.75 && deg <= 56.25) {
        dir = "NE";
    } else if (deg > 56.25 && deg <= 78.75) {
        dir = "ENE";
    } else if (deg > 78.75 && deg <= 101.25) {
        dir = "E";
    } else if (deg > 101.25 && deg <= 123.75) {
        dir = "ESE";
    } else if (deg > 123.75 && deg <= 146.25) {
        dir = "SE";
    } else if (deg > 146.25 && deg <= 168.75) {
        dir = "SSE";
    } else if (deg > 168.75 && deg <= 191.25) {
        dir = "S";
    } else if (deg > 191.25 && deg <= 213.75) {
        dir = "SSW";
    } else if (deg > 213.75 && deg <= 236.25) {
        dir = "SW";
    } else if (deg > 236.25 && deg <= 258.75) {
        dir = "WSW";
    } else if (deg > 258.75 && deg <= 281.25) {
        dir = "W";
    } else if (deg > 281.25 && deg <= 303.75) {
        dir = "WNW";
    } else if (deg > 303.75 && deg <= 326.25) {
        dir = "NW";
    } else { //deg > 326.25 && deg <= 348.75
        dir = "NNW";
    }
    return dir;
};

/** Gets the color assigned to a route (or assigns a color if none is assigned)
 * @param {string} resourceId
 * @return {number} opacity
 */
F.getOpacity = function (resourceId) {
    /** Iterate through resourceOpacities and check for the resourceId*/
    for (var obj in resourceOpacities) {
        if (resourceOpacities[obj].resourceId == resourceId)
        /** return the opacity of the resource if it exists */
            return resourceOpacities[obj].opacity;
    }
    /** Add a new resourceOpacity object to resourceOpacities */
    resourceOpacities.push(new F.resourceOpacity(resourceId, F.ITEM_OPACITIES[F.opacityIndex]));
    /** Get the next opacity from the list
     * @type {number}
     */
    var opacity = F.ITEM_OPACITIES[F.opacityIndex];

    /** reset the opacity index to 0 when the counter gets to 10 */
    F.opacityIndex++;
    if (F.opacityIndex > 10)
        F.opacityIndex = 0;

    return opacity;
};

/** An object to assign opacities to resourceId's
 * @constructor
 */
F.resourceOpacity = function (resourceId, opacity) {
    this.opacity = opacity;
    this.resourceId = resourceId;
};

/** An object to assign colors to routeId's
 * @constructor
 */
F.routeColor = function (routeId, color) {
    this.color = color;
    this.routeId = routeId;
};

//endregion