'use strict';

/** Declare the combined app level module.
 * TODO: This eventually will replace navigation for foundOpsMap and mobileOps.  */
//angular.module('ops', ['ops.services']);

/** Declare the map module. This is a temporary module to manage navigation
 * for the map while it is separate from the app level module. */
angular.module('ops.map', ['ops.services']);

/** Declare mobile app module. This is a temporary module to manage navigation
 * for the mobile application while it is separate from the app level module.  */
angular.module('ops.mobile', ['ops.services']);