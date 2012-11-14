'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore"], function ($, importerUpload, dbServices, _) {
    var importerSelect = {}, previousSelectedFields,
        SelectedFieldTracker = [
            [[false, false]], //Phone
            [[false, false]], //Email
            [[false, false]], //Website
            [[false, false]]  //Other
        ];

    var formatDataForValidation = function (data) {
        var selectPage = $("#importerSelect");
        var headersIncluded = selectPage.find(".switch .on").hasClass("active");
        var selectedFields = [];
        //create an array of the fields to be used(based on the dropdowns)
        selectPage.find(".select2-container").each(function () {
            var value = $(this).select2("val"), name;
            //change to the names needed for the API
            if (value === "Address Line 1") {
                name = "Address Line One";
            } else if (value === "Address Line 2") {
                name = "Address Line Two";
            } else if (value === "City") {
                name = "AdminDistrictTwo";
            } else if (value === "State") {
                name = "AdminDistrictOne";
            } else if (value === "Zipcode") {
                name = "PostalCode";
            } else {
                name = value;
            }
            if (value !== "Do not Import") {
                selectedFields.push({name: name, selected: true});
            } else {
                selectedFields.push(false);
            }
        });

        var dataToValidate = [], row;
        //iterate through each row of the data
        for (var r in data) {
            row = data[r];
            var newArray = [];
            //iterate through each column of the current row
            for (var c in row) {
                //if the field is to be imported(if "Do not Import" wasn't selected for this row)
                if (selectedFields[c]) {
                    //use the header from the dropdown instead of their header
                    if (r == 0 && headersIncluded) {
                        newArray.push(selectedFields[c].name);
                    } else {
                        newArray.push(row[c]);
                    }
                }
            }

            dataToValidate.push(newArray);
        }

        //if headers are not included, add an extra row for the headers
        if (!headersIncluded) {
            var length = selectedFields.length, headerRow = [];
            for (var i = 0; i < length; i++) {
                if (selectedFields[i]) {
                    headerRow.push(selectedFields[i].name);
                }
            }
            dataToValidate.unshift(headerRow);
        }

        return dataToValidate;
    };

    /**
     * Checks if the passed field name is in the given list
     * @param {array} list
     * @param {string} name
     */
    var findField = function (list, name) {
        return _.find(list, function (field) {
            return field.id === name;
        });
    };

    /**
     * Checks if the passed field is a contact info field
     * @param {string} field
     */
    var isContactInfoField = function (field) {
        return (field.indexOf("Value") != -1 || field.indexOf("Label") != -1) &&
            (field.indexOf("Phone") != -1 || field.indexOf("Email") != -1 || field.indexOf("Website") != -1 || field.indexOf("Other") != -1);
    };

    /**
     * Selects the array to use based on the type of contact info
     * @param {string} label
     * @return {array} selectedArray
     */
    var getSelectedContactInfoArray = function (label) {
        var selectedArray;
        if (label === "Phone") {
            selectedArray = SelectedFieldTracker[0];
        } else if (label === "Email") {
            selectedArray = SelectedFieldTracker[1];
        } else if (label === "Website") {
            selectedArray = SelectedFieldTracker[2];
        } else {
            selectedArray = SelectedFieldTracker[3];
        }
        return selectedArray;
    };

    /**
     * @param {string} field
     * @param {boolean} value
     */
    var updateSelectedFieldTracker = function (field, value) {
        var selectedArray,  selectedRow;
        //get the number from the field(ex. if field is "Phone Label 1", oldNum is 1)
        var oldNum = parseInt(field.match(/\s([0-9]*)$/));
        //get the label(ex. "Phone")
        var label = field.match(/^(.*?)\s/)[1];
        //get the correct array to use
        selectedArray = getSelectedContactInfoArray(label);
        //get the appropriate row
        selectedRow = selectedArray[oldNum - 1];
        var indexToUpdate;
        //check if the field is a label or a value
        if (field.indexOf("Label") != -1) {
            indexToUpdate = 0;
        } else {
            indexToUpdate = 1;
        }
        //update the associated SelectedFieldTracker value
        selectedRow[indexToUpdate] = value;
    };

    var updateSelectedFields = function () {
        importerSelect.currentFields = importerSelect.allFields.slice();
        var currentSelectedFields = [], dropdowns = $("#importerSelect").find(".select2-container");
        //create a list of the already selected fields
        dropdowns.each(function () {
            currentSelectedFields.push($(this).select2("val"));
        });

        var field,
            mainGroup = importerSelect.currentFields[0].children,
            locationGroup = importerSelect.currentFields[1].children,
            contactInfoGroup = importerSelect.currentFields[2].children,
            serviceGroup = importerSelect.currentFields[3].children,
            fieldsGroup = importerSelect.currentFields[4].children;

        for (var i in currentSelectedFields) {
            if (currentSelectedFields[i] !== "Do not Import") {
                field = currentSelectedFields[i];
                //if last value was a contactInfo field
                if (isContactInfoField(previousSelectedFields[i])&& (currentSelectedFields[i] !== previousSelectedFields[i])) {
                    updateSelectedFieldTracker(field, false);
                }

                //find which group the selected field is in, and remove it from that group
                if (findField(mainGroup, field)) {
                    mainGroup = _(mainGroup).reject(function(el) { return el.id === field; });
                } else if (findField(locationGroup, field)) {
                    locationGroup = _(locationGroup).reject(function(el) { return el.id === field; });
                } else if (isContactInfoField(field)) {
                    //remove the selected field from the list
                    contactInfoGroup = _(contactInfoGroup).reject(function(el) { return el.id === field; });
                    //Rule 1: Last row of array must be [false, false]
                    //Rule 2: If there are any double falses other than the bottom row, remove it and decrement all greater indexes

                    //check for empty rows([false, false])
                    //iterate through each type
                    var type;
//                    for (var j in SelectedFieldTracker) {
//                        type = SelectedFieldTracker[j];
//                        var row;
//                        //iterate through the rows
//                        for (var k in type) {
//                            row = type[k];
//                            //if both values are false and this isn't the last row
//                            if (!(row[0] || row[1]) && (k !== type.length - 1)) {
//                                //remove it
//                                type.splice(k, 1);
//
//                                //decremnt all greater indexes
//
//
//                            }
//                        }
//                    }

                    //find correct array to use(ex. "SelectedPhoneFields")
                    var selectedArray, selectedRow;
                    //get the label that was selected(ex. "Phone")
                    var label = field.match(/^(.*?)\s/)[1];
                    //get the number from the field(ex. if field is "Phone Label 1", oldNum is 1)
                    var oldNum = parseInt(field.match(/\s([0-9]*)$/));

                    selectedArray = getSelectedContactInfoArray(label);
                    selectedRow = selectedArray[oldNum - 1];

                    updateSelectedFieldTracker(field, true);

                    //add additional options base on the field selected
                    //ex. if "Phone Label 1" was selected, add "Phone Label 2" and "Phone Value 2"

                    var newNum = oldNum + 1;
                    //if so, add the new options
                    if ((selectedRow[0] || selectedRow[1])) {
                        //add the new options
                        contactInfoGroup.push({id: label + " Label " + newNum}, {id: label + " Value " + newNum});
                        //update the tracker with a new row
                        selectedArray.push([false, false]);
                    }


                } else if (findField(serviceGroup, field)) {
                    serviceGroup = _(serviceGroup).reject(function(el) { return el.id === field; });
                } else if (findField(fieldsGroup, field)) {
                    fieldsGroup = _(fieldsGroup).reject(function(el) { return el.id === field; });
                }
            }
            importerSelect.currentFields = [
                {text: "", children: mainGroup},
                {text: "Location", children: locationGroup},
                {text: "Contact Info", children: contactInfoGroup},
                {text: "Service", children: serviceGroup},
                {text: "Fields", children: fieldsGroup}
            ];
        }

        //update the list of the currently selected fields
        previousSelectedFields = [];
        dropdowns.each(function () {
            previousSelectedFields.push($(this).select2("val"));
        });
    };

    importerSelect.initialize = function () {
        //make sure there is a selected service type
        if (!importerUpload.selectedService) {
            window.viewImporterUpload();
        }

        $("#importerSelect").find(".saveBtn").on("click", function () {
            var dataToValidate = formatDataForValidation(importerUpload.oldData);

            dbServices.suggestions.update({body: {rowsWithHeaders: dataToValidate}}).done(function (suggestions) {
                importerSelect.gridData = suggestions;
                window.viewImporterReview();
            });
        });
    };

    importerSelect.show = function () {
        //setup the default fields
        var fieldList = [
            {text: "", children: [
                {id: "Do not Import"},
                {id: 'Client Name'}
            ]},
            {text: "Location", children: [
                {id: 'Address Line 1'},
                {id: 'Address Line 2'},
                {id: 'City'},
                {id: 'State'},
                {id: 'Zipcode'},
                {id: 'Region Name'}
            ]},
            {text: "Contact Info", children: [
                {id: 'Phone Label 1'},
                {id: 'Phone Value 1'},
                {id: 'Email Label 1'},
                {id: 'Email Value 1'},
                {id: 'Website Label 1'},
                {id: 'Website Value 1'},
                {id: 'Other Label 1'},
                {id: 'Other Value 1'}
            ]},
            {text: "Service", children: [
                {id: 'Frequency'},
                {id: 'Frequency Detail'},
                {id: 'Repeat Every'},
                {id: 'Start Date'},
                {id: 'End Date'}
            ]}
        ];

        $("#listView").kendoListView({
            //setup the template to only include the header and the first row of data
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><div class='styled-select'></div></li>",
            dataSource: importerUpload.data
        });

        //setup toggle switch states
        var selectPage = $("#importerSelect");
        var on = selectPage.find(".switch .on");
        var off = selectPage.find(".switch .off");
        on.on("click", function () {
            off.removeClass("active");
            on.addClass("active");
            $("#importerSelect").find("#dynamicHeader span")[0].innerText = "Row 1";
        });
        off.on("click", function () {
            on.removeClass("active");
            off.addClass("active");
            $("#importerSelect").find("#dynamicHeader span")[0].innerText = "Row 2";
        });

        //get the list of fields for the selected service(for the dropdowns)
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
                        newFields.push({id: name.replace(/_/g, ' ')}); //replace "_" with " "
                    }
                }

                //combine the fields in fieldList with newFields
                importerSelect.allFields = importerSelect.currentFields = fieldList.concat({text: "Fields", children: newFields});

                //function to format the option names of the frequency and end Date dropdowns
                var formatItemName = function (item) {
                    if (item.text) {
                        return item.text;
                    }

                    return item.id;
                };

                $("#importerSelect").find(".styled-select").select2({
                    placeholder: "",
                    minimumResultsForSearch: 200,
                    query: function (query) {
                        if (!importerSelect.currentFields) {
                            importerSelect.currentFields = [];
                        }
                        var data = {results: importerSelect.currentFields};
                        query.callback(data);
                    },
                    formatSelection: formatItemName,
                    formatResult: formatItemName,
                    dropdownCssClass: "bigdrop"
                }).on("open", function () {
                        //force rerender
                        setTimeout(function () {
                            $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "scroll";
                            setTimeout(function () {
                                $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "auto";
                            }, 100);
                        }, 100);
                    }).on("change", function () {
                        updateSelectedFields();
                    });
                var findMatch = function (header) {
                    var match1 = findField(importerSelect.allFields[0].children, header);
                    var match2 = findField(importerSelect.allFields[1].children, header);
                    var match3 = findField(importerSelect.allFields[2].children, header);
                    var match4 = findField(importerSelect.allFields[3].children, header);
                    var match5 = findField(importerSelect.allFields[4].children, header);

                    return match1 || match2 || match3 || match4 || match5;
                };


                //automatically select fields if there is a matching header
                var dropdown, headers = importerUpload.oldData[0];
                previousSelectedFields = [];
                for (var h in headers) {
                    dropdown = $("#importerSelect .select2-container:eq(" + h + ")");
                    //select if text matches corresponding header

                    if (findMatch(headers[h])) {
                        dropdown.select2("data", {id: headers[h]});
                        previousSelectedFields.push(headers[h]);
                    } else {
                        dropdown.select2("data", {id: "Do not Import"});
                        previousSelectedFields.push("Do not Import");
                    }
                }
                updateSelectedFields();
            });
        }
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});