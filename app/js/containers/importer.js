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
    "ui/importerUpload", "ui/importerSelect", "ui/importerReview", "lib/userVoice"], function ($, m, jqu, f, upload, select, review, userVoice) {
    var app;
    var importer = {};

    importer.import = function () {

    }

    //open and close the uservoice widget
    importer.userVoiceOpen = function (){
        userVoice.showPopupWidget();
    };
    importer.userVoiceClose = function (){
        userVoice.hidePopupWidget();
    };

    //setup breadcrumbs
    var li1 = $('#crumbs li:nth-child(1)');
    var li2 = $('#crumbs li:nth-child(2)');
    var li3 = $('#crumbs li:nth-child(3)');
    importer.upload = function () {
        app.navigate("views/importerUpload.html");
        li2.removeClass('active');
        li3.removeClass('active');
        li1.addClass('active');
        li2.unbind('click');
    };

    importer.select = function () {
        app.navigate("views/importerSelect.html");
        li1.removeClass('active');
        li3.removeClass('active');
        li2.addClass('active');
        li2.unbind('click');
    };

    importer.review = function () {
        app.navigate("views/importerReview.html");
        li1.removeClass('active');
        li2.removeClass('active');
        li3.addClass('active');
        li2.on('click', function(){
            importer.select();
        });
    };

    window.importer = importer;

    //Start the application
    app = new kendo.mobile.Application($(document.body), {initial: "views/importerUpload.html"});
});