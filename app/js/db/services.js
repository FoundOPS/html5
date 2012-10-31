//Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold data services.
 */

'use strict';

define(["developer", "tools/dateTools", "db/saveHistory", "tools/parameters"], function (developer, dateTools, saveHistory, parameters) {
    var rootApiUrl, apiUrl, dbServices;

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
            rootApiUrl = 'http://localhost:9711/';
        } else if (mode === developer.DataSource.ANDROID_EMULATOR_LOCALAPI) {
            rootApiUrl = 'http://10.0.2.2:9711/';
        } else if (mode === developer.DataSource.LIVE) {
            rootApiUrl = 'http://api.foundops.com/';
        } else if (mode === developer.DataSource.REMOTE_API) {
            rootApiUrl = "http://192.168.0.100:70/"; // Local IP of host computer (might change everyday).
        } else if (mode === developer.DataSource.TESTAPI) {
            rootApiUrl = 'http://testapi.foundops.com/';
        }
        apiUrl = rootApiUrl + "api/";
    })();

    /**
     * Hookup to DataSources Create, Update, Delete complete functions:
     * 1) provide notifications for failure and success
     * 2) reload the data
     * @param dataSource
     * @param {{create, create, update, delete}=} options
     * Each property has an optional record {{done, fail}=} for functions to be triggered
     */
    var hookupDefaultComplete = function (dataSource, options) {
        /**
         * @param {{done, fail}=} completeOptions
         * @return {Function} A function to trigger on complete
         */
        var onComplete = function (completeOptions) {
            if (!completeOptions) {
                completeOptions = {};
            }

            return function (jqXHR, textStatus) {
                if (textStatus === "success") {
                    saveHistory.success();

                    if (completeOptions.done) {
                        completeOptions.done();
                    }
                } else {
                    dataSource.cancelChanges();
                    saveHistory.error(jqXHR.statusText);

                    if (completeOptions.fail) {
                        completeOptions.fail();
                    }
                }
            };
        };

        if (!options) {
            options = {};
        }

        dataSource.transport.options.create.complete = onComplete(options.create);
        dataSource.transport.options.update.complete = onComplete(options.update);
        dataSource.transport.options.destroy.complete = onComplete(options.destroy);
    };


    /**
     * Creates the default parameter map  for a datasource
     * @param entityName
     * @return {Function}
     */
    var parameterMap = function () {
        return function (options) {
            if (_.any(_.keys(options))) {
                return JSON.stringify(options);
            }
            return "";
        };
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
         * @param {{params, body, excludeRoleId}} optional Overwrite config properties, except params will be added to default params
         * params Additional parameters
         * body Data for the body. It will be serialized as JSON
         * excludeRoleId For overwriting the default property
         */
        return function (optional) {
            config.params = config.params || {};
            //add any additional parameters
            if (optional) {
                if (optional.params) {
                    config.params = _.extend(config.params, optional.params);
                }
                if (optional.excludeRoleId) {
                    config.excludeRoleId = optional.excludeRoleId
                }
                if (optional.body) {
                    config.body = optional.body;
                }
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
                if (input.body) {
                    options.data = JSON.stringify(input.body);
                }

                if (input.headers) {
                    options.headers = input.headers;
                }

                var ajax = $.ajax(options);

                //link up save notifications on everything except GET and where they are disabled
                if (options.type === "GET" || input.disableNotifications) {
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

    //the entity's read, create, update and destroy ajax configurations
    var entityConfig = {
        businessAccounts: {
            //used in business settings
            read: {},
            update: {}
        },
        columnConfigurations: {
            read: {},
            update: {disableNotifications: true}
        },
        employees: {},
        errors: {
            create: {}
        },
        locations: {},
        routeTasks: {
            update: {}
        },
        resourceWithLastPoints: {},
        routes: {},
        services: {
            parse: function (service) {
                //converts the service's Field's DateTime values to dates (there is only one right now)
                service.ServiceDate = moment(service.ServiceDate).toDate();
            },
            read: {},
            update: {},
            destroy: {}
        },
        serviceHolders: {},
        serviceTemplates: {},
        sessions: {
            params: {isMobile: developer.IS_MOBILE},
            excludeRoleId: true,
            headers: {"ops-details": "true"}
        },
        taskStatuses: {},
        trackPoints: {
            read: {},
            create: {disableNotifications: true}
        },
        timeZones: {excludeRoleId: true},
        userAccounts: {
            //used in personal settings
            read: {},
            update: {}
            //used in users settings with datasource
            //insert, destroy (and read, update)
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
        ROOT_API_URL: rootApiUrl,

        /**
         * Enum for loading statuses.
         * @enum {number}
         */
        Status: {
            LOADING: 0,
            LOADED: 1
        },

        hookupDefaultComplete: hookupDefaultComplete,
        parameterMap: parameterMap
    };
    //construct public entity objects with functions for read/create/update/destroy from entityConfig
    _.each(entityConfig, function (value, key) {
        var functions = {};

        //before creating the request factories, set the query to the name of the entity
        if (value.read || value.create || value.update || value.destroy) {
            if (value.parse) {
                functions.parse = value.parse;
            }

            if (value.read) {
                value.read.query = key;
                functions.read = requestFactory(value.read);
            }
            if (value.create) {
                value.create.query = key;
                value.create.type = "POST";
                functions.create = requestFactory(value.create);
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