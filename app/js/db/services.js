//region Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

'use strict';

define(['lib/kendo.mobile.min', 'developer', 'tools'], function (k, developer, tools) {
    var services = {};

    /**
     * Enum for loading statuses.
     * @enum {number}
     */
    services.Status = {
        LOADING: 0,
        LOADED: 1
    };

    var apiUrl;
//setup the api url depending on the mode
    var mode = developer.CURRENT_DATA_SOURCE;
    if (mode === developer.DataSource.LOCALAPI) {
        apiUrl = 'http://localhost:9711/api/';
    } else if (mode === developer.DataSource.ANDROIDLA) {
        apiUrl = 'http://10.0.2.2:9711/api/';
    } else if (mode === developer.DataSource.LIVE) {
        apiUrl = 'http://api.foundops.com/api/';
    } else if (mode === developer.DataSource.TESTAPI) {
        apiUrl = 'http://testapi.foundops.com/api/';
    }

    /**
     * The url for the API.
     * @type {string}
     * @const
     */
    services.API_URL = apiUrl;

    /**
     * Set the current RoleId.
     * @param {string} The roleId.
     */
    services.setRoleId = function (roleId) {
        services.RoleId = roleId;
    };

    /**
     * Returns a standard http get.
     * @param {String} queryString The query string to use. Ex. "routes/GetDepots"
     * @param {Object.<string|Object>=}  opt_params The parameters to use (optional).
     * @param {boolean=} opt_excludeRoleId Do not include the roleId in the params (optional).
     * @return {function(!function(Object))} A function to perform the get and invoke the callback.
     * @private
     */
    services._getHttp = function (queryString, opt_params, opt_excludeRoleId) {
        /**
         * A function to perform the get operation on the api (defined by the parameters above)
         * and invoke the callback with the loaded data.
         * @param {!function(Object)} callback A callback to pass the loaded data to.
         */
        var getThenInvokeCallback = function (callback) {
            var params = opt_params || {};

            //if opt_excludeRoleId was not set or true and the RoleId exists add it as a parameter
            if (!opt_excludeRoleId && services.RoleId) {
                params.roleId = services.RoleId.toString();
            }

            var url = services.API_URL + queryString;

            $.ajax({
                //must use JSONP because the javascript may be hosted on a different url than the api
                type: "GET",
                dataType: 'JSONP',
                url: url,
                data: params
            })
                //perform the callback function by passing the response data
                .success(callback);
        };

        return getThenInvokeCallback;
    };

    /**
     * Get the current service provider's Routes.
     * @param {string} serviceDateUtc The service date to get routes for (in Utc).
     * @param {!function(Array.<Object>)} callback A callback to pass the loaded routes to.
     */
    services.getRoutes = function (serviceDateUtc, callback) {
        return services._getHttp('routes/GetRoutes', {serviceDateUtc: serviceDateUtc}, false)(callback);
    };

    /**
     * A kendo data source for Routes for the current user's routes.
     * @type {kendo.data.DataSource}
     */
    services.routesDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                //Get the routes based on the phone's date for today
                url: services.API_URL + "routes/GetRoutes?serviceDateUtc=" + tools.formatDate(new Date()),
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8"
            }
        }
    });

    /**
     * A kendo data source for Services for the current business account.
     * It is initialized every time the data is loaded because the data schema is dynamic
     * and kendo datasource does not allow you to change the schema.
     * @param {Date} startDate The first date to load services for
     * @param {Date} endDate The last date to load services for
     * @param {!function(kendo.data.DataSource, Array.<Object>, Array.<Object>} callback When the data is loaded it will call
     * this function and pass 3 parameters: the datasource, the fields, and the formatted data
     */
    services.servicesDataSource = function (startDate, endDate, callback) {
        var formatResponse = function (data) {
            //The types will be returned in the first row
            var types = _.first(data);

            //Setup the data source fields info
            var fields = {};
            _.each(types, function (type, name) {
                //Example ShipCity: { type: "string" }
                var field = {};
                var jType;
                if (type === "System.Decimal") {
                    jType = "number";
                } else if (type === "System.DateTime") {
                    jType = "date";
                } else if (type === "System.String" || type === "System.Guid") {
                    jType = "string";
                } else {
                    return;
                }
                var fieldValues = {type: jType, defaultValue: ""};

                if (type === "System.Guid") {
                    fieldValues.hidden = true;
                }

                //Add the type to fields
                fields[name] = fieldValues;
            });

            //format the data
            var formattedData = [];
            //exclude the type data in the first row
            _.each(_.rest(data), function (row) {
                var formattedRow = {};
                //go through each field type, and convert the data to the proper type
                _.each(fields, function (value, key) {
                    var originalValue = row[key];
                    var convertedValue;
                    if (originalValue === null) {
                        convertedValue = "";
                    } else if (value.type === "number") {
                        convertedValue = parseFloat(originalValue);
                    } else if (value.type === "date") {
                        convertedValue = new Date(originalValue);
                    } else if (value.type === "string") {
                        convertedValue = originalValue.toString();
                    } else {
                        return;
                    }

                    formattedRow[key] = convertedValue;
                });

                formattedData.push(formattedRow);
            });

            //Setup the datasource
            var dataSource = new kendo.data.DataSource({
                data: formattedData,
                schema: {
                    model: {
                        id: "ServiceId",
                        fields: fields
                    }
                }
            });

            dataSource.sort({ field: "OccurDate", dir: "asc" });

            callback(dataSource, fields, formattedData);
        };

        services._getHttp("service/GetServicesHoldersWithFields", {startDate: tools.formatDate(startDate), endDate: tools.formatDate(endDate)}, false)(formatResponse);
    };

    /**
     * Get the service provider's depots.
     * @param {!function(Array.<Object>)} callback A callback to pass the loaded depots.
     */
    services.getDepots = services._getHttp('routes/GetDepots', {}, false);

    /**
     * Get resources (Employees/Vehicles) and their last recorded location.
     * @param {!function(Array.<Object>)} callback The callback to pass the resources with latest points after they are loaded.
     */
    services.getResourcesWithLatestPoints = services._getHttp('trackpoint/GetResourcesWithLatestPoints', {}, false);

    /**
     * Get the service and its fields.
     * Need to pass the serviceId or the occurDate and the recurringServiceId.
     * @param {?string} serviceId
     * @param {?string} serviceDate
     * @param {?string} recurringServiceId
     * @param {!function(Object)} callback The callback to pass the Service it is loaded.
     */
    services.getServiceDetails = function (serviceId, serviceDate, recurringServiceId, callback) {
        return services._getHttp('service/GetServiceDetails',
            {serviceId: serviceId, serviceDate: serviceDate, recurringServiceId: recurringServiceId}, false)(function (data) {
            //It will only have one item
            callback(data[0]);
        });
    };

    /**
     * Get the service provider's TrackPoints.
     * @param {string} serviceDate The service date to retrieve TrackPoints for (in Utc).
     * @param {string} routeId The Id of the route to retrieve TrackPoints for.
     * @param {!function(Array.<Object>)} callback The callback to pass the TrackPoints to after they are loaded.
     */
    services.getTrackPoints = function (serviceDateUtc, routeId, callback) {
        return services._getHttp('trackPoint/GetTrackPoints',
            {routeId: routeId, serviceDateUtc: serviceDateUtc}, false)(callback);
    };

    /**
     * Send trackPoint array to server and return success or failure to the callback
     * @param {Array.<models.TrackPoint>} trackPoints
     * @param routeId
     * @param callback
     */
    services.postTrackPoints = function (trackPoints, callback) {
        $.ajax({
            url: services.API_URL + "trackpoint/PostEmployeeTrackPoint",
            type: "POST",
            dataType: "json",
            contentType: 'application/json',
            data: JSON.stringify(trackPoints)
        }).success(function (response) {
                callback(response);
            });
    };

    /**
     * Authenticate the user.
     * @param {!string} email
     * @param {!string} password
     * @param {!function(boolean)} callback The callback to pass true (success) or false (failed) to after attempting to authenticate the credentials.
     */
    services.authenticate = function (email, password, callback) {
        return services._getHttp('auth/Login', {email: email, pass: password}, true, null)(callback);
    };

    services.logout = function (callback) {
        return services._getHttp('auth/LogOut')(callback);
    };

    return services;
});