'use strict';

/** Declare the combined app level module. All common
 * TODO: This eventually will replace navigation for foundOpsMap and mobileOps.  */
angular.module('foundOps', ['foundOps.filters', 'foundOps.services', 'foundOps.directives']);

/** Declare the map module. This is a temporary module to manage navigation
 * for the map while it is separate from the app level module. */
angular.module('foundOpsMap', ['foundOps.filters', 'foundOps.services', 'foundOps.directives']);

/** Declare mobile app module. This is a temporary module to manage navigation
 * for the mobile application while it is separate from the app level module.  */
angular.module('foundOpsMobile', ['foundOps.services']);