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

//"lib/swfupload",
require(["jquery", "lib/kendo.all.min", "lib/jquery-ui-1.8.21.core.min", "lib/jquery.FileReader",
    "ui/importerUpload", "ui/importerSelect", "ui/importerReview"], function ($, m, jqu, f, upload, select, review) {
    var app;
    var importer = {};

    importer.import = function () {

    }

    //setup breadcrumbs
    var li = $('#crumbs')[0].children;
    importer.upload = function () {
        app.navigate("views/importerUpload.html");
        li[1].classList.remove('active');
        li[2].classList.remove('active');
        li[0].classList.add('active');
    };

    importer.select = function () {
        app.navigate("views/importerSelect.html");
        li[0].classList.remove('active');
        li[2].classList.remove('active');
        li[1].classList.add('active');
    };

    importer.review = function () {
        app.navigate("views/importerReview.html");
        li[0].classList.remove('active');
        li[1].classList.remove('active');
        li[2].classList.add('active');
    };

    window.importer = importer;

    //Start the application
    app = new kendo.mobile.Application($(document.body), {initial: "views/importerUpload.html"});
});