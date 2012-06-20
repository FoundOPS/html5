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
require(["jquery", "lib/kendo.all.min", "lib/csv"], function ($, m, csv) {
    var upload = {};
    var grid = {};
    var preview = {};
    var app;

    //Start the application
    app = new kendo.mobile.Application($(document.body), {initial: "views/importerUpload.html"});

//region Importer
    upload.initialize = function () {
//        var settings = {
//            upload_url: "http://www.swfupload.org/upload.php",
//            flash_url: "lib/swfupload.swf",
//
//            //Button settings
//            button_placeholder_id: "spanButtonPlaceHolder",
//            button_image_url: "img/upload.png",
//            button_width: "61",
//            button_height: "22",
//            button_text_left_padding: 12,
//            button_text_top_padding: 3,
//
//            file_size_limit: "2 MB",
//            file_types: "*.csv",
//            file_types_description: "CSV Files",
//            file_upload_limit: 1,
//            file_queue_limit: 1,
//            custom_settings: {
//                progressTarget: "fsUploadProgress",
//                cancelButtonId: "btnCancel"
//            },
//            debug: true,
//
//
//            // The event handler functions are defined in handlers.js
//            file_queued_handler: fileQueued,
//            file_queue_error_handler: fileQueueError,
//            file_dialog_complete_handler: fileDialogComplete,
//            upload_start_handler: uploadStart,
//            upload_progress_handler: uploadProgress,
//            upload_error_handler: uploadError,
//            upload_success_handler: uploadSuccess,
//            upload_complete_handler: uploadComplete,
//            queue_complete_handler: queueComplete    // Queue plugin event
//        };
//
//        var swfu = new SWFUpload(settings);

        //create DropDownList from input HTML element
        $("#serviceType").kendoDropDownList({
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: {
                type: "odata",
                serverFiltering: false,
                filter: [{
                    field: "Name",
                    operator: "contains",
                    value: "Star Wars"
                },{
                    field: "BoxArt.SmallUrl",
                    operator: "neq",
                    value: null
                }],
                transport: {
                    read: "http://odata.netflix.com/Catalog/Titles"
                }
            },
            change: onChange
        });

        //get a reference to the DropDownList
        var color = $("#serviceType").data("kendoDropDownList");
        color.select(0);

        function onChange() {
        };
    };

    window.upload = upload;

    //var parsedCsv = csv.parse();
//endregion

//region Grid
    grid.initialize = function () {
        var data = [{header: "Client Name", value: "Meyer", name: ""},
            {header: "Phone", value: "123-456-7890", name: ""}]

        $("#fields").kendoGrid({
            dataSource: data,
            schema: {
                model: {
                    id: "header",
                    fields: {
                        header: { editable: false},
                        value: { editable: false},
                        name: { editable: true}
                    }
                }
            },
            columns: [
                {
                    field: "header",
                    title: "Row 1"
                },
                {
                    field: "value",
                    title: "Row 2"
                },
                {
                    field: "name",
                    title: " ",
                    editor: categoryDropDownEditor
                }],
            scrollable: true
        });
    }

    function categoryDropDownEditor(container, options) {
        $('<input data-text-field="CategoryName" data-value-field="CategoryName" data-bind="value:' + options.field + '"/>')
            .appendTo(container)
            .kendoDropDownList({
                autoBind: false,
                dataSource: {
                    type: "odata",
                    transport: {
                        read: "http://demos.kendoui.com/service/Northwind.svc/Categories"
                    }
                }
            });
    }

    window.grid = grid;
    //endregion

//region Review

    preview.initialize = function () {
    }

    window.preview = preview;

    upload.go = function () {
        app.navigate("views/importerUpload.html");
    };

    grid.go = function () {
        app.navigate("views/importerGrid.html");
    };

    preview.go = function () {
        app.navigate("views/importerPreview.html");
    };
//endregion
});