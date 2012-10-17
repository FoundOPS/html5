// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold dispatcher settings logic.
 */

"use strict";

define(["tools/generalTools", "db/services", "db/session", "db/saveHistory", "tools/parameters", "widgets/settingsMenu", "colorpicker",
    "ui/kendoChanges"], function (generalTools, dbServices, session, saveHistory, parameters) {
    var dispatcherSettings = {}, dataSource;

    //region Locals
    //keep track of the business account id to be used for new items
    var busAcctId;
    //keep track of the last selected item, for color selector
    var selectedItem;
    //endregion

    //region Setup Grid
    dispatcherSettings.initialize = function () {
        //setup menu
        var menu = $("#dispatcher .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Dispatcher"});

        var getBaseUrl = function () {
            return dbServices.API_URL + "taskStatuses?roleId=" + parameters.get().roleId;
        };

        dataSource = new kendo.data.DataSource({
            transport: {
                create: {
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    url: getBaseUrl
                },
                read: {
                    type: "GET",
                    url: getBaseUrl,
                    dataType: "jsonp",
                    contentType: "application/json; charset=utf-8"
                },
                update: {
                    type: "PUT",
                    contentType: "application/json; charset=utf-8",
                    url: getBaseUrl
                },
                destroy: {
                    type: "DELETE",
                    url: function (status) {
                        return getBaseUrl() + "&id=" + status.Id;
                    }
                },
                parameterMap: dbServices.parameterMap()
            },
            schema: {
                model: {
                    // Necessary for inline editing to work
                    id: "Id",
                    fields: {
                        // Id and BusinessAccountId are included(but hidden) here
                        // so that they will not show up, but be linked to the statuses
                        Id: {
                            type: "hidden"
                        },
                        BusinessAccountId: {
                            type: "hidden"
                        },
                        Name: {
                            type: "string",
                            validation: { required: true },
                            defaultValue: "New Status"
                        },
                        Color: {
                            type: "string",
                            defaultValue: "#FFFFFF"
                        },
                        RemoveFromRoute: {
                            type: "boolean"
                        },
                        DefaultTypeInt: {
                            type: "number",
                            editable: false,
                            defaultValue: null
                        }
                    }
                }
            }
        });
        dbServices.hookupDefaultComplete(dataSource);

        $("#dispatcherGrid").kendoGrid({
            autoBind: false,
            columns: [
                {
                    field: "Name",
                    title: "Name"
                },
                {
                    width: 55,
                    field: "Color",
                    title: "Color",
                    // The template for the color picker
                    editor: colorEditor,
                    template: "<div class='gridColor' style='background-color: #=Color#'></div>"
                },
                {
                    field: "RemoveFromRoute",
                    title: "Remove from Route on Selection",
                    template: "#= dispatcherSettings.getChecked(RemoveFromRoute)#"
                },
                {
                    field: "DefaultTypeInt",
                    title: "Attributes",
                    template: '#= dispatcherSettings.getAttributeText(DefaultTypeInt) #'
                }
            ],
            dataSource: dataSource,
            dataBound: onDataBound,
            editable: true,
            scrollable: false,
            selectable: true,
            sortable: true,
            //called when the grid detects changes to the data()
            save: function () {
                //need to delay because the name binding takes some time to update
                _.delay(function () {
                    saveHistory.save();
                }, 200);
            }
        });

        //detect add button click
        $("#dispatcher .k-grid-add").click(function () {
            dispatcherSettings.grid.addRow();
            saveHistory.save();
        });
    }; //end initialize

    var load = function () {
        dataSource.read();
    };
    dispatcherSettings.show = function () {
        dispatcherSettings.setupSaveHistory();
        //wait to load until the roleId parameter is set
        _.delay(load, 250);
    };

    //endregion

    //region Methods
    //region Checkbox

    /**
     * Takes a boolean and converts it to a checked(if true) or unchecked(if false) checkbox
     * @param {boolean} checked
     * @return {string}
     */
    dispatcherSettings.getChecked = function (checked) {
        if (checked === true) {
            return "<input type='checkbox' checked onclick='dispatcherSettings.updateCheckbox(checked)'/>";
        } else {
            return "<input type='checkbox' onclick='dispatcherSettings.updateCheckbox(checked)' />";
        }
    };
    //disable the checkboxes for the default rows
    dispatcherSettings.disableDefaultCheckboxes = function () {
        $("#dispatcher input[type='checkbox']").each(function (i) {
            // Get the DefaultTypeInt for the row
            var typeInt = dispatcherSettings.grid._data[i].DefaultTypeInt;
            // Check if the row is a default type
            if (typeInt !== null) {
                //disable checkbox
                this.disabled = true;
            }
        });
    };

    //update the selected checkbox with the new value
    dispatcherSettings.updateCheckbox = function (checked) {
        //update the model with the new RemoveFromRoute value
        selectedItem.set("RemoveFromRoute", checked);
        saveHistory.save();
    };
    //endregion

    //region Color
    //attaches a color picker to the color element
    var addColorPicker = function () {
        $('.colorSelector2').ColorPicker({
            //set the initial color of the picker to be the current color
            color: dispatcherSettings.grid.dataItem(dispatcherSettings.grid.select()).Color, // rgbToHex($('.innerSelector').eq(i))
            onShow: function (colpkr) {
                //set a high z-index so picker show up above the grid
                $(colpkr).css('z-index', "1000");
                $(colpkr).fadeIn(200);
                return false;
            },
            onHide: function (colpkr) {
                $(colpkr).fadeOut(200);
                return false;
            },
            onChange: function (hsb, hex) {
                var color = '#' + hex;
                //change the current color on selection
                updateColor(color);
            }
        });
    };

    /**
     * Creates the cell edit template for the color
     * @param {Object} container
     * @param {Object} options
     */
    var colorEditor = function (container, options) {
        //attach the color picker element
        $("<input class='colorInput' data-text-field='Color' data-value-field='Color' data-bind='value:" + options.field + "'/>" +
            "<div class='customWidget'><div class='colorSelector2'><div class='innerSelector' style='background-color:" +
            options.model.Color + "'></div></div><div class='colorpickerHolder2'></div></div>")
            .appendTo(container);
        //attach the color picker
        addColorPicker();
    };

    /**
     * Updates the model with the selected color
     * @param {string} color The picked color
     */
    var updateColor = function (color) {
        //update the current model with the new color value
        selectedItem.set('Color', color);
        saveHistory.save();
    };
    //endregion

    /**
     * Takes a number and converts it to one of three default strings
     * @param {number} typeInt
     * @return {string}
     */
    dispatcherSettings.getAttributeText = function (typeInt) {
        if (typeInt === 1) {
            return "Default status for newly created tasks";
        } else if (typeInt === 2) {
            return "Default status when placed into a route";
        } else if (typeInt === 3) {
            return "Task completed";
        } else {
            return "";
        }
    };

    //after the data is loaded, assign the color picker to each of the current color boxes
    var onDataBound = function () {
        //get a reference to the grid widget
        dispatcherSettings.grid = $("#dispatcherGrid").data("kendoGrid");
        //set the original data(used for canceling changes)
        dispatcherSettings.originalData = dispatcherSettings.grid._data;
        //disable the checkboxes for the default rows
        dispatcherSettings.disableDefaultCheckboxes();
        //get the BusinessAccountId from another row to be used to set in new rows
        busAcctId = dispatcherSettings.grid._data[1].BusinessAccountId;
        //bind to the selection change event
        dispatcherSettings.grid.bind("change", function () {
            enableOrDisableDelete();
            selectedItem = dispatcherSettings.grid.dataItem(dispatcherSettings.grid.select());
        });
        //bind to grid edit event
        dispatcherSettings.grid.bind("edit", function (e) {
            //disable the checkboxes for the default rows
            dispatcherSettings.disableDefaultCheckboxes();
            if (e.sender._editContainer.context) {
                if (e.sender._editContainer.context.cellIndex === 1) {
                    $('.colorSelector2').ColorPickerShow();
                }
            }
            //set the BusinessAccountId if it is empty
            if (!e.model.BusinessAccountId) {
                e.model.BusinessAccountId = busAcctId;
            }
            //set the Id if it is empty
            if (!e.model.Id) {
                e.model.Id = generalTools.newGuid();
            }
        });
    };

//    //detect cancel button click
//    dispatcherSettings.cancel = function () {
//        //disable the delete button(there isn't a selected row after cancel is clicked)
//        $('#dispatcher .k-grid-delete').attr("disabled", "disabled");
//        dispatcherSettings.grid.dataSource.data(dispatcherSettings.originalData);
//        dispatcherSettings.grid.dataSource.read();
//    };
//
//    dispatcherSettings.undo = function () {
//        saveHistory.states.pop();
//        if(saveHistory.states.length !== 0){
//            dispatcherSettings.grid.dataSource.data(saveHistory.states[saveHistory.states.length - 1]._data);
//            dispatcherSettings.grid.dataSource.read();
//            if(saveHistory.states.length === 1){
//                saveHistory.multiple = false;
//                saveHistory.close();
//                saveHistory.success();
//            }
//        }else{
//            saveHistory.cancel();
//        }
//    };

    dispatcherSettings.setupSaveHistory = function () {
        saveHistory.setCurrentSection({
            page: "Dispatcher Settings",
            save: function () {
                dispatcherSettings.grid.saveChanges();
            },
            section: dispatcherSettings
        });
    };

    //removes the selected row from the grid(stays in pending changes until changes are saved)
    dispatcherSettings.removeSelectedRow = function () {
        //get selected row
        var row = getSelectedRow(dispatcherSettings.grid);
        //remove selected row
        dispatcherSettings.grid.removeRow(row);
        saveHistory.save();
    };

    //hide the delete button if a default row is selected, otherwise show it
    var enableOrDisableDelete = function () {
        //get the selected row
        var row = getSelectedRow(dispatcherSettings.grid);
        if (row[0].cells[3].innerHTML !== "") {
            $('#dispatcher .k-grid-delete').attr("disabled", "disabled");
        } else {
            $('#dispatcher .k-grid-delete').removeAttr("disabled");
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

    window.dispatcherSettings = dispatcherSettings;
});