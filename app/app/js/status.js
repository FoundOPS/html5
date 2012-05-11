$(document).ready(function(){
    $("#grid").kendoGrid({
        columns:[
            {
                field: "name",
                title: "Name"
            },
            {
                field: "color",
                title: "Color",
                template: "<div id='color' style='background-color: #= color #;' onclick='openColorPicker()'></div>"
            },
            {
                field: "remove",
                title: "Remove from Route on Selection",
                template: "<input type='checkbox' checked='#= remove #'>"
            },
            {
                field: "attributes",
                title: "Attributes"
            }],
        dataSource: {
            data: [
                {
                    name: "Unrouted",
                    color: "#ff0000",
                    remove: true,
                    attributes: ""
                },
                {
                    name: "Routed",
                    color: "#00ff00",
                    remove: false,
                    attributes: ""
                }]
        },
        sortable: true,
        editable: {
            update: true, // puts the row in edit mode when it is clicked
            destroy: false, // does not remove the row when it is deleted, but marks it for deletion
            confirmation: "Are you sure you want to remove this item?"
        },
        selectable: false
    });
});
var openColorPicker = function(){
    alert("i did this!");
}
