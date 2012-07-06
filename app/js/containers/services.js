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

require(["jquery", "lib/kendo.all.min", "developer", "db/services", "lib/moment"], function ($, k, developer, dbServices, m) {
    var services = {};

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;

    //initialize servicesDataSource

    services.initialize = function () {

//        var columns = [
//            { title: "Occur Date", field: "OccurDate", format: "{0:dd/MMMM/yyyy}" },
//            { title: "Client Name", field: "ClientName" },
//            { title: "Oil Collected", field: "Oil_Collected" },
//            { title: "Service Destination", field: "Service_Destination" },
//            { title: "Hose Length", field: "Hose_Length" },
//            { title: "Notes", field: "Notes" }
//        ];

        $("#grid").kendoGrid({
            autoBind: false,
//            columns: columns,
            dataSource: dbServices.servicesDataSource.value(),
            filterable: true,
            sortable: true,
            selectable: true,
            scrollable: true
        });

        var startDatePicker = $("#startDatePicker");
        var endDatePicker = $("#endDatePicker");

        var updateDateRange = function () {
            var startDate = startDatePicker.data("kendoDatePicker").value();
            var endDate = endDatePicker.data("kendoDatePicker").value();
            dbServices.servicesDataSource.setDateRange(startDate, endDate);
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

    //for debugging
    dbServices.setRoleId(developer.GOTGREASE_ROLE_ID);

    //Start the mobile application - must be at the bottom of the code.
    var app = new kendo.mobile.Application($(document.body));
});