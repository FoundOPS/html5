'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore"], function ($, importerUpload, dbServices, _) {
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

    var formatDataForValidation = function (data) {
        var object, dataToValidate = [];
        //iterate through each row of the data
        for (var i in data){
            //skip the first row, because that is the row with the headers
            if(i !== 0){
                object = data[i];
                var newArray = [], newObject, keyNum;
                //iterate through each of the grid fields
                for (var c in importerSelect.fields) {
                    //remove the "c" from the name
                    keyNum = c.substr(1,3);
                    //get the object from the data that corresponds to the current field
                    newObject = object[c];
                    //if no corresponding object exists, create a blank one
                    if(!newObject){
                        newObject = {
                            H: "",
                            S: 2,
                            V: ""
                        };
                    }
                    //set the row and cell
                    newObject["r"] = i;
                    newObject["c"] = keyNum;
                    newArray.push(newObject);
                }
                dataToValidate.push(newArray);
            }
        }
        return dataToValidate;
    };

    importerSelect.dropdownChanged = function () {
        var i = 0, type, name, fieldName;
        importerSelect.columns = [];
        importerSelect.headers = [];
        importerSelect.fields = {};
        //iterate through all the dropdowns
        $("#importerSelect .selectBox").each(function () {
            name = this.value;
            //check if the dropdown is not "Do not Import"
            if (name !== "Do not Import") {
                //setup the column
                fieldName = "c" + i;
                importerSelect.createColumn(fieldName, name, true);
            }
            i++;
        });
        //manually add location
        importerSelect.createColumn("c" + i, "Location", true);

        //this section checks if each of the required fields have been included
        //if it hasn't, a hidden field is added
        var hiddenNum = 0;
        for (var f in importerSelect.requiredFields) {
            var field = importerSelect.requiredFields[f];
            var hasField = false;
            //check if the current required field is included in the columns
            hasField = _.any(importerSelect.columns, function (column) {
                return column.title === field;
            });
            //if the required field is not included
            if (!hasField) {
                //add the field name to the list of headers
                importerSelect.headers.push(field);

                var fName = "c10" + hiddenNum;
                //save the field(hidden) as a property of importerSelect.fields
                importerSelect.fields[fName] = {
                    defaultValue: ""
                };
                hiddenNum++;
            }
        }
    }

    importerSelect.createColumn = function (field, name, addToFieldsAndHeaders) {
        var column, template, hidden = false;
        if (name === "Location") {
            template = "# if (" + field + ".S == 3) { # <div class='cellError'></div> # } else { # <a href='' class='location'>&nbsp;&nbsp;&nbsp;&nbsp;</a>  # } #";
            //hidden = true;
        } else {
            template = "# if (" + field + ".S == 3) { # <div class='cellError'></div> # } # #=" + field + ".V#";
        }
        //calculate the width of the title
        var width = name.length * 6.5 + 35;
        //set the width to 100 if it's less than 100
        if (width < 100) {
            width = 100;
        }
        column = {
            field: field, //ex. "c0"
            title: name, //ex. "Client Name"
            template: template,
            width: width + "px",
            hidden: hidden
        };
        //add the column to the list of columns
        importerSelect.columns.push(column);
        if (addToFieldsAndHeaders) {
            //save the field as a property of importerSelect.fields
            importerSelect.fields[field] = {
                defaultValue: ""
            };
            //add the column name to the list of headers
            importerSelect.headers.push(name);
        }
    };

    importerSelect.initialize = function () {
        //make sure there is a selected service type
        if (!importerUpload.selectedService) {
            window.application.navigate("view/importerUpload.html");
            return;
        }

        $("#importerSelect").find(".saveBtn").on("click", function () {
            var dataToValidate = formatDataForValidation(importerUpload.oldData);

            dbServices.validateData(dataToValidate, importerSelect.headers, function (data) {
                importerSelect.gridData = data;
                window.viewImporterReview();
            });
        });
    };

    importerSelect.show = function () {
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
            {Name: 'Repeat Start Date', Type: "date"}
        ];

        $("#listView").kendoListView({
            //setup the template to only include the header and the first row of data
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><div class='styled-select'></div></li>",
            dataSource: importerUpload.data
        });

        //get the list of fields for the selected service
        dbServices.services.read({params: {serviceTemplateId: importerUpload.selectedService.Id}}).done(function (service) {
            var newFields = [], name, type;
            var fields = service[0].Fields;
            //iterate throught the list of fields
            for (var i in fields) {
                name = fields[i].Name;
                type = fields[i].Type;
                //don't add if type is guid or if name is ClientName or OccurDate
                if (type !== "guid" && name !== "ClientName" && name !== "OccurDate") {
                    //add field to list
                    newFields.push({
                        //replace "_" with " "
                        Name: name.replace(/_/g, ' '),
                        Type: type
                    });
                }
            }

            //combine the fields in fieldList with newFields
            var allFields = fieldList.concat(newFields);

            var j, options = [];
            for(j = 0; j < allFields.length; j++) {
                options[j] = {name: allFields[j].Name, data: allFields[j].Name};
            }
            $("#importerSelect").find(".styled-select").selectBox(options, importerSelect.dropdownChanged);

            //automatically select fields if there is a matching header
            var dropdown, headers = importerUpload.oldData[0];
            for (var h in headers) {
                dropdown = $("#importerSelect .selectBox:eq(" + h + ")");
                //try to select a matching item
                dropdown.val(headers[h]);
            }

            //setup the grid settings initially in case the don't change any of the dropdowns
            importerSelect.dropdownChanged();
        });
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});