'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore"], function ($, importerUpload, dbServices, _) {
    var importerSelect = {};

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

    var findField = function (list, name) {
        return _.find(list, function (field) {
            return field.id === name;
        });
    };

    var removeSelectedFields = function () {
        importerSelect.currentFields = importerSelect.allFields.slice();
        var selectedFields = [];
        //create a list of the already selected fields
        $("#importerSelect").find(".select2-container").each(function () {
            var value = $(this).select2("val");
            if (value !== "Do not Import") {
                selectedFields.push(value);
            }
        });

        //remove the selected fields from importerSelect.currentFields
        var field,
            mainGroup = importerSelect.currentFields[0].children,
            locationGroup = importerSelect.currentFields[1].children,
            contactInfoGroup = importerSelect.currentFields[2].children,
            serviceGroup = importerSelect.currentFields[3].children,
            fieldsGroup = importerSelect.currentFields[4].children;

        for (var i in selectedFields) {
            field = selectedFields[i];
            //find which group the selected field is in, and remove it from that group
            if (findField(mainGroup, field)) {
                mainGroup = _(mainGroup).reject(function(el) { return el.id === field; });
            } else if (findField(locationGroup, field)) {
                locationGroup = _(locationGroup).reject(function(el) { return el.id === field; });
            } else if (findField(contactInfoGroup, field)) {
                //remove the selected field from the list
                contactInfoGroup = _(contactInfoGroup).reject(function(el) { return el.id === field; });
                //add additional options base on the field selected
                //ex. if "Phone Label 1" was selected, add "Phone Label 2" and "Phone Value 2"
                var oldNum = parseInt(field.charAt( field.length - 1 ));
                //get the new number to use
                var newNum = oldNum + 1;
                //get the label that was selected(ex. "Phone")
                var label = field.match(/^(.*?)\s/)[1];
                //check if this was the first option of it's pair to be selected
                var labelToCheck = label + " Label " + oldNum;
                var valueToCheck = label + " Value " + oldNum;
                var labelExists = findField(contactInfoGroup, labelToCheck);
                var valueExists = findField(contactInfoGroup, valueToCheck);
                //if so, add the new options
                if (labelExists || valueExists) {
                    contactInfoGroup.push({id: label + " Label " + newNum}, {id: label + " Value " + newNum});
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
        console.log(importerSelect.currentFields);
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
                        removeSelectedFields();
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
                for (var h in headers) {
                    dropdown = $("#importerSelect .select2-container:eq(" + h + ")");
                    //select if text matches corresponding header

                    if (findMatch(headers[h])) {
                        dropdown.select2("data", {id: headers[h]});
                    } else {
                        dropdown.select2("data", {id: "Do not Import"});
                    }
                }
                removeSelectedFields();
            });
        }
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});