// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services"], function (developer, services) {
    var usersSettings = {};

    usersSettings.initialize = function () {
        //region Setup Grid
        var dataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: services.API_URL + "settings/GetAllUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "GET",
                    dataType: "jsonp",
                    contentType: "application/json; charset=utf-8"
                },
                update: {
                    url: services.API_URL + "settings/UpdateUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST"
                },
                destroy: {
                    url: services.API_URL + "settings/DeleteUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST"
                },
                create: {
                    url: services.API_URL + "settings/InsertUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST"
                }
            },
            schema: {
                model: {
                    // Necessary for inline editing to work
                    id: "Id",
                    fields: {
                        FirstName: {
                            type: "string",
                            validation: { required: true },
                            defaultValue: ""
                        },
                        LastName: {
                            type: "string",
                            validation: { required: true },
                            defaultValue: ""
                        },
                        EmailAddress: {
                            type: "string",
                            validation: { required: true },
                            defaultValue: ""
                        },
                        Role: {
                            type: "string",
                            validation: { required: true },
                            defaultValue: ""
                        }
                    }
                }
            }
        });

        var dataSource2 = [
            {FirstName: "Oren", LastName: "Shatken", EmailAddress: "oshatken@foundops.com", Role: "Administrator"},
            {FirstName: "Jon", LastName: "Perl", EmailAddress: "jperl@foundops.com", Role: "Mobile"},
            {FirstName: "Zach", LastName: "Bright", EmailAddress: "zbright@foundops.com", Role: "Administrator"}
        ];

        //add a grid to the #usersGrid div element
        $("#usersGrid").kendoGrid({
            dataSource: dataSource2,
            dataBound: onDataBound,
            editable: {
                mode: "popup",
                template: $("#editTemplate").html(),
                confirmation: "Are you sure you want to delete this user?"
            },
            scrollable:false,
            sortable: true,
            columns: [{
                    field: "FirstName",
                    title: "First Name"
                },
                {
                    field: "LastName",
                    title: "Last Name"
                },
                {
                    field: "EmailAddress",
                    title: "Email"
                },
                {
                    field: "Role"
                },
                {
                    command: ["edit", "destroy"],
                    width: "80px"
                }
            ]
        });
        //endregion

        $("#addUser").on("click", function() {
            var dataSrc = $("#usersGrid").data("kendoGrid").dataSource;

            var object = $("<div id='popupEditor'>")
                .appendTo($("body"))
                .kendoWindow({
                    title: "Add New User",
                    modal: true,
                    content: {
                        //sets window template
                        template: kendo.template($("#createTemplate").html())
                    }
                })
                .data("kendoWindow")
                .center();

            //determines at what position to insert the record (needed for pageable grids)
            var index = dataSrc.indexOf((dataSrc.view() || [])[0]);

            if (index < 0) {
                index = 0;
            }
            //insets a new model in the dataSource
            var model = dataSrc.insert(index, {});
            //binds the editing window to the form
            kendo.bind(object.element, model);
            //set the default role
            model.Role = "Administrator";
            //initialize the validator
            var validator = $(object.element).kendoValidator().data("kendoValidator");

            $("#btnAdd").on("click", function() {
                if (validator.validate()) {
                    dataSrc.sync(); //sync changes
                    object.close();
                    object.element.remove();
                }
            });

            $("#btnAdd")[0].innerText = ("Send Invite Email");

            $("#btnCancel").on("click", function() {
                dataSrc.cancelChanges(model); //cancel changes
                object.close();
                object.element.remove();
            });
        });
    };

    //region Methods
    //after the data is loaded, add tooltips to the edit and delete buttons
    var onDataBound = function () {
        $(".k-grid-edit").each(function(){
            $(this).attr("title", "Edit");
        });
        $(".k-grid-delete").each(function(){
            $(this).attr("title", "Delete");
        });
    };
    //endregion

    window.usersSettings = usersSettings;
});