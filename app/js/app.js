'use strict';

// Declare app level module which depends on filters, and services
angular.module('foundOPS', ['foundOPS.filters', 'foundOPS.services', 'foundOPS.directives']).
  config(['$routeProvider', function ($routeProvider) {
      $routeProvider.when('/routesmap', { template: 'partials/routesmap.html', controller: RoutesMapCtrl });
      $routeProvider.when('/view2', { template: 'partials/partial2.html', controller: MyCtrl2 });
      $routeProvider.otherwise({ redirectTo: '/routesmap' });
  }]);