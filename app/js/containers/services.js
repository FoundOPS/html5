// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold mobile models/logic.
 */

'use strict';

require.config({
    waitSeconds: 10,
    baseUrl: 'js',
    paths: {
        // JavaScript folders
        lib: "../lib",
        ui: "ui",
        db: "db",

        underscore: "../lib/underscore"
    },
    shim: {
        underscore: {
            exports: "_"
        }
    }
});

require(["jquery", "underscore", "lib/kendo.all.min", "developer", "db/services", "tools", "lib/moment"], function ($, _, k, developer, dbServices, tools) {
    var services = {}, serviceHoldersDataSource;

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;

    services.viewModel = kendo.observable({});

    /**
     * A kendo data source for Services for the current business account.
     * It is initialized every time the data is loaded because the data schema is dynamic
     * and kendo datasource does not allow you to change the schema.
     * @param {Date} startDate The first date to load services for
     * @param {Date} endDate The last date to load services for
     * @param {!function(kendo.data.DataSource, Array.<Object>, Array.<Object>} callback When the data is loaded it will call
     * this function and pass 3 parameters: the datasource, the fields, and the formatted data
     */
    var getDataSource = function (startDate, endDate, callback) {
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
            serviceHoldersDataSource = new kendo.data.DataSource({
                data: formattedData,
                schema: {
                    model: {
                        id: "ServiceId",
                        fields: fields
                    }
                }
            });

            serviceHoldersDataSource.sort({ field: "OccurDate", dir: "asc" });

            callback(fields, formattedData);
        };

        dbServices._getHttp("service/GetServicesHoldersWithFields", {startDate: tools.formatDate(startDate), endDate: tools.formatDate(endDate)}, false)(formatResponse);
    };

    services.initialize = function () {
        var resizeGrid = function () {
            var windowHeight = $(window).height();
            var topHeight = $('#top').outerHeight(true);
            var contentHeight = windowHeight - topHeight;
            $('#grid').css("height", contentHeight + 'px');

            var gridPagerHeight = $('.k-grid-pager').outerHeight(true);
            var gridHeaderHeight = $('.t-grid-header').outerHeight(true);
            var tableContentHeight = contentHeight - (gridPagerHeight + gridHeaderHeight);
            $('#grid .k-grid-content').css("height", tableContentHeight + 'px');
        };
        var setupGrid = function (fields) {
            //Setup the columns based on the fields
            var columns = [];
            _.each(fields, function (value, key) {
                if (value.hidden) {
                    return;
                }

                var column = {};

                //replace _ with spaces, and insert a space before each capital letter
                column.title = key.split('_').join(' ').replace(/([A-Z])/g, ' $1');

                column.field = key;
                column.type = value.type;
                if (column.type === "number") {
                    column.template = "#= (" + key + "== null) ? ' ' : " + key + " #";
                } else if (column.type === "date") {
                    column.template = '#= kendo.toString(' + key + ', "dd MMMM yyyy") #';
                }

                //TODO calculate width based on title
                column.width = "110px";

                columns.push(column);
            });

            $("#grid").kendoGrid({
                autoBind: true,
                change: function (e) {
                    var selectedItem = this.dataItem(this.select());
                    //Load the service details, and update the view model
                    dbServices.getServiceDetails(selectedItem.ServiceId, selectedItem.OccurDate, selectedItem.RecurringServiceId, function (service) {
                        services.viewModel.set("selectedService", service);
                    });
                },
                columns: columns,
                dataSource: serviceHoldersDataSource,
                filterable: true,
                sortable: {
                    mode: "multiple"
                },
                selectable: true,
                scrollable: true
            });
        };

        var startDatePicker = $("#startDatePicker");
        var endDatePicker = $("#endDatePicker");

        var updateDateRange = function () {
            var startDate = startDatePicker.data("kendoDatePicker").value();
            var endDate = endDatePicker.data("kendoDatePicker").value();

            getDataSource(startDate, endDate, setupGrid);
        };

        startDatePicker.kendoDatePicker({
            value: moment().subtract('weeks', 2).toDate(),
            min: new Date(1950, 0, 1),
            max: new Date(2049, 11, 31),
            change: updateDateRange
        });
        endDatePicker.kendoDatePicker({
            value: moment().add('weeks', 2).toDate(),
            min: new Date(1950, 0, 1),
            max: new Date(2049, 11, 31),
            change: updateDateRange
        });

        //Start loading the initial services
        updateDateRange();

        $(window).resize(function () {
            resizeGrid();
        });

        resizeGrid();
    };

    services.exportToCSV = function () {
        tools.toCSV(serviceHoldersDataSource.view(), "Services", true, ['RecurringServiceId', 'ServiceId']);
    };
});