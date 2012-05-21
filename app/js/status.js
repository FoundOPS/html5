
//region Locals
var grid;
var busAcctId;
//endregion

//region Setup Grid
$(document).ready(function () {
    var baseUrl = "http://localhost:9711/api/TaskStatus/";
    var roleId = "D299B11A-463B-4377-A162-2F7E4990DF1C";
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
                        editable: false,
                        defaultValue: "#FFFFFF"
                    },
                    RouteRequired: {
                        type: "boolean",
                        editable: false
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
                template: "<div class='customWidget'><div class='colorSelector2'><div class='innerSelector' style='background-color: #=Color#'>" +
                    "</div></div><div class='colorpickerHolder2'></div></div>"
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
        remove: function (e) {
            hideOrShowSaveCancel(true);
        },
        scrollable: false,
        selectable: true,
        sortable: true,
        save: function (e) {
            hideOrShowSaveCancel(true);
        },
        saveChanges: function (e) {
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
/**
 * Takes a boolean and converts it to a checked(if true) or unchecked(if false) checkbox
 * @param {boolean} checked
 * @return {string}
 */
var getChecked = function (checked) {
    if (checked === true) {
        return "<input type='checkbox' checked onclick='updateCheckbox()'/>";
    } else {
        return "<input type='checkbox' onclick='updateCheckbox()' />";
    }
};
// After the data is loaded, assign the color picker to each of the current color boxes
function onDataBound() {
    $('.colorSelector2').each(function (i) {
        $(this).ColorPicker({
            // Set the initial color of the picker to be the current color
            color: rgbToHex($('.innerSelector').eq(i).css('background-color')),
            onShow: function (colpkr) {
                // Set a high z-index so picker show up above the grid
                $(colpkr).css('z-index', "1000");
                $(colpkr).fadeIn(500);
                return false;
            },
            onHide: function (colpkr) {
                $(colpkr).fadeOut(500);
                return false;
            },
            onChange: function (hsb, hex, rgb) {
                var color = '#' + hex;
                $('.k-state-selected .innerSelector').css('background-color', color);
                // Change the current color on selection
                updateColor(i, color);
            }
        });
    });
    // Get a reference to the grid widget
    grid = $("#grid").data("kendoGrid");
    // Disable checkboxes for default rows
    $("input[type='checkbox']").each(function (i) {
        // Get the DefaultTypeInt for the row
        var int = grid._data[i].DefaultTypeInt;
        // Check if the row is a default type
        if (int === 1 || int === 2 || int === 3) {
            // Disable checkbox
            this.disabled = true;
        }
    });
    // Get the BusinessAccountId from another row to be used to set in new rows
    busAcctId = grid._data[1].BusinessAccountId;
    // Bind to the selection change event
    grid.bind("change", function (e) {
        hideOrShowDeleteBtn();
    });
    // Detect cancel button click
    $(".k-grid-cancel-changes").click(function () {
        // Hide save and cancel buttons
        hideOrShowSaveCancel(false);
    });
    // Detect add button click
    $(".k-grid-add").click(function () {
        // Show save and cancel buttons
        hideOrShowSaveCancel(true);
    });
    // Bind to grid edit event
    grid.bind("edit", function (e) {
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
/**
 * Takes a color in "rgb(0,0,256)" format and converts it to "#0000FF"
 * @param {string} color
 * @return {String}
 */
function rgbToHex(color) {
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    var red = parseInt(digits[2], 10);
    var green = parseInt(digits[3], 10);
    var blue = parseInt(digits[4], 10);
    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + '#' + rgb.toString(16);
}
// Removes the selected row from the grid(stays in pending changes until changes are saved)
var removeSelectedRow = function () {
    // Get selected row
    var row = getSelectedRow(grid);
    // Remove selected row
    grid.removeRow(row);
};
// Generate new GUID
function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) || 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
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
/**
 * Updates the model with the selected color
 * @param {number} i The row of the selected color picker
 * @param {string} color The picked color
 */
var updateColor = function (i, color) {
    grid._data[i].Color = color;
    // Show save and cancel buttons
    hideOrShowSaveCancel(true);
};
// Update the selected checkbox with the new value
var updateCheckbox = function () {
    // Get the selected row
    var row = getSelectedRow(grid);
    // Get the index of the selected row
    var index = row[0].sectionRowIndex;
    // Set checkbox equal to the ! of what it is currently
    grid._data[index].RouteRequired = !(grid._data[index].RouteRequired);
    // Show save and cancel buttons
    hideOrShowSaveCancel(true);
};
//endregion