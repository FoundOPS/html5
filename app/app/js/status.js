var grid = "";
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
        }
    },
        schema: {
            model: {
                fields: {
                    Id: {type: "hidden"},
                    BusinessAccountId: {type: "hidden"},
                    Name: { type: "string" },
                    Color: { type: "string", editable:false },
                    RouteRequired: { type: "boolean" },
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
                template: "<div id='color' style='background-color: #=Color#' onclick='openColorPicker()'></div><div class='arrow'></div>"
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
            },
            {
                command: ["edit", "destroy"],
                title: "&nbsp;",
                width: "160px"
            }],
        dataSource: dataSource,
        sortable: true,
        editable: "inline",
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
            }
        ],
        selectable: true,
        scrollable: false
    });
    grid = $("#grid").data("kendoGrid");
});

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

var getChecked = function(checked){
    if(checked == true){
        return "<input type='checkbox' checked />";
    }else{
        return "<input type='checkbox' />";
    }
};

var openColorPicker = function(e){
    w = window.open('../color' ,'mywindow','width=300,height=300');
};

var updateColor = function(hex){
    var a = hex;
};