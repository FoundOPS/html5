//Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

'use strict';

define(["developer", "tools/dateTools", "db/saveHistory", "tools/parameters"], function (developer, dateTools, saveHistory, parameters) {
    var apiUrl, dbServices;

    //constructor
    (function () {
        $.support.cors = true;
        $.ajaxSetup({
            xhrFields: {
                withCredentials: true
            }
        });

        //setup the api url depending on the mode
        var mode = developer.CURRENT_DATA_SOURCE;
        if (mode === developer.DataSource.BROWSER_LOCALAPI) {
            apiUrl = 'http://localhost:9711/api/';
        } else if (mode === developer.DataSource.ANDROID_LOCALAPI) {
            apiUrl = 'http://10.0.2.2:9711/api/';
        } else if (mode === developer.DataSource.LIVE) {
            apiUrl = 'http://api.foundops.com/api/';
        } else if (mode === developer.DataSource.REMOTE_API) {
            apiUrl = "http://192.168.0.115:70/api/"; // Local IP of host computer (might change everyday).
        } else if (mode === developer.DataSource.TESTAPI) {
            apiUrl = 'http://testapi.foundops.com/api/';
        }
    })();

    /**
     * Hookup to DataSources Create, Update, Delete complete functions:
     * 1) provide notifications for failure and success
     * 2) reload the data
     * @param dataSource
     */
    var hookupDefaultComplete = function (dataSource) {
        var onComplete = function (jqXHR, textStatus) {
            if (textStatus === "success") {
                saveHistory.success();
            } else {
                dataSource.cancelChanges();
                saveHistory.error(jqXHR.statusText);
            }
        };

        dataSource.transport.options.create.complete = onComplete;
        dataSource.transport.options.update.complete = onComplete;
        dataSource.transport.options.destroy.complete = onComplete;
    };

    /**
     * Return a function to perform a modified ajax request
     * @private
     * @param {{query: string, data: object=, excludeRoleId: boolean=, type: string=, headers: *}} config
     * query The query string to use. Ex. "routes/GetDepots"
     * params The parameters to use
     * excludeRoleId Do not include the roleId in the params.
     * If this is not set, the query will wait until a role is set to run
     * type Defaults to GET
     * @return {function(*)|ajax} see below
     */
    var requestFactory = function (config) {
        /**
         * Performs a modified ajax request and returns the promise
         * @param {*}= params Additional parameters for the url
         * @param {*}= body Data for the body. It will be serialized as JSON
         * Optional config object, which will overwrite the default config's properties individually where set
         */
        return function (params, body) {
            config.params = config.params || {};
            //add any additional parameters
            if (params) {
                config.params = _.extend(config.params, params);
            }

            var deferredRequest = new $.Deferred();

            //when the deferred request is resolved, execute the ajax (through the pipe)
            var promise = deferredRequest.pipe(function (input) {
                var url = apiUrl + input.query;

                //add the parameters to the url
                if (input.params) {
                    url = parameters.addParameters(url, input.params);
                }

                var options = {
                    type: input.type || "GET",
                    url: url,
                    dataType: "json",
                    contentType: 'application/json'
                };

                //if there is a body, stringify and add it
                if (body) {
                    options.data = JSON.stringify(body);
                }

                if (input.headers) {
                    options.headers = input.headers;
                }

                var ajax = $.ajax(options);

                //link up save notifications (on everything except GET)
                if (options.type === "GET") {
                    return ajax;
                }

                return saveHistory.linkNotification(ajax);
            });

            //if opt_excludeRoleId was not set add it as a parameter
            if (!config.excludeRoleId) {
                //if the roleId is not loaded yet, add it to the roleId function queue
                var roleId = parameters.get().roleId;

                if (!roleId) {
                    parameters.roleId.changed.add(function () {
                        deferredRequest.resolve(config);
                    });

                    return promise;
                }

                config.params.roleId = roleId.toString();
            }

            deferredRequest.resolve(config);

            return promise;
        };
    };

    //the entity's read, insert, update and destroy ajax configurations
    var entityConfig = {
        errors: {
            insert: {}
        },
        columnConfigurations: {},
        depots: {params: {depots: true}},
        routes: {},
        routeTasks: {
            update: {}
        },
        services: {
            parse: function (service) {
                //converts the service's Field's DateTime values to dates (there is only one right now)
                service.ServiceDate = moment(service.ServiceDate).toDate();
            },
            read: {},
            update: {}
        },
        sessions: {
            params: {isMobile: developer.CURRENT_FRAME === developer.Frame.MOBILE_APP},
            excludeRoleId: true,
            headers: {"ops-details": "true"}
        },
        taskStatuses: {}
    };

    //region public properties

    dbServices = {
        /**
         * The url for the API.
         * @type {string}
         * @const
         */
        API_URL: apiUrl,
        ROOT_API_URL: apiUrl.replace("api/", ""),

        /**
         * Enum for loading statuses.
         * @enum {number}
         */
        Status: {
            LOADING: 0,
            LOADED: 1
        },

        hookupDefaultComplete: hookupDefaultComplete
    };
    //construct public entity objects with functions for read/insert/update/destroy from entityConfig
    _.each(entityConfig, function (value, key) {
        var functions = {};

        //before creating the request factories, set the query to the name of the entity
        if (value.read || value.insert || value.update || value.destroy) {
            if (value.parse) {
                functions.parse = value.parse;
            }

            if (value.read) {
                value.read.query = key;
                functions.read = requestFactory(value.read);
            }
            if (value.insert) {
                value.insert.query = key;
                value.insert.type = "POST";
                functions.insert = requestFactory(value.insert);
            }
            if (value.update) {
                value.update.query = key;
                value.update.type = "PUT";
                functions.update = requestFactory(value.update);
            }
            if (value.destroy) {
                value.destroy.query = key;
                value.destroy.type = "DELETE";
                functions.destroy = requestFactory(value.destroy);
            }
        }
        //if no config was specified, just setup for read
        else {
            value.query = key;
            functions.read = requestFactory(value);
        }

        dbServices[key] = functions;
    });

    //endregion

    //region old

    //    /**
//     * Get the service and its fields.
//     * Need to pass either the serviceId, or the occurDate and the recurringServiceId, or the service provider's serviceTemplateId
//     * @param {?string} serviceId
//     * @param {?Date} serviceDate
//     * @param {?string} recurringServiceId
//     * @param {?string} serviceTemplateId
//     * @param {!function(Object)} callback The callback to pass the Service it is loaded.
//     */
//    services.getServiceDetails = function (serviceId, serviceDate, recurringServiceId, serviceTemplateId, callback) {
//        var data = {
//            serviceId: serviceId,
//            serviceDate: dateTools.stripDate(serviceDate),
//            recurringServiceId: recurringServiceId,
//            serviceTemplateId: serviceTemplateId
//        };
//
//        return services.requestFactory('service/GetServiceDetails', data, false)(function (data) {
//            //It will only have one item
//            var service = data[0];
//            services.convertServiceDates(service);
//            callback(service);
//        });
//    };

//    services.getResourcesWithLatestPoints = services.requestFactory('trackpoint/GetResourcesWithLatestPoints', {}, false);
//    services.getRoutes = function (serviceDateUtc, callback) return services.requestFactory('routes/GetRoutes', {serviceDateUtc: dateTools.stripDate(serviceDateUtc)}, false)(callback);
//    services.getTrackPoints = function (routeId, callback) {        return services.requestFactory('trackPoint/GetTrackPoints',            {routeId: routeId}, false)(callback);
    //    services.getAllEmployeesForBusiness = services.requestFactory('settings/GetAllEmployeesForBusiness', {}, false);
//    services.getBusinessSettings = services.requestFactory('settings/GetBusinessSettings', {}, false);
//    services.getPersonalSettings = services.requestFactory('settings/GetPersonalSettings', {}, false);
//   services.getBusinessSettings = services.requestFactory('settings/GetBusinessSettings', {}, false);
    //    services.getClientLocations = function (clientId, callback) {//        return services.requestFactory("Locations/Get", {clientId: clientId})(callback);
    //    services.getServiceTypes = services.requestFactory('service/GetServiceTypes', {}, false);


//    services.postTrackPoints = function (trackPoints, callback) {
//        $.ajax({
//            url: services.API_URL + "trackpoint/PostEmployeeTrackPoint",
//            type: "POST",
//            dataType: "json",
//            contentType: 'application/json',
//            data: JSON.stringify(trackPoints),
//            success: function (response) {
//                callback(response);
//            },
//            error: function (response) {
//                console.log("Ajax Error");
//                console.log(response);
//            }
//        });
//    };
//
//

//
//    services.updateService = function (service) {
//        services.convertServiceDates(service);
//        return saveHistory.linkNotification(
//            $.ajax({
//                url: services.API_URL + "service/UpdateService",
//                type: "POST",
//                dataType: "json",
//                contentType: 'application/json',
//                data: JSON.stringify(service)
//            })
//        );
//    };
//
//    services.deleteService = function (service) {
//        $.ajax({
//            url: services.API_URL + "service/DeleteService",
//            type: "POST",
//            dataType: "json",
//            contentType: 'application/json',
//            data: JSON.stringify(service)
//        });
//    };

    /**
     * Updates the column configurations for the current role (for the current user)
     * @param columnConfigurations
     */
//    services.updateColumnConfigurations = function (columnConfigurations) {
//        $.ajax({
//            url: services.API_URL + "session/UpdateColumnConfigurations?roleId=" + roleId,
//            type: "POST",
//            dataType: "json",
//            contentType: 'application/json',
//            data: JSON.stringify(columnConfigurations)
//        });
//    };

    /**
     * Updates business settings.
     * @param {(Array.<Object>)} settings The updated settings.
     */
//    services.updateBusinessSettings = function (settings) {
//        return saveHistory.linkNotification(
//            $.ajax({
//                url: services.API_URL + "settings/UpdateBusinessSettings?roleId=" + roleId,
//                type: "POST",
//                dataType: "json",
//                contentType: 'application/json',
//                data: JSON.stringify(settings)
//            })
//        );
//    };

//    /**
//     * Updates personal password.
//     * @param {string} oldPass.
//     * @param {string} newPass.
//     * @param {string} confirmPass.
//     */
//    services.updatePassword = function (oldPass, newPass, confirmPass) {
//        return saveHistory.linkNotification(
//            $.ajax({
//                url: services.API_URL + "settings/UpdatePassword?oldPass=" + oldPass + "&newPass=" + newPass + "&confirmPass=" + confirmPass,
//                type: "POST"
//            })
//        );
//    };

    /**
     * Updates personal user settings.
     * @param {!function(Array.<Object>)} settings The loaded settings.
     */
//    services.updatePersonalSettings = function (settings) {
//        return saveHistory.linkNotification(
//            $.ajax({
//                url: services.API_URL + "settings/UpdatePersonalSettings?roleId=" + roleId,
//                type: "POST",
//                dataType: "json",
//                contentType: 'application/json',
//                data: JSON.stringify(settings)
//            })
//        );
//    };

    //  services.getTimeZones = services.requestFactory('settings/GetTimeZones', {}, false);


//    services.updateRouteTask = function (task) {
//        return saveHistory.linkNotification(
//            $.ajax({
//                url: services.API_URL + "routes/UpdateRouteTask",
//                type: "POST",
//                dataType: "json",
//                contentType: 'application/json',
//                data: JSON.stringify(task)
//            })
//        );
//    };

    //endregion

    return dbServices;
});