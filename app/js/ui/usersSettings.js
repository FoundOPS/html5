// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services"], function (developer, services) {
    var usersSettings = {};

    //region Locals
    var grid;
    //keep track of the business account id to be used for new items
    var id;
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
//                destroy: {
//                    url: services.API_URL + "settings/InsertUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
//                    type: "POST"
//                },
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

        $("#usersGrid").kendoGrid({
            dataSource: dataSource,
            dataBound: onDataBound,
            editable: "popup",
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
                    field: "Role",
                    editor: roleDropDownEditor
                }
            ],
            //called when the grid detects changes to the data
            save: function () {
                //hide the save and cencel buttons
                hideOrShowSaveCancel(true);
            },
            //called when the changes are synced with the served
            saveChanges: function () {
                //show the save and cencel buttons
                hideOrShowSaveCancel(false);
            },
            //called when a row it removed from the grid
            remove: function () {
                //hide the save and cencel buttons
                hideOrShowSaveCancel(true);
            },
            // The command buttons above the grid
            toolbar: [
                {
                    name: "save",
                    text: "Save Changes"
                },
                {
                    name: "cancel",
                    text: "Cancel Changes"
                },
                {
                    name: "edit"
                },
                {
                    name: "destroy",
                    // Use a template so "removeSelectedRow()" can be called
                    template: "<a class='k-button k-button-icontext k-grid-delete' onclick='removeSelectedRow()'><span class='k-icon k-delete'></span>Delete</a>"
                }
            ]
        });
        //endregion

        //edit the selected row on edit button click
        $(".k-grid-edit").click(function () {
            editSelectedRow();
        });

        function roleDropDownEditor(container, options) {
            $('<input data-text-field="CategoryName" data-value-field="CategoryName" data-bind="value:' + options.field + '"/>')
                .appendTo(container)
                .kendoDropDownList({
                    autoBind: false,
                    dataSource: [{text:"Administrator"},{text:"Mobile"}]
                });
        }

        $("#addUser").on("click", function(e) {
            var dataSrc = $("#usersGrid").data("kendoGrid").dataSource;

            var window = $("<div id='popupEditor'>")
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
            kendo.bind(window.element, model);
            //initialize the validator
            var validator = $(window.element).kendoValidator().data("kendoValidator")

            $("#btnUpdate").on("click", function(e) {
                if (validator.validate()) {
                    dataSrc.sync(); //sync changes
                    window.close();
                    window.element.remove();
                }
            });

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
        //get the BusinessAccountId from another row to be used to set in new rows
        id = grid._data[1].Id;
        //bind to the selection change event
        grid.bind("change", function () {
            hideOrShowDeleteBtn();
            selectedItem = grid.dataItem(grid.select());
        });
        //detect cancel button click
        $(".k-grid-cancel-changes").click(function () {
            //hide save and cancel buttons
            hideOrShowSaveCancel(false);
            //hide the delete button(there isn't a selected row after cancel is clicked)
            $('.k-grid-delete').css('display', "none");
            grid.dataSource.read();
        });
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

    //hide the delete button if a default row is selected, otherwise show it
    var hideOrShowDeleteBtn = function () {
        $('.k-grid-delete').css('display', "inline-block");
        $('.k-grid-edit').css('display', "inline-block");
    };

    /**
     * Show the save button only if there are changes
     * @param {boolean} hasChanges
     */
    var hideOrShowSaveCancel = function (hasChanges) {
        if (hasChanges) {
            $('.k-grid-save-changes').css('display', "inline-block");
            $('.k-grid-cancel-changes').css('display', "inline-block");
        } else {
            $('.k-grid-save-changes').css('display', "none");
            $('.k-grid-cancel-changes').css('display', "none");
        }
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