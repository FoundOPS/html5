'use strict';


// Demonstrate how to register services
// In this case it is a simple constant service.
angular.module('foundOPS.services', []).
  value('version', '0.1');
