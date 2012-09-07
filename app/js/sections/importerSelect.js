'use strict';

define(["sections/importerUpload", "db/services"], function (importerUpload, dbServices) {
    var importerSelect = {};
    importerSelect.requiredFields = [
            "Client Name",
            "Address Line One",
            "Address Line Two",
            "City",
            "State",
            "Zip Code",
            "Latitude",
            "Longitude"
        ];

    //region Custon Editors
//    importerSelect.numberEditor = function (container, options) {
//        $('<input data-text-field="Name" data-value-field="Name" data-bind="value:' + options.field + '"/>')
//            .appendTo(container).kendoDatePicker();
//    };
//    importerSelect.dateEditor = function (container, options) {
//        $('<input data-text-field="Name" data-value-field="Name" data-bind="value:' + options.field + '"/>')
//            .appendTo(container)
//            .kendoNumericTextBox({
//                value: options.field
//            });
//    };
//    importerSelect.repeatOnEditor = function (container, options) {
//        $('<input data-text-field="Name" data-value-field="Name" data-bind="value:' + options.field + '"/>')
//            .appendTo(container)
//            .kendoDropDownList({
//                autoBind: false,
//                dataSource: new kendo.data.DataSource({
//                    data: [
//                        {
//                            Name: "Day"
//                        },
//                        {
//                            Name: "Date"
//                        }
//                    ]
//                })
//            });
//    };
//    importerSelect.frequencyEditor = function (container, options) {
//        $('<input data-text-field="Name" data-value-field="Name" data-bind="value:' + options.field + '"/>')
//            .appendTo(container)
//            .kendoDropDownList({
//                autoBind: false,
//                dataSource: new kendo.data.DataSource({
//                    data: [
//                        {
//                            Name: "Once"
//                        },
//                        {
//                            Name: "Daily"
//                        },
//                        {
//                            Name: "Weekly"
//                        },
//                        {
//                            Name: "Monthly"
//                        },
//                        {
//                            Name: "Yearly"
//                        }
//                    ]
//                })
//            });
//    };
    //endregion

    importerSelect.initialize = function () {
        //setup the default fields
        var fieldList = [
            {Name: "Do not Import", Type: "string"},
            {Name: 'Client Name', Type: "string"},
            {Name: 'Address Line One', Type: "string"},
            {Name: 'Address Line Two', Type: "string"},
            {Name: 'City', Type: "string"},
            {Name: 'State', Type: "string"},
            {Name: 'Zip Code', Type: "string"},
            {Name: 'Region Name', Type: "string"},
            {Name: 'Frequency', Type: "none"},
            {Name: 'Repeat On', Type: "none"},
            {Name: 'Repeat Every', Type: "number"},
            {Name: 'Repeat Start Date', Type: "date"},
            {Name: 'Location', Type: "string"}
        ];

        //make sure there is a selected service type
        if(!importerUpload.selectedService){
            window.application.navigate("view/importerUpload.html");
            return;
        }

        $("#listView").kendoListView({
            //setup the template to only include the header and the first row of data
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><input class='field' /></li>",
            dataSource: importerUpload.data
        });

        //get the list of fields for the selected service
        dbServices.getFields(importerUpload.selectedService, function (fields) {
            var newFields = [];
            var newField = fields[0];
            //iterate throught the list of fields
            for(var i in newField){
                //don't add if type is guid or if name is ClientName or OccurDate
                if(newField[i] != "guid" && i != "ClientName" && i != "OccurDate"){
                    //add field to list
                    newFields.push({
                        //replace "_" with " "
                        Name: i.replace(/_/g,' '),
                        Type: newField[i]
                    });
                }
            }

            //combine the fields in fieldList with newFields
            var allFields = fieldList.concat(newFields);

            $(".field").kendoDropDownList({
                dataTextField: "Name",
                dataValueField: "Name",
                dataSource: allFields,
                change: function () {
                    var i = 0, type, name, width, fieldName, template, column;
                    importerSelect.columns = [];
                    importerSelect.rowTemplateString = "<tr>";
                    importerSelect.headers = [];
                    importerSelect.fields = {};
                    //iterate through all the dropdowns
                    $("#importerSelect input.field").each( function () {
                        name = this.value;
                        //check if the dropdown is not "Do not Import"
                        if(name != "Do not Import") {
                            //setup the column
                            fieldName = "c" + i;
                            type = allFields[i].Type;
                            //calculate the width of the title
                            width = name.length * 6.5 + 35;
                            //set the width to 100 if it's less than 100
                            if(width < 100){
                                width = 100;
                            }
                            template = "# if (" + fieldName + ".S == 3) { # <div class='cellError'></div> # } # #=" + fieldName + ".V#";
                            //if(type != "string"){
//                                    var editor;
//                                    if(name == "Repeat On"){
//                                        editor = importerSelect.repeatOnEditor;
//                                    }else if(name == "Frequency") {
//                                        editor = importerSelect.frequencyEditor;
//                                    }else if(type == "date") {
//                                        editor = importerSelect.dateEditor;
//                                    }else if(type == "number") {
//                                        editor = importerSelect.numberEditor;
//                                    }
//                                    column = {
//                                        field: fieldName,
//                                        title: name,
//                                        template: template,
//                                        width: width + "px",
//                                        editor: editor
//                                    };
                            //}else{
                            column = {
                                field: fieldName, //ex. "c0"
                                title: name, //ex. "Client Name"
                                template: template,
                                width: width + "px"
                            };
                            //}

                            importerSelect.fields[fieldName] = {
                                defaultValue: ""
                            };

                            importerSelect.rowTemplateString += "<td>" + fieldName + ".V</td>";
                            //add the column to the list of columns
                            importerSelect.columns.push(column);
                            //add the column name to the list of headers
                            importerSelect.headers.push(name);
                        }
                        i++;
                    });
//                    fieldName = "c" + (importerSelect.headers.length);
//                    importerSelect.rowTemplateString += "</tr>";
//
//                    var locationColumn = {
//                        field: fieldName, //ex. "c0"
//                        title: "Location",
//                        template: "# if (" + fieldName + ".S == 3) { # <div class='cellError'></div> # } # #=" + fieldName + ".V#",
//                        width: "100px",
//                        hidden: true
//                    };
//                    importerSelect.columns.push(locationColumn);
//                    importerSelect.headers.push("Location");
//                    importerSelect.fields[fieldName] = {
//                        defaultValue: ""
//                    };

                    //this section checks if each of the required fields have been included
                    //if it hasn't, a hidden field is added
                    var hiddenNum = 0;
                    for(var f in importerSelect.requiredFields){
                        var field = importerSelect.requiredFields[f];
                        var hasField = false;
                        //check if the current required field is included in the columns
                        hasField = _.any(importerSelect.columns, function (column) {
                            return column.title === field;
                        });
                        //if the required field is not included
                        if(!hasField){
                            //add the field name to the list of headers
                            importerSelect.headers.push(field);

                            var fName = "c10" + hiddenNum;
                            //save the field(hidden) as a property of importerSelect.fields
                            importerSelect.fields[fName] = {
                                defaultValue: "",
                                type: "hidden"
                            };
                            hiddenNum ++;
                        }
                    }
                }
            });

            //automatically select fields if there is a matching header
            var dropdown, headers = importerUpload.oldData[0];
            for(var h in headers){
                dropdown = $("#importerSelect input.field:eq(" + h + ")").data("kendoDropDownList");
                //try to select a matching item
                dropdown.select(function(field) {
                    return field.Name == headers[h];
                });
            }
        });
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});