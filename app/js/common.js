/** A common module (http://stackoverflow.com/questions/3722820/examples-of-practical-javascript-object-oriented-design-patterns/3722845#3722845) */
var F = {};

//region CONSTANTS

/**
 * The current mode.
 * "LOCAL": TODO: load JSON files from the application's directory. Works for both Android & Browser Debugging.
 * "LOCALAPI": load from the local api server.
 * "ANDROIDLA": debug in Android Emulator using the local api server.
 * "LIVE": load from the main server. TODO: Implement this mode.
 * @const
 * @type {string}
 */
F.MODE = "LOCALAPI";

/** setup the api url, depending on the mode */
var apiUrl;
if (F.MODE === "LOCALAPI") {
    //For the local api, use a different root url
    apiUrl = 'http://localhost:9711/';
} else if (F.MODE === "ANDROIDLA") {
    apiUrl = 'http://10.0.2.2:9711/';
} else if (F.MODE === "LOCAL") {
    //For local mode, use GET (for normal JSON without a callback)
    apiUrl = 'GET';
} else if (F.MODE === "LIVE") { };

/**
 * The API url.
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

//region Methods

/** Change a Date to UTC, then format it as an acceptable API date string.
 * @param {Date} The date to format.
 * @return {string} The date formatted in "m-dd-yyyy".
 */
F.formatDate = function (date) {
    var month = date.getUTCMonth() + 1,
        day = date.getUTCDate(),
        year = date.getUTCFullYear();
    return month + "-" + day + "-" + year;
};

//TODO (Rod) Rename to createGuid
/** Create a unique Guid.
 * @return {string} The Guid string.
 */
F.CreateGuid = function CreateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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

//region Color and Opacity methods TODO this all smells like repeated code

//TODO Should these be common? If so they need to be generified

var colorIndex = 0;
F.opacityIndex = 0;

var routeColors = [];
var resourceOpacities = [];

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

//endregion