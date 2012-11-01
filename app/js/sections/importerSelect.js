'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore"], function ($, importerUpload, dbServices, _) {
    var importerSelect = {},
        requiredFields = [
            "Client Name",
            "Address Line One",
            "Address Line Two",
            "City",
            "State",
            "Zipcode",
            "Country Code"
        ];

    var formatDataForValidation = function (data) {
        var selectedFields = [], fieldsToValidate;
        //create an array of the fields to be used(based on the dropdowns)
        $("#importerSelect").find(".selectBox").each(function () {
            if (this.value !== "Do not Import") {
                selectedFields.push({name: this.value, selected: true});
            } else {
                selectedFields.push(false);
            }
        });

        var fieldsToAdd = [];

        //make sure the required fields are included
        for (var i in requiredFields) {
            var included = false, field = requiredFields[i];
            for (var j in selectedFields) {
                if (selectedFields[j] && selectedFields[j].name === field) {
                    included = true;
                }
            }
            if (!included) {
                fieldsToAdd.push(field);
            }
        }

        var dataToValidate = [], row;
        //iterate through each row of the data
        for (var r in data) {
            row = data[r];
            var newArray = [];
            //iterate through each column of the current row
            for (var c in row) {
                //if the field is to be imported(if "Do not Import" wasn't selected for this row)
                if (selectedFields[c]) {
                    newArray.push(row[c]);
                }
            }
            for (var f in fieldsToAdd) {
                if (r === "0") {
                    newArray.push(fieldsToAdd[f]);
                } else {
                    if (fieldsToAdd[f] === "Country Code") {
                        newArray.push("US");
                    } else {
                        newArray.push("");
                    }
                }
            }

            dataToValidate.push(newArray);
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

    importerSelect.initialize = function () {
        //make sure there is a selected service type
        if (!importerUpload.selectedService) {
            window.viewImporterUpload();
            return;
        }

        $("#importerSelect").find(".saveBtn").on("click", function () {
            //var dataToValidate = formatDataForValidation(importerUpload.oldData);

            //dbServices.validateData(dataToValidate, function (data) {
                var data = [];

                importerSelect.gridData = data;
                window.viewImporterReview();
            //});
        });
    };

    importerSelect.show = function () {
        //setup the default fields
        var fieldList = [
            "Do not Import",
            'Client Name',
            'Address Line One',
            'Address Line Two',
            'City',
            'State',
            'Zip Code',
            'Region Name',
            'Frequency',
            'Repeat On',
            'Repeat Every',
            'Repeat Start Date'
        ];

        $("#listView").kendoListView({
            //setup the template to only include the header and the first row of data
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><div class='styled-select'></div></li>",
            dataSource: importerUpload.data
        });

        //get the list of fields for the selected service
        if (importerUpload.selectedService) {
            dbServices.services.read({params: {serviceTemplateId: importerUpload.selectedService.Id}}).done(function (service) {
                var newFields = [], name;
                var fields = service[0].Fields;
                //iterate throught the list of fields
                for (var i in fields) {
                    name = fields[i].Name;
                    //don't add if type is guid or if name is ClientName or OccurDate
                    if (name !== "ClientName" && name !== "OccurDate") {
                        //add field to list
                        newFields.push(name.replace(/_/g, ' ')); //replace "_" with " "
                    }
                }

                //combine the fields in fieldList with newFields
                var allFields = fieldList.concat(newFields);

                var j, options = [];
                for (j = 0; j < allFields.length; j++) {
                    options[j] = {name: allFields[j], data: allFields[j]};
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
        }
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});