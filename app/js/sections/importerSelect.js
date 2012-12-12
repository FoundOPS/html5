'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore", "tools/generalTools"], function ($, importerUpload, dbServices, _, generalTools) {
        var importerSelect = {},
        //a jquery selector for this page
            page,
        //the currently selected fields
            currentFields,
        //the default fields
            defaultFields = [
                {text: "Do not Import", group: 0},
                {text: "Client Name", group: 0},
                //Location
                {text: "Address Line 1", group: 1},
                {text: "Address Line 2", group: 1},
                {text: "City", group: 1},
                {text: "State", group: 1},
                {text: "Zipcode", group: 1},
                {text: "Region Name", group: 1},
                //Contact Info will automatically be generated in setupFieldGroups, below is an example set
                //{text: "Phone Label 2", group: 2, contactInfo: { category: 0, type: 0, number: 2 }},
                //{text: "Phone Value 2", group: 2, contactInfo: { category: 0, type: 1, number: 2 }},
                //Service Schedule
                {text: "Frequency", group: 3},
                {text: "Frequency Detail", group: 3},
                {text: "Repeat Every", group: 3},
                {text: "Start Date", group: 3},
                {text: "End Date", group: 3}
            ];

        //region Field List logic, Selecting / Adding & Removing Items

        /**
         * Setup the available fields by merging default fields with the service's fields to add
         * @param serviceFieldsToAdd The service's fields to add
         */
        var setupAvailableFields = function (serviceFieldsToAdd) {
            var serviceFields = [], name;

            if (serviceFieldsToAdd) {
                for (var i in serviceFieldsToAdd) {
                    name = serviceFieldsToAdd[i].Name;
                    //don't add if name is ClientName or OccurDate
                    if (name !== "ClientName" && name !== "OccurDate") {
                        serviceFields.push({
                            //replace "_" with " "
                            text: name.replace(/_/g, ' '),
                            group: 4
                        });
                    }
                }
            }

            currentFields = generalTools.deepClone(defaultFields).concat(serviceFields);
        };

        //region Contact info field logic

        /**
         * Returns the contact info fields for a category. Grouped by number
         * @param category
         */
        var contactInfoCategory = function (category) {
            //group the contact info fields by category
            var contactInfoFields = _.filter(currentFields, function (field) {
                return field.contactInfo && field.contactInfo.category === category;
            });

            //then group them by their number
            var indexed = _.groupBy(contactInfoFields, function (field) {
                return field.contactInfo.number;
            });

            return indexed;
        };

        /**
         * Generate the contact info field text
         * @param options {{category: string, type: string, number: number}}
         */
        var contactInfoText = function (options) {
            var categories = { 0: "Phone", 1: "Email", 2: "Website", 3: "Other" };
            var types = { 0: "Label", 1: "Value" };

            var text = categories[options.category] + " " + types[options.type] + " " + options.number;
            return text;
        };

        /**
         * Inserts a contact info field based on the options
         * @param options {{category: string, type: string, number: number}}
         */
        var insertContactInfo = function (options) {
            var fieldToInsert = {text: contactInfoText(options), group: 2, contactInfo: options};

            //find the right place to insert the contact info
            var insertIndex;
            for (insertIndex in currentFields) {
                var nextField = currentFields[insertIndex];

                //if the next field is a contact info field
                if (nextField.group === 2) {
                    //if it is the same category
                    if (nextField.contactInfo.category === options.category) {
                        //if it is the same number and this is a label, insert here
                        if (nextField.contactInfo.number === options.number && options.type === 0) {
                            break;
                        }

                        //if it is the next number, insert here
                        if (nextField.contactInfo.number > options.number) {
                            break;
                        }
                    }

                    //if it is the next category, insert here
                    if (nextField.contactInfo.category > options.category) {
                        break;
                    }
                }

                //if the next field is no longer contact info, insert here
                if (nextField.group > 2) {
                    break;
                }

                //continue moving to the next field
            }

            //insert the field
            currentFields.splice(insertIndex, 0, fieldToInsert);
        };

        /**
         * Inserts a contact info field set (label & value) from the parameters
         * @param category Ex. 0 = (Phone)
         * @param number
         */
        var insertContactInfoSet = function (category, number) {
            insertContactInfo({category: category, type: 0, number: number});
            insertContactInfo({category: category, type: 1, number: number});
        };

        /**
         * Removes a contact info set and
         * decrements contact info of the same category greater than the number
         * @param category Ex. 0 = (Phone)
         * @param number
         */
        var removeContactInfoSet = function (category, number) {
            var contactInfos = contactInfoCategory(category);
            var length = _.keys(contactInfos).length;

            //remove the label & value
            for (var j = 0; j < currentFields.length; j++) {
                var field = currentFields[j];
                if (field.contactInfo && field.contactInfo.category === category
                    && field.contactInfo.number === number) {
                    currentFields.splice(j, 1);
                    currentFields.splice(j, 1);
                    break;
                }
            }

            var selects = page.find(".select2-container");

            //go through all greater indexes and decrement the fields
            for (var i = number + 1; i <= length; i++) {
                var fieldsToDecrement = contactInfos[i];

                var labelField = fieldsToDecrement[0];
                var valueField = fieldsToDecrement[1];

                //change the currentFields numbers
                labelField.contactInfo.number -= 1;
                valueField.contactInfo.number -= 1;

                var newLabel = contactInfoText(fieldsToDecrement[0].contactInfo);
                var newValue = contactInfoText(fieldsToDecrement[1].contactInfo);

                //change the selects values
                selects.each(function () {
                    var val = $(this).select2("val");
                    if (val === labelField.text) {
                        $(this).select2("data", {id: newLabel, text: newLabel});
                    } else if (val === valueField.text) {
                        $(this).select2("data", {id: newValue, text: newValue});
                    }
                });

                //change the currentFields text
                labelField.text = newLabel;
                valueField.text = newValue;
            }
        };


        /**
         * For each contact info category make sure:
         * a) there is an available set (label and value) at the end
         * b) there are no extra available set in the middle
         */
        var updateContactInfoFields = function () {
            for (var c = 0; c < 4; c++) {
                var indexed = contactInfoCategory(c);

                var lastNumber = _.keys(indexed).length;
                //a) make sure there is an available set at the end
                if (//check there is an initial set
                    !lastNumber ||
                        //then check the last set is fully available
                        indexed[lastNumber][0].selected || indexed[lastNumber][1].selected) {

                    //if not add another contact info set
                    insertContactInfoSet(c, lastNumber + 1);
                }

                //reset indexed/lastNumber after inserts
                indexed = contactInfoCategory(c);
                lastNumber = _.keys(indexed).length;

                //b) remove any extra available sets in the middle
                for (var n = 1; n < lastNumber; n++) {
                    if (!indexed[n][0].selected && !indexed[n][1].selected) {
                        removeContactInfoSet(c, n);
                    }
                }
            }
        };

        //endregion

        /**
         * Formats currentFields to field groups for the select2
         */
        var setupFieldGroups = function () {
            var fieldGroups = [
                {text: "", children: []},
                {text: "Location", children: []},
                {text: "Contact Info", children: []},
                {text: "Service Schedule", children: []},
                {text: "Service Fields", children: []}
            ];

            updateContactInfoFields();

            //build the field groups from the available (not selected) fields
            for (var i in currentFields) {
                var field = currentFields[i];

                //exclude selected fields (except Do not Import)
                if (field.selected && field.text !== "Do not Import") {
                    continue;
                }

                //add the field, need to set id so it is selectable for the select2
                fieldGroups[field.group].children.push({id: field.text, text: field.text});
            }

            importerSelect.fieldGroups = fieldGroups;
        };

        /**
         * Select fields where there are matching headers
         */
        var matchHeaders = function () {
            var headers = importerUpload.uploadedData[0];
            for (var h in headers) {
                var header = headers[h],
                    match = false,
                    dropDown = page.find(".select2-container:eq(" + h + ")");

                for (var i in currentFields) {
                    var field = currentFields[i];

                    //cannot select already selected field
                    if (field.selected) {
                        continue;
                    }

                    //if text matches corresponding header, select the header
                    if (field.text === header) {
                        field.selected = true;
                        dropDown.select2("data", {id: field.text, text: field.text});
                        match = true;
                        break;
                    }
                }

                if (!match) {
                    dropDown.select2("data", {id: "Do not Import", text: "Do not Import"});
                }
            }
        };

        /**
         * Setup the header field selectors
         */
        var setupSelectors = function () {
            var formatItemName = function (item) {
                return item.text;
            };

            page.find(".styled-select").select2({
                placeholder: "",
                minimumResultsForSearch: 200,
                query: function (query) {
                    if (!importerSelect.fieldGroups) {
                        importerSelect.fieldGroups = [];
                    }
                    var data = {results: importerSelect.fieldGroups};
                    query.callback(data);
                },
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop"
            })
                //when a selector is opened
                //a) store the selected field, to know if it changed later
                //b) force re-render to get around scroll bug
                .on("open", function () {
                    //a) store the selected field, to know if it changed later
                    var currentSelection = $(this).select2("data");
                    if (currentSelection) {
                        this._originalField = currentSelection.text;
                    }

                    //b) force re-render to get around scroll bug
                    setTimeout(function () {
                        $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "scroll";
                        setTimeout(function () {
                            $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "auto";
                        }, 100);
                    }, 100);
                })
                //when a selector is changed
                //a) un-select the old _originalField & select selectedField
                //b) re-setup field groups after selection
                .on("change", function (e) {
                    var selectedField = e.val;
                    if (selectedField !== this._originalField) {
                        for (var i in currentFields) {
                            var field = currentFields[i];
                            //a) un-select the old _originalField & select selectedField
                            if (field.text === selectedField) {
                                field.selected = true;
                            } else if (field.text === this._originalField) {
                                field.selected = false;
                            }
                        }

                        //b) re-setup field groups after selection
                        setupFieldGroups();
                    }
                });
        };

        //endregion

        //region Data Formatting

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

        /**
         * Formats the data, with the selected headers in this section
         * @param data
         * @return {Array}
         */
        var formatDataForValidation = function (data) {
            //check value of toggle switch to know if headers should be included
            var headersIncluded = page.find(".switch .on").hasClass("active");

            var selectedFields = [];

            var apiNameMap = {
                "Address Line 1": "Address Line One",
                "Address Line 2": "Address Line Two",
                "City": "AdminDistrictTwo",
                "State": "AdminDistrictOne",
                "Zipcode": "PostalCode"
            };

            //create an array of the fields to be used (based on the selects)
            page.find(".select2-container").each(function () {
                var name = $(this).select2("val");

                //change to the names needed for the API
                if (apiNameMap[name]) {
                    name = apiNameMap[name];
                }

                if (name === "Do not Import") {
                    selectedFields.push(null);
                } else {
                    selectedFields.push(name);
                }
            });

            var dataToValidate = [], row, field;

            //if the headers are not included, insert a row for the headers
            if (!headersIncluded) {
                var length = selectedFields.length, headerRow = [];
                for (var i = 0; i < length; i++) {
                    field = selectedFields[i];
                    if (field) {
                        headerRow.push(field);
                    }
                }
                dataToValidate.unshift(headerRow);
            }

            //iterate through each row of the data
            for (var r in data) {
                row = data[r];
                var newArray = [];
                //iterate through each column of the current row
                for (var c in row) {
                    field = selectedFields[c];
                    //check the field should be imported
                    if (field) {
                        //use the header from the select instead of their header
                        if (r == 0 && headersIncluded) {
                            newArray.push(field);
                        } else {
                            newArray.push(row[c]);
                        }
                    }
                }

                dataToValidate.push(newArray);
            }

            return dataToValidate;
        };

        //endregion

        /**
         * Setup the Headers / Row 1 toggle switch
         */
        var setupToggleSwitch = function () {
            //setup toggle switch states
            var on = page.find(".switch .on");
            on.on("click", function () {
                off.removeClass("active");
                on.addClass("active");
                //page.find(".toggle").animate({left: "37px"}, 250, "easeInOutQuad");
                page.find("#dynamicHeader span")[0].innerText = "Row 1";
            });

            var off = page.find(".switch .off");
            off.on("click", function () {
                on.removeClass("active");
                off.addClass("active");
                //page.find(".toggle").animate({left: "108px"}, 250, "easeInOutQuad");
                page.find("#dynamicHeader span")[0].innerText = "Row 2";
            });
        };

        //resize the list based on the current window's height
        var resizeGrid = function () {
            var extraMargin = 275;
            var windowHeight = $(window).height();
            var contentHeight = windowHeight - extraMargin;
            page.find('#listView').css("maxHeight", contentHeight + 'px');
        };

        importerSelect.initialize = function () {
            page = $("#importerSelect");

            //on save button click
            page.find(".saveBtn").on("click", function () {
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

            //setup the listview
            $("#listView").kendoListView({
                //setup the template to only include the header and the first row of data
                template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><div class='styled-select'></div></li>",
                dataSource: getHeadersWithExample(importerUpload.uploadedData)
            });

            resizeGrid();

            setupToggleSwitch();

            //get the list of fields for the selected service (for the selectors), then set them up
            if (importerUpload.selectedService) {
                dbServices.services.read({params: {serviceTemplateId: importerUpload.selectedService.Id}}).done(function (service) {
                    setupAvailableFields(service[0].Fields);

                    //setup the initial field groups (need to do this to setup initial contact info)
                    setupFieldGroups();

                    setupSelectors();
                    matchHeaders();
                    //setup the initial field groups
                    setupFieldGroups();
                });
            }
        };

        window.importerSelect = importerSelect;

        return importerSelect;
    }
);