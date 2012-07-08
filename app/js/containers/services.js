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

require(["jquery", "lib/kendo.all.min", "developer", "db/services", "tools", "lib/moment"], function ($, k, developer, dbServices, tools, m) {
    var services = {};

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;

    services.initialize = function () {
        var setupGrid = function (dataSource, fields) {
            services.dataSource = dataSource;

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

                columns.push(column);
            });

            $("#grid").kendoGrid({
                autoBind: true,
                columns: columns,
                dataSource: dataSource,
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

            dbServices.servicesDataSource(startDate, endDate, setupGrid);
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
    };

    services.exportToCSV = function () {
        tools.toCSV(services.dataSource.view(), "Services", true, ['RecurringServiceId', 'ServiceId']);
    };

    //for debugging
    dbServices.setRoleId(developer.GOTGREASE_ROLE_ID);

    //Start the mobile application - must be at the bottom of the code.
    var app = new kendo.mobile.Application($(document.body));
});