$(document).ready(function(){
    var baseUrl = "http://localhost:9711/api/TaskStatus/";
    var roleId = "D299B11A-463B-4377-A162-2F7E4990DF1C";
    var dataSource = new kendo.data.DataSource({
        type: "json",
        transport: {
            read: {
                url: baseUrl + "GetStatuses?roleId=" + roleId,
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8"
            },
            update: {
                url: baseUrl + "UpdateTaskStatus",
                dataType: "jsonp"
            },
            destroy: {
                url: baseUrl + "DeleteTaskStatus",
                dataType: "jsonp"
            },
            create: {
                url: baseUrl + "InsertTaskStatus",
                dataType: "jsonp"
            },
            parameterMap: function(options, operation) {
                if (operation !== "read" && options.models) {
                    return {models: kendo.stringify(options.models)};
                }
            }
        },
        batch: true,
        schema: {
            model: {
                // Necessary for inline editing to work
                id: "Id",
                fields: {
                    // Id and BusinessAccountId are included(but hidden) here
                    // so that they will not show up, but be linked to the statuses
                    Id: {type: "hidden"},
                    BusinessAccountId: {type: "hidden"},
                    Name: { type: "string", validation: { required: true } },
                    Color: { type: "string", editable:false },
                    RouteRequired: { type: "boolean", editable:false },
                    DefaultTypeInt: { type: "number", editable:false }
                }
            }
        }
    });
    $("#grid").kendoGrid({
        columns:[
            {
                field: "Name",
                title: "Name"
            },
            {
                width: 55,
                field: "Color",
                title: "Color",
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
        sortable: true,
        editable: true,
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
                text: "Delete Row"
            }
        ],
        change: function(e) {

        },
        scrollable: false,
        selectable: true
    });
});

/**
 * Takes a number and converts it to one of three default strings
 * @param {number} int
 * @return {string}
 */
var getAttributeText = function(int){
    if(int == 1){
        return "Default status for newly created tasks";
    }else if(int == 2){
        return "Default status when placed into a route";
    }else if(int == 3){
        return "Task completed";
    }else{
        return "";
    }
};

/**
 * Takes a boolean and converts it to a checked(if true) or unchecked(if false) checkbox
 * @param {boolean} checked
 * @return {string}
 */
var getChecked = function(checked){
    if(checked == true){
        return "<input type='checkbox' checked />";
    }else{
        return "<input type='checkbox' />";
    }
};

// After the data is loaded, assign the color picker to each of the current color boxes
function onDataBound() {
    $('.colorSelector2').each(function(i) {
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
                // Change the current color on selection
                $('.k-state-selected .innerSelector').css('background-color', '#' + hex);
            }
        });
    });
}

/**
 * Takes a color in "rgb(0,0,256)" format and converts it to "#0000FF"
 * @param {string} color
 * @return {String}
 */
function rgbToHex(color) {
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);
    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + '#' + rgb.toString(16);
};