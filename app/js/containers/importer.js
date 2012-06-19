// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold importer logic.
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

        // Libraries
        underscore: "../lib/underscore"
    },
    shim: {
        underscore: {
            exports: '_'
        }
    }
});

require(["jquery", "lib/kendo.all.min", "lib/csv"], function ($, m, csv) {
    var importer = {};
    var app;

    //Start the application
    app = new kendo.mobile.Application($(document.body), {initial: "views/importerUpload.html"});

    var parsedCsv = csv.parse();
});