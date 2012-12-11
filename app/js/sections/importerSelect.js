'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore", "tools/generalTools"], function ($, importerUpload, dbServices, _, generalTools) {
        var importerSelect = {}, availableFields, page,
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
                //Contact Info
                {text: "Phone Label 1", group: 2, contactInfo: { category: 0, type: 0, number: 1 }},
                {text: "Phone Value 1", group: 2, contactInfo: { category: 0, type: 1, number: 1 }},
                {text: "Email Label 1", group: 2, contactInfo: { category: 1, type: 0, number: 1 }},
                {text: "Email Value 1", group: 2, contactInfo: { category: 1, type: 1, number: 1 }},
                {text: "Website Label 1", group: 2, contactInfo: { category: 2, type: 0, number: 1 }},
                {text: "Website Value 1", group: 2, contactInfo: { category: 2, type: 1, number: 1 }},
                {text: "Other Label 1", group: 2, contactInfo: { category: 3, type: 0, number: 1 }},
                {text: "Other Value 1", group: 2, contactInfo: { category: 3, type: 1, number: 1 }},
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
            var serviceFields = [], name, original;

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

            availableFields = generalTools.deepClone(defaultFields).concat(serviceFields);
        };

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

            //TODO Contact info stuff


            //build the field groups from the available (not selected) fields
            for (var i in availableFields) {
                var field = availableFields[i];

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

                for (var i in availableFields) {
                    var field = availableFields[i];

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

            //update the field groups after matching
            setupFieldGroups();
        };

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
            }).on("open",function () {
                    //store the currently selected field
                    var currentSelection = $(this).select2("data");
                    if (currentSelection) {
                        this._originalField = currentSelection.text;
                    }

                    //force re-render
                    setTimeout(function () {
                        $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "scroll";
                        setTimeout(function () {
                            $(".select2-drop-active").find(".select2-results")[0].style.overflowY = "auto";
                        }, 100);
                    }, 100);
                }).on("change", function (e) {
                    var selectedField = e.val;
                    //un-select the old _originalField & select selectedField
                    if (selectedField !== this._originalField) {
                        for (var i in availableFields) {
                            var field = availableFields[i];
                            if (field.text === selectedField) {
                                field.selected = true;
                            } else if (field.text === this._originalField) {
                                field.selected = false;
                            }
                        }

                        //re-setup field groups after selection
                        setupFieldGroups();
                    }
                });

            //setup initial field groups
            setupFieldGroups();
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

            //create an array of the fields to be used (based on the drop downs)
            page.find(".select2-container").each(function () {
                var name, value;
                name = value = $(this).select2("val");

                //change to the names needed for the API
                if (apiNameMap[value]) {
                    name = apiNameMap[value];
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
                page.find(".toggle").animate({left: "37px"}, 250, "easeInOutQuad");
                page.find("#dynamicHeader span")[0].innerText = "Row 1";
            });

            var off = page.find(".switch .off");
            off.on("click", function () {
                on.removeClass("active");
                off.addClass("active");
                page.find(".toggle").animate({left: "108px"}, 250, "easeInOutQuad");
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
                    setupSelectors();
                    matchHeaders();
                });
            }
        };

        window.importerSelect = importerSelect;

        return importerSelect;
    }
);