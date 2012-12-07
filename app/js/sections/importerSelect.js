'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore", "tools/generalTools"], function ($, importerUpload, dbServices, _, generalTools) {
    var importerSelect = {}, previousSelectedFields, originalFieldGroups, currentFieldGroups,
        trackerTypes = {
            Phone: "Phone",
            Email: "Email",
            Website: "Website",
            Other: "Other"
        },
    //tracks the selected indexes of contact info types
    //used to keep the contact info in order (Phone Label 1, Phone Label 2, etc)
        selectionTrackers = [
            [
                [false, false, trackerTypes.Phone]
            ],
            [
                [false, false, trackerTypes.Email]
            ],
            [
                [false, false, trackerTypes.Website]
            ],
            [
                [false, false, trackerTypes.Other]
            ]
        ];

    //region Update Selectable Fields

    /**
     * Add the unselectedField back to the options (currentFieldGroups)
     * @param unselectedField
     */
    var addBackUnselectedField = function (unselectedField) {
        //add back the option if it was unselected (except "Do not import" and on initial load)
        if (unselectedField !== "Do not Import" && unselectedField !== "") {
            var lastIndex = -1, lastGroupName = "";

            //find the group that lastField belongs to
            var lastGroup = _.find(originalFieldGroups, function (group) {
                //keep track of the index to use in order to get the entire field object
                lastIndex = -1;
                return _.find(group, function (el) {
                    lastIndex++;
                    //get the group name
                    lastGroupName = el.group;
                    return el.id === unselectedField;
                });
            });

            var indexToInsert;
            //determine the index in which to insert the field
            for (var i in currentFieldGroups[lastGroupName]) {
                var field = currentFieldGroups[lastGroupName][i];
                //find the first field in the current group whos order is above lastIndex
                if (field.order >= lastIndex) {
                    indexToInsert = i;
                    break;
                }
            }

            //insert last field to its original position
            currentFieldGroups[lastGroupName].splice(indexToInsert, 0, lastGroup[lastIndex]);
        }
    };

    //region Contact Info Methods

    /**
     * Checks if the passed field is a contact info field
     * @param {string} field
     */
    var isContactInfoField = function (field) {
        return (field.indexOf("Value") != -1 || field.indexOf("Label") != -1) &&
            (field.indexOf("Phone") != -1 || field.indexOf("Email") != -1 || field.indexOf("Website") != -1 || field.indexOf("Other") != -1);
    };

    /**
     * Get the field type
     * @param contactInfoField
     * @return {string} Ex. Phone
     */
    var contactInfoType = function (contactInfoField) {
        //regex gets "Phone" from "Phone Label 1"
        return contactInfoField.match(/^(.*?)\s/)[1];
    };

    /**
     * Get the field number
     * @param contactInfoField
     * @return {number}
     */
    var contactInfoNumber = function (contactInfoField) {
        return parseInt(contactInfoField.match(/\s([0-9]*)$/)[1]);
    };

    /**
     * Get the trackers for a contactInfo type
     * @param type Ex. Phone
     * @return {Array.<Array.<boolean>>}
     */
    var getContactInfoTrackers = function (type){
        var typeTrackers;

        //get the correct array to use
        if (type === trackerTypes.Phone) {
            typeTrackers = selectionTrackers[0];
        } else if (type === trackerTypes.Email) {
            typeTrackers = selectionTrackers[1];
        } else if (type === trackerTypes.Website) {
            typeTrackers = selectionTrackers[2];
        } else {
            typeTrackers = selectionTrackers[3];
        }

        return typeTrackers;
    };

    /**
     * Update the contact info selection tracker for the passed field
     * @param {string} contactInfoField
     */
    var updateContactInfoTracking = function (contactInfoField) {
        //get the number from the field (ex. if field is "Phone Label 1", num is 1)
        var num = contactInfoNumber(contactInfoField);

        var type = contactInfoType(contactInfoField);
        var trackers = getContactInfoTrackers(type);

        //get the appropriate row
        var trackerRow = trackers[num - 1];

        var indexToUpdate;

        //check if the field is a label or a value
        if (contactInfoField.indexOf("Label") != -1) {
            indexToUpdate = 0;
        } else {
            indexToUpdate = 1;
        }

        //update the associated tracker row
        trackerRow[indexToUpdate] = !trackerRow[indexToUpdate];
    };

    /**
     * Update the available contact info fields
     * @param lastField
     * @param newField
     */
    var updateContactInfoFields = function (lastField, newField) {
        //update the trackers
        if (isContactInfoField(lastField)) {
            updateContactInfoTracking(lastField);
        }
        if (isContactInfoField(newField)) {
            updateContactInfoTracking(newField);
        }

        if (isContactInfoField(newField)) {
            //Make sure there is still an available contact info at the bottom. Otherwise insert one
            //(the last row of the tracker array should be [false, false])

            var type = contactInfoType(newField);
            var tracker = getContactInfoTrackers(type);

            //check the last row is available [false, false], if not add a new option
            //ex. if "Phone Label 1" was selected, add "Phone Label 2" and "Phone Value 2"
            var lastSelection = tracker[tracker.length - 1];
            if (lastSelection[0] || lastSelection[1]) {
                tracker.push([false, false, type]);
                currentFieldGroups.contactInfo.push(
                    {id: type + " Label " + tracker.length, order: currentFieldGroups.contactInfo, group: "contactInfo"},
                    {id: type + " Value " + tracker.length, order: currentFieldGroups.contactInfo + 1, group: "contactInfo"}
                );
            }
        }

        if (isContactInfoField(lastField)) {
            //search the contact info group the lastField was removed from
            //to see if there is no label or value selected

            //if neither are selected and it is not the last tracker:
            //a) remove the selectedTracker
            //b) decrement any contact info of the same type that have a > index
//
//            //check for empty rows
//            for (var s in selectionTrackers) {
//                var group = selectionTrackers[s];
//                var row;
//                for (var g in group) {
//                    row = group[g];
//                    //if both values are false and this isn't the last row
//                    if (!row[0] && !row[1] && g != group.length - 1) {
//                        var infoType = row[2];
//                        var num = parseInt(g) + 1;
//
//                        var decrementStartIndex = -1;
//                        var typeToDecrement = "";
//                        //remove the unused set from currentFieldGroups.contactInfo
//                        for (var c in currentFieldGroups.contactInfo) {
//                            //find the occurrences(2) that match the num and infoType
//                            if (currentFieldGroups.contactInfo[c].id.indexOf(infoType) !== -1 && currentFieldGroups.contactInfo[c].id.match(/\s([0-9]*)$/)[1] === num.toString()) {
//                                //remove them from the list
//                                currentFieldGroups.contactInfo.splice(c, 2);
//                                decrementStartIndex = c;
//                                //get the type(ex. "Phone")
//                                typeToDecrement = currentFieldGroups.contactInfo[c].id.match(/^(.*?)\s/)[1];
//                                break;
//                            }
//                        }
//                        for (var ci in currentFieldGroups.contactInfo) {
//                            var fieldName = currentFieldGroups.contactInfo[ci].id;
//                            //if the current index is at or above decrementStartIndex and this is the correct contactInfo type
//                            if (ci >= decrementStartIndex && fieldName.match(/^(.*?)\s/)[1] === typeToDecrement) {
//                                //decrement higher numbered fields in the contactInfo list
//                                //get the number from the field(ex. if fieldName is "Phone Label 1", oldIndex is 1)
//                                var oldIndex = fieldName.match(/\s([0-9]*)$/)[1];
//                                //decrement the number
//                                var newIndex = parseInt(oldIndex) - 1;
//                                //replace the old name with the new name
//                                currentFieldGroups.contactInfo[ci].id = fieldName.replace(oldIndex, newIndex.toString());
//
//                                //decrement already selected dropdown values that match the field
//
//                            }
//                        }
//                        //remove the corresponding row from the tracker
//                        group.splice(g, 1);
//                    }
//                }
//            }
        }
    };

    //endregion

    //update the available fields every time a field is selected
    var updateSelectableFields = function () {
        var selectedFields = [], dropdowns = $("#importerSelect").find(".select2-container");

        //create a list of the selected fields
        dropdowns.each(function () {
            selectedFields.push($(this).select2("val"));
        });

        //find the changed field
        var fieldIndex = -1;
        var newField = _.find(selectedFields, function (field) {
            fieldIndex++;
            return field !== previousSelectedFields[fieldIndex];
        });

        //if a field changed, update the available fields
        if (newField) {
            var lastField = previousSelectedFields[fieldIndex];

            addBackUnselectedField(lastField);

            //remove the new field from groups
            _.each(currentFieldGroups, function (group, key) {
                currentFieldGroups[key] = _.reject(group, function (el) {
                    return el.id === newField && newField !== "Do not Import";
                });
            });

            //update the contact info options
            if (isContactInfoField(lastField) || isContactInfoField(newField)) {
                updateContactInfoFields(lastField, newField);
            }
        }

        importerSelect.currentFields = [
            {text: "", children: currentFieldGroups.main},
            {text: "Location", children: currentFieldGroups.location},
            {text: "Contact Info", children: currentFieldGroups.contactInfo},
            {text: "Service Schedule", children: currentFieldGroups.service},
            {text: "Service Fields", children: currentFieldGroups.fields}
        ];

        //store the selected fields
        previousSelectedFields = [];
        dropdowns.each(function () {
            previousSelectedFields.push($(this).select2("val"));
        });
    };

    //endregion

    //TODO CR: Better explanation
    var formatDataForValidation = function (data) {
        var selectPage = $("#importerSelect");
        //check value of toggle switch to know if headers should be included
        var headersIncluded = selectPage.find(".switch .on").hasClass("active");
        var selectedFields = [];
        //create an array of the fields to be used (based on the drop downs)
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
                //if the field is to be imported ("Do not Import" wasn't selected for this row)
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

        //if the headers are not included, insert an extra row for the headers
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

    //resize the list based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 275;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $("#importerSelect").find('#listView').css("maxHeight", contentHeight + 'px');
    };

    //turn the first two rows sideways for the next page's headers
    //ex. [{"Client Name", "City", "State"}, {"Burger King", "Lafeyette", "IN"}] becomes [{"Client Name", "Burger King"}, {"City", "Lafeyette"}, {"State", "IN"}]
    //http://stackoverflow.com/questions/5971389/convert-array-of-rows-to-array-of-columns
    var getHeadersWithExample = function (data) {
        var newData = [];
        data = data.slice(0, 2);
        for (var i = 0; i < data[0].length; i++) {
            newData.push([data[0][i], data[1][i]]);
        }
        return newData;
    };

    importerSelect.initialize = function () {
        //on save button click
        $("#importerSelect").find(".saveBtn").on("click", function () {
            importerSelect.dataToValidate = formatDataForValidation(importerUpload.uploadedData);

            //submit data to be validated, then redirect to review page
            dbServices.suggestions.update({body: {rowsWithHeaders: importerSelect.dataToValidate}}).done(function (suggestions) {
                importerSelect.gridData = suggestions;
                window.viewImporterReview();
            });
        });

        $(window).resize(function () {
            resizeGrid();
        });
    };

    importerSelect.show = function () {
        //make sure there is a selected service type
        if (!importerUpload.selectedService) {
            window.viewImporterUpload();
            return;
        }

        //setup the default fields
        var defaultFields = [
            {text: "", children: [
                {id: "Do not Import", order: 0, group: "main"},
                {id: 'Client Name', order: 1, group: "main"}
            ]},
            {text: "Location", children: [
                {id: 'Address Line 1', order: 0, group: "location"},
                {id: 'Address Line 2', order: 1, group: "location"},
                {id: 'City', order: 2, group: "location"},
                {id: 'State', order: 3, group: "location"},
                {id: 'Zipcode', order: 4, group: "location"},
                {id: 'Region Name', order: 5, group: "location"}
            ]},
            {text: "Contact Info", children: [
                {id: 'Phone Label 1', order: 0, group: "contactInfo"},
                {id: 'Phone Value 1', order: 1, group: "contactInfo"},
                {id: 'Email Label 1', order: 2, group: "contactInfo"},
                {id: 'Email Value 1', order: 3, group: "contactInfo"},
                {id: 'Website Label 1', order: 4, group: "contactInfo"},
                {id: 'Website Value 1', order: 5, group: "contactInfo"},
                {id: 'Other Label 1', order: 6, group: "contactInfo"},
                {id: 'Other Value 1', order: 7, group: "contactInfo"}
            ]},
            {text: "Service Schedule", children: [
                {id: 'Frequency', order: 0, group: "service"},
                {id: 'Frequency Detail', order: 1, group: "service"},
                {id: 'Repeat Every', order: 2, group: "service"},
                {id: 'Start Date', order: 3, group: "service"},
                {id: 'End Date', order: 4, group: "service"}
            ]}
        ];

        //setup the listview
        $("#listView").kendoListView({
            //setup the template to only include the header and the first row of data
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><div class='styled-select'></div></li>",
            dataSource: getHeadersWithExample(importerUpload.uploadedData)
        });

        resizeGrid();

        //setup toggle switch states
        var selectPage = $("#importerSelect");
        var on = selectPage.find(".switch .on");
        var off = selectPage.find(".switch .off");
        on.on("click", function () {
            off.removeClass("active");
            on.addClass("active");
            selectPage.find(".toggle").animate({left: "36px"}, 250, "easeInOutQuad");
            selectPage.find("#dynamicHeader span")[0].innerText = "Row 1";
        });
        off.on("click", function () {
            on.removeClass("active");
            off.addClass("active");
            selectPage.find(".toggle").animate({left: "107px"}, 250, "easeInOutQuad");
            selectPage.find("#dynamicHeader span")[0].innerText = "Row 2";
        });

        //get the list of fields for the selected service(for the dropdowns)
        if (importerUpload.selectedService) {
            dbServices.services.read({params: {serviceTemplateId: importerUpload.selectedService.Id}}).done(function (service) {
                var serviceFields = [], name, page = $("#importerSelect");
                var fields = service[0].Fields;
                //iterate throught the list of fields
                for (var i in fields) {
                    name = fields[i].Name;
                    //don't add if type is guid or if name is ClientName or OccurDate
                    if (name !== "ClientName" && name !== "OccurDate") {
                        //add field to list
                        serviceFields.push({id: name.replace(/_/g, ' '), order: i, group: "fields"}); //replace "_" with " "
                    }
                }

                //reset the fields list
                importerSelect.allFields = importerSelect.currentFields = defaultFields.concat({text: "Service Fields", children: serviceFields});

                //function to format the option names of the frequency and end Date dropdowns
                var formatItemName = function (item) {
                    if (item.text) {
                        return item.text;
                    }

                    return item.id;
                };

                page.find(".styled-select").select2({
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
                }).on("open",function () {
                        //force rerender
                        setTimeout(function () {
                            $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "scroll";
                            setTimeout(function () {
                                $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "auto";
                            }, 100);
                        }, 100);
                    }).on("change", function () {
                        updateSelectableFields();
                    });

                //reset the current groups
                currentFieldGroups = {
                    main: importerSelect.allFields[0].children,
                    location: importerSelect.allFields[1].children,
                    contactInfo: importerSelect.allFields[2].children,
                    service: importerSelect.allFields[3].children,
                    fields: importerSelect.allFields[4].children
                };

                originalFieldGroups = generalTools.deepClone(currentFieldGroups);

                /**
                 * checks if the field exists in the groups of fields
                 * @param {string} field
                 * @return {boolean}
                 */
                var findMatch = function (field) {
                    return _.any(currentFieldGroups, function (group) {
                        return _.any(group, function (el) {
                            return el.id === field;
                        });
                    });
                };

                //automatically select fields if there is a matching header
                var dropdown, headers = importerUpload.uploadedData[0];
                previousSelectedFields = [];
                for (var h in headers) {
                    dropdown = page.find(".select2-container:eq(" + h + ")");
                    //select if text matches corresponding header
                    if (findMatch(headers[h])) {
                        dropdown.select2("data", {id: headers[h]});
                        previousSelectedFields.push(headers[h]);
                    } else {
                        dropdown.select2("data", {id: "Do not Import"});
                        previousSelectedFields.push("Do not Import");
                    }

                    updateSelectableFields();
                }
            });
        }
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});