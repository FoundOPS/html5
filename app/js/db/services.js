//region Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

'use strict';

define(["developer", "tools/dateTools", "db/saveHistory"], function (developer, dateTools, saveHistory) {
    //functions to queue until after the role id is initially set
    var roleIdFunctionQueue = [],
    //the current role id
        roleId, apiUrl,
    //TODO remove
        services = {};

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
     * Cannot use follow role because this is a dependency of session
     * @param roleId
     */
    var setRoleId = function (roleId) {
        roleId = roleId;

        if (!roleId) {
            return;
        }

        //invoke any function in the queue
        var i;
        for (i in roleIdFunctionQueue) {
            roleIdFunctionQueue[i]();
        }
        roleIdFunctionQueue.length = 0;
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
         * @param {*} params Additional parameters
         * Optional config object, which will overwrite the default config's properties individually where set
         */
        return function (params) {
            config.data = config.data || {};
            //add any additional parameters
            if (params) {
                config = _.extend(config.data, params);
            }

            var deferredRequest = new $.Deferred();

            var promise = deferredRequest.pipe(function (input) {
                var options = {
                    type: input.type || "GET",
                    data: input.data,
                    url: apiUrl + input.query
                };

                if (input.headers) {
                    options.headers = input.headers;
                }

                return $.ajax(options);
            });

            //if opt_excludeRoleId was not set add it as a parameter
            if (!config.excludeRoleId) {
                //if the roleId is not loaded yet, add it to the roleId function queue
                if (!roleId) {
                    roleIdFunctionQueue.push(function () {
                        deferredRequest.resolve(config);
                    });
                    return promise;
                }

                config.data.roleId = roleId.toString();
            }

            deferredRequest.resolve(config);

            return promise;
        };
    };

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

    var load = {
        columnConfigurations: requestFactory({query: 'columnConfigurations/get'}),
        depots: requestFactory({query: 'locations/get?depots=true'}),
        routes: requestFactory({
            query: 'routes/GetRoutes'
        }),
        services: requestFactory({query: "services/get", parser: function (data) {
            _.each(data, function(service){
                services.convertServiceDates(data);
            });

        }}),
        session: requestFactory({
            query: 'sessions/Get',
            params: {isMobile: developer.CURRENT_FRAME === developer.Frame.MOBILE_APP},
            excludeRoleId: true,
            headers: {"ops-details": "true"}
        }),
        taskStatuses: requestFactory({query: "taskStatuses/get"})
    };

    //region Routes, TrackPoints

//    /**
//     * Get resources (Employees/Vehicles) and their last recorded location.
//     * @param {!function(Array.<Object>)} callback The callback to pass the resources with latest points after they are loaded.
//     */
//    services.getResourcesWithLatestPoints = services.requestFactory('trackpoint/GetResourcesWithLatestPoints', {}, false);
//
//    /**
//     * Get the current service provider's Routes.
//     * @param {string} serviceDateUtc The service date to get routes for (in Utc).
//     * @param {!function(Array.<Object>)} callback A callback to pass the loaded routes to.
//     */
//    services.getRoutes = function (serviceDateUtc, callback) {
//        return services.requestFactory('routes/GetRoutes', {serviceDateUtc: dateTools.stripDate(serviceDateUtc)}, false)(callback);
//    };
//
//    /**
//     * Get the service provider's TrackPoints.
//     * @param {string} serviceDate The service date to retrieve TrackPoints for (in Utc).
//     * @param {string} routeId The Id of the route to retrieve TrackPoints for.
//     * @param {!function(Array.<Object>)} callback The callback to pass the TrackPoints to after they are loaded.
//     */
//    services.getTrackPoints = function (routeId, callback) {
//        return services.requestFactory('trackPoint/GetTrackPoints',
//            {routeId: routeId}, false)(callback);
//    };
//
//    /**
//     * Send trackPoint array to server and return success or failure to the callback
//     * @param {Array.<models.TrackPoint>} trackPoints
//     * @param routeId
//     * @param callback
//     */
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
//    //endregion
//
//    //region
//
//    services.getClientLocations = function (clientId, callback) {
//        return services.requestFactory("Locations/Get", {clientId: clientId})(callback);
//    };
//
//    //endregion
//
//    //region Services
//
//    /**
//     * Get the list of services
//     * @param roleId The role to get the services for
//     */
//    services.getServiceTypes = services.requestFactory('service/GetServiceTypes', {}, false);
//
    /**
     * Converts the service's Field's DateTime values to dates
     * @param service
     */
    services.convertServiceDates = function (service) {
        service.ServiceDate = moment(service.ServiceDate).toDate();
    };

    services.updateService = function (service) {
        services.convertServiceDates(service);
        return saveHistory.linkNotification(
            $.ajax({
                url: services.API_URL + "service/UpdateService",
                type: "POST",
                dataType: "json",
                contentType: 'application/json',
                data: JSON.stringify(service)
            })
        );
    };

    services.deleteService = function (service) {
        $.ajax({
            url: services.API_URL + "service/DeleteService",
            type: "POST",
            dataType: "json",
            contentType: 'application/json',
            data: JSON.stringify(service)
        });
    };

    /**
     * Updates the column configurations for the current role (for the current user)
     * @param columnConfigurations
     */
    services.updateColumnConfigurations = function (columnConfigurations) {
        $.ajax({
            url: services.API_URL + "session/UpdateColumnConfigurations?roleId=" + roleId,
            type: "POST",
            dataType: "json",
            contentType: 'application/json',
            data: JSON.stringify(columnConfigurations)
        });
    };

    //endregion

    //region Settings
//
//    // Get Employees.
//    services.getAllEmployeesForBusiness = services.requestFactory('settings/GetAllEmployeesForBusiness', {}, false);
//
//    /**
//     * Get business settings
//     * @param roleId The role to get the business settings for
//     */
//    services.getBusinessSettings = services.requestFactory('settings/GetBusinessSettings', {}, false);
//
//    /**
//     * Get personal user settings.
//     * @param {!function(Array.<Object>)} callback A callback to pass the loaded settings.
//     */
//    services.getPersonalSettings = services.requestFactory('settings/GetPersonalSettings', {}, false);
//
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

//    /**
//     * Get business settings
//     * @param roleId The role to get the business settings for
//     */
//    services.getBusinessSettings = services.requestFactory('settings/GetBusinessSettings', {}, false);

    /**
     * Updates businesssettings.
     * @param {(Array.<Object>)} settings The updated settings.
     */
    services.updateBusinessSettings = function (settings) {
        return saveHistory.linkNotification(
            $.ajax({
                url: services.API_URL + "settings/UpdateBusinessSettings?roleId=" + roleId,
                type: "POST",
                dataType: "json",
                contentType: 'application/json',
                data: JSON.stringify(settings)
            })
        );
    };

    /**
     * Updates personal user settings.
     * @param {!function(Array.<Object>)} settings The loaded settings.
     */
    services.updatePersonalSettings = function (settings) {
        return saveHistory.linkNotification(
            $.ajax({
                url: services.API_URL + "settings/UpdatePersonalSettings?roleId=" + roleId,
                type: "POST",
                dataType: "json",
                contentType: 'application/json',
                data: JSON.stringify(settings)
            })
        );
    };

    //  services.getTimeZones = services.requestFactory('settings/GetTimeZones', {}, false);

    //endregion

    services.updateRouteTask = function (task) {
        return saveHistory.linkNotification(
            $.ajax({
                url: services.API_URL + "routes/UpdateRouteTask",
                type: "POST",
                dataType: "json",
                contentType: 'application/json',
                data: JSON.stringify(task)
            })
        );
    };

    //endregion

    //region User

    /**
     * Authenticate the user.
     * @param {!string} email
     * @param {!string} password
     * @param {!function(boolean)} callback The callback to pass true (success) or false (failed) to after attempting to authenticate the credentials.
     */
    services.authenticate = function (email, password, callback) {
        return services.requestFactory('session/Login', {email: email, pass: password}, true, null)(callback);
    };

    services.logout = function (callback) {
        return services.requestFactory('session/LogOut')(callback);
    };

    //endregion

    services.trackError = function (error) {
        error.Url = document.URL;

        $.ajax({
            url: services.API_URL + "Error/Track",
            type: "POST",
            dataType: "json",
            contentType: 'application/json',
            data: JSON.stringify(error)
        });
    };

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

    return {
        /**
         * The url for the API.
         * @type {string}
         * @const
         */
        API_URL: apiUrl,
        ROOT_API_URL: apiUrl.replace("api/", ""),

        //the load functions
        load: load,

        /**
         * Enum for loading statuses.
         * @enum {number}
         */
        Status: {
            LOADING: 0,
            LOADED: 1
        },

        hookupDefaultComplete: hookupDefaultComplete,

        setRoleId: setRoleId
    };
});