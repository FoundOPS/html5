'use strict';

/** Declare app level module which depends on filters, services, and directives */
angular.module('foundOPS', ['foundOPS.filters', 'foundOPS.services', 'foundOPS.directives']);

/** Declare the map module which depends on filters, services, and directives */
angular.module('foundOPS.map', ['foundOPS.filters', 'foundOPS.services', 'foundOPS.directives']);

/** Declare mobile app module which depends on foundOPS.services.
 * This is a temporary module to be kept while the mobile
 * application's navigation is separate from the main site.  */
angular.module('mobileOps', ['foundOPS.services']);