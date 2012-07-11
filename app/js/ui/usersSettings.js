// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services"], function (developer, services) {
    var usersSettings = {};

    //region Locals
    var grid;
    //keep track of the last selected item, for color selector
    var selectedItem;
    //endregion

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

        //add a grid to the #usersGrid div element
        $("#usersGrid").kendoGrid({
            dataSource: dataSource,
            dataBound: onDataBound,
            editable: {
                mode: "popup",
                template: $("#editTemplate").html(),
                confirmation: "Are you sure you want to delete this user?"
            },
            scrollable:false,
            selectable: true,
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
                }
            ],
            // The command buttons above the grid
            toolbar: [
                {
                    name: "edit"
                },
                {
                    name: "destroy"
                }
            ]
        });
        //endregion

        $(".k-grid-edit").removeAttr("href");
        $(".k-grid-delete").removeAttr("href");

        //edit the selected row on edit button click
        $(".k-grid-edit").click(function () {
            editSelectedRow();
        });

        //delete the selected row on delete button click
        $(".k-grid-delete").click(function () {
            removeSelectedRow();
        });

        $("#addUser").on("click", function(e) {
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

            $("#btnAdd").on("click", function(e) {
                if (validator.validate()) {
                    dataSrc.sync(); //sync changes
                    object.close();
                    object.element.remove();
                }
            });

            $("#btnAdd")[0].innerText = ("Send Invite Email");

            $("#btnCancel").on("click", function(e) {
                dataSrc.cancelChanges(model); //cancel changes
                window.close();
                window.element.remove();
            });
        });
    };

    //region Methods
    //after the data is loaded, assign the color picker to each of the current color boxes
    var onDataBound = function () {
        //get a reference to the grid widget
        grid = $("#usersGrid").data("kendoGrid");
    };

    //removes the selected row from the grid(stays in pending changes until changes are saved)
    var editSelectedRow = function () {
        //get selected row
        var row = getSelectedRow(grid);
        //remove selected row
        grid.editRow(row);
    };

    //removes the selected row from the grid(stays in pending changes until changes are saved)
    var removeSelectedRow = function () {
        //get selected row
        var row = getSelectedRow(grid);
        //remove selected row
        grid.removeRow(row);
    };

    /**
     * Gets the selected row
     * @param {object} g The grid
     * @return {object}
     */
    var getSelectedRow = function (g) {
        return g.tbody.find(".k-state-selected");
    };
    //endregion

    window.usersSettings = usersSettings;

    return usersSettings;
});