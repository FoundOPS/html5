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
            apiUrl = "http://192.168.0.108:70/api/"; // Local IP of host computer (might change everyday).
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
                    parameters.roleId.changed.add(function (roleId) {
                        config.params.roleId = roleId;
                        deferredRequest.resolve(config);
                    });

                    return promise;
                }

                config.params.roleId = roleId;
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
        taskStatuses: {},
        timeZones: {},
        userAccounts: {
            read: {},
            insert: {},
            update: {},
            delete: {}
        }
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

    return dbServices;
});