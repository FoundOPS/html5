// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold dispatcher settings logic
 */

"use strict";

define(["tools/generalTools", "db/services", "db/session", "db/saveHistory", "tools/parameters", "tools/kendoTools", "widgets/settingsMenu", "colorpicker",
    "ui/kendoChanges"], function (generalTools, dbServices, session, saveHistory, parameters, kendoTools) {
    var dispatcherSettings = {}, dataSource, grid;

    //region Locals
    //keep track of the business account id to be used for new items
    var busAcctId;
    //keep track of the last selected item, for color selector
    var selectedItem;
    //endregion

    //region Setup Grid
    //
    // //resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 207;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $("#dispatcherGrid").css("maxHeight", contentHeight + 'px');
    };

    dispatcherSettings.initialize = function () {
        $(window).resize(function () {
            resizeGrid();
        });

        //setup menu
        var menu = $("#dispatcher").find(".settingsMenu");
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
                    width: 75,
                    field: "Color",
                    title: "Color",
                    // The template for the color picker
                    editor: colorEditor,
                    template: "<div class='gridColor' style='background-color: #=Color#'></div>"
                },
                {
                    field: "RemoveFromRoute",
                    title: "Remove from Route on Selection",
                    template: "<input type='checkbox' onclick='dispatcherSettings.updateCheckbox(checked)'" +
                        "# if (RemoveFromRoute) { # " +
                        "#= 'checked' # " +
                        "# } # />"
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
        $("#dispatcher").find(".k-grid-add").click(function () {
            grid.addRow();
            saveHistory.save();
        });
    }; //end initialize

    dispatcherSettings.show = function () {
        dispatcherSettings.setupSaveHistory();
        //wait to load until the roleId parameter is set
        _.delay(function () {
            dataSource.read();
            resizeGrid();
        }, 250);
    };

    //endregion

    //region Methods

    //region Checkbox

    //disable the checkboxes for the default rows
    var disableDefaultCheckboxes = function () {
        $("#dispatcher").find("input[type='checkbox']").each(function (i) {
            // Get the DefaultTypeInt for the row
            var typeInt = grid._data[i].DefaultTypeInt;
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
        $('.colorSelector2').ColorPicker({
            //set the initial color of the picker to be the current color
            color: grid.dataItem(grid.select()).Color, // rgbToHex($('.innerSelector').eq(i))
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
     * Updates the model with the selected color
     * @param {string} color The picked color
     */
    var updateColor = function (color) {
        //update the current model with the new color value
        selectedItem.set('Color', color);
        saveHistory.save();
    };

    //endregion

    var attributeText = ["Default status for newly created tasks", "Default status when placed into a route", "Task completed"];
    /**
     * Takes a number and converts it to a descriptive attribute string
     * @param {number} typeInt
     * @return {string}
     */
    dispatcherSettings.getAttributeText = function (typeInt) {
        if (typeInt >= 1 && typeInt <= 3) {
            return attributeText[typeInt - 1];
        }

        return "";
    };

    //after the data is loaded, assign the color picker to each of the current color boxes
    var onDataBound = function () {
        //get a reference to the grid widget
        grid = $("#dispatcherGrid").data("kendoGrid");
        //disable the checkboxes for the default rows
        disableDefaultCheckboxes();

        //get the BusinessAccountId from another row to be used to set in new rows
        if (grid._data.length > 0) {
            busAcctId = grid._data[1].BusinessAccountId;
        }

        //bind to the selection change event
        grid.bind("change", function () {
            //hide the delete button if a default row is selected, otherwise show it
            var row = kendoTools.getSelectedRow(grid);
            if (row[0].cells[3].innerHTML !== "") {
                $("#dispatcher").find(".k-grid-delete").attr("style", "display:none");
            } else {
                $("#dispatcher").find(".k-grid-delete").attr("style", "display:inline-block");
            }

            selectedItem = grid.dataItem(grid.select());
        });

        //bind to grid edit event
        grid.bind("edit", function (e) {
            //disable the checkboxes for the default rows
            disableDefaultCheckboxes();
            if (e.sender._editContainer.context) {
                if (e.sender._editContainer.context.cellIndex === 1) {
                    $(".colorSelector2").ColorPickerShow();
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

    dispatcherSettings.setupSaveHistory = function () {
        saveHistory.setCurrentSection({
            page: "Dispatcher Settings",
            save: function () {
                grid.saveChanges();
            },
            section: dispatcherSettings
        });
    };

    //removes the selected row from the grid (stays in pending changes until changes are saved)
    dispatcherSettings.removeSelectedRow = function () {
        //get selected row
        var row = kendoTools.getSelectedRow(grid);
        //remove selected row
        grid.removeRow(row);
        saveHistory.save();
    };

    //endregion

    window.dispatcherSettings = dispatcherSettings;
});