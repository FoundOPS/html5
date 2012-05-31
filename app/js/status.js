//region Locals
var grid;
//keep track of the business account id to be used for new items
var busAcctId;
//keep track of the last selected item, for color selector
var selectedItem;
//endregion

//region Setup Grid
$(document).ready(function () {
    var baseUrl = "http://localhost:9711/api/TaskStatus/";
    var roleId = "9507BDA4-8913-44DA-97A4-F7DD7ACB47FE";
    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: baseUrl + "GetStatuses?roleId=" + roleId,
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8"
            },
            update: {
                url: baseUrl + "UpdateTaskStatus",
                type: "POST"
            },
            destroy: {
                url: baseUrl + "DeleteTaskStatus",
                type: "POST"
            },
            create: {
                url: baseUrl + "InsertTaskStatus",
                type: "POST"
            }
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
                    RouteRequired: {
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
    $("#grid").kendoGrid({
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
                field: "RouteRequired",
                title: "Remove from Route on Selection",
                template: "#= getChecked(RouteRequired)#"
            },
            {
                field: "DefaultTypeInt",
                title: "Attributes",
                template: '#= getAttributeText(DefaultTypeInt) #'
            }],
        dataSource: dataSource,
        dataBound: onDataBound,
        editable: true,
        //called when a row it removed from the grid
        remove: function () {
            //hide the save and cencel buttons
            hideOrShowSaveCancel(true);
        },
        scrollable: false,
        selectable: true,
        sortable: true,
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
        // The command buttons above the grid
        toolbar: [
            {
                name: "create",
                text: "Add New Row"
            },
            {
                name: "save",
                text: "Save Changes"
            },
            {
                name: "cancel",
                text: "Cancel Changes"
            },
            {
                name: "destroy",
                // Use a template so "removeSelectedRow()" can be called
                template: "<a class='k-button k-button-icontext k-grid-delete' onclick='removeSelectedRow()'><span class='k-icon k-delete'></span>Delete</a>"
            }
        ]
    });
}); // End document.ready
//endregion

//region Methods

//region Checkbox
//disable the checkboxes for the default rows
var disableDefaultCheckboxes = function () {
    $("input[type='checkbox']").each(function (i) {
        // Get the DefaultTypeInt for the row
        var int = grid._data[i].DefaultTypeInt;
        // Check if the row is a default type
        if (int !== null) {
            // Disable checkbox
            this.disabled = true;
        }
    });
};
//keep the default checkboxes disabled
$(document).click(function () {
    disableDefaultCheckboxes();
});
/**
 * Takes a boolean and converts it to a checked(if true) or unchecked(if false) checkbox
 * @param {boolean} checked
 * @return {string}
 */
var getChecked = function (checked) {
    if (checked === true) {
        return "<input type='checkbox' checked onclick='updateCheckbox(checked)'/>";
    } else {
        return "<input type='checkbox' onclick='updateCheckbox(checked)' />";
    }
};
// Update the selected checkbox with the new value
var updateCheckbox = function (checked) {
    //update the model with the new RouteRequired value
    selectedItem.set('RouteRequired', checked);
    // Show save and cancel buttons
    hideOrShowSaveCancel(true);
};
//endregion

//region Color
//attaches a color picker to the color element
var addColorPicker = function () {
    $('.colorSelector2').ColorPicker({
        // Set the initial color of the picker to be the current color
        color: grid.dataItem(grid.select()).Color, // rgbToHex($('.innerSelector').eq(i))
        onShow: function (colpkr) {
            // Set a high z-index so picker show up above the grid
            $(colpkr).css('z-index', "1000");
            $(colpkr).fadeIn(200);
            return false;
        },
        onHide: function (colpkr) {
            $(colpkr).fadeOut(200);
            return false;
        },
        onChange: function (hsb, hex, rgb) {
            var color = '#' + hex;
            //$('.k-state-selected .innerSelector').css('background-color', color);
            // Change the current color on selection
            updateColor(color);
        }
    });
}
/**
 * Creates the cell edit template for the color
 * @param {Object} container
 * @param {Object} options
 */
var colorEditor = function (container, options) {
    $("<input class='colorInput' data-text-field='Color' data-value-field='Color' data-bind='value:" + options.field + "'/>" +
        "<div class='customWidget'><div class='colorSelector2'><div class='innerSelector' style='background-color:" +
        options.model.Color + "'></div></div><div class='colorpickerHolder2'></div></div>")
        .appendTo(container);
    //attach the color picker
    addColorPicker();
}
/**
 * Updates the model with the selected color
 * @param {string} color The picked color
 */
var updateColor = function (color) {
    //update the current model with the new color value
    selectedItem.set('Color', color);
    // Show save and cancel buttons
    hideOrShowSaveCancel(true);
};
//endregion

/**
 * Takes a number and converts it to one of three default strings
 * @param {number} int
 * @return {string}
 */
var getAttributeText = function (int) {
    if (int === 1) {
        return "Default status for newly created tasks";
    } else if (int === 2) {
        return "Default status when placed into a route";
    } else if (int === 3) {
        return "Task completed";
    } else {
        return "";
    }
};
// After the data is loaded, assign the color picker to each of the current color boxes
var onDataBound = function () {
    // Get a reference to the grid widget
    grid = $("#grid").data("kendoGrid");
    //disable the checkboxes for the default rows
    disableDefaultCheckboxes();
    // Get the BusinessAccountId from another row to be used to set in new rows
    busAcctId = grid._data[1].BusinessAccountId;
    // Bind to the selection change event
    grid.bind("change", function (e) {
        hideOrShowDeleteBtn();
        selectedItem = grid.dataItem(grid.select());
    });
    // Detect cancel button click
    $(".k-grid-cancel-changes").click(function () {
        // Hide save and cancel buttons
        hideOrShowSaveCancel(false);
        //hide the delete button(there isn't a selected row after cancel is clicked)
        $('.k-grid-delete').css('display', "none");
        grid.dataSource.read();
    });
    // Detect add button click
    $(".k-grid-add").click(function () {
        // Show save and cancel buttons
        hideOrShowSaveCancel(true);
    });
    // Bind to grid edit event
    grid.bind("edit", function (e) {
        //disable the checkboxes for the default rows
        disableDefaultCheckboxes();
        if (e.sender._editContainer.context) {
            if (e.sender._editContainer.context.cellIndex == 1) {
                $('.colorSelector2').ColorPickerShow();
            }
        }
        // Set the BusinessAccountId if it is empty
        if (!e.model.BusinessAccountId) {
            e.model.BusinessAccountId = busAcctId;
        }
        // Set the Id if it is empty
        if (!e.model.Id) {
            e.model.Id = guidGenerator();
        }
    });
}
// Removes the selected row from the grid(stays in pending changes until changes are saved)
var removeSelectedRow = function () {
    // Get selected row
    var row = getSelectedRow(grid);
    // Remove selected row
    grid.removeRow(row);
};
/**
 * Create a new unique Guid.
 * @return {string} newGuidString
 */
var guidGenerator = function () {
    var newGuidString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return newGuidString;
}
// Hide the delete button if a default row is selected, otherwise show it
var hideOrShowDeleteBtn = function () {
    // Get the selected row
    var row = getSelectedRow(grid);
    if (row[0].cells[3].innerHTML !== "") {
        $('.k-grid-delete').css('display', "none");
    } else {
        $('.k-grid-delete').css('display', "inline-block");
    }
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