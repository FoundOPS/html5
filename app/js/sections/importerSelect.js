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

    var onDropdownSelect = function () {

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
            {id: "Do not Import"},
            {id: 'Client Name'},
            {text: "Location", children: [
                {id: 'Address Line 1'},
                {id: 'Address Line 2'},
                {id: 'City'},
                {id: 'State'},
                {id: 'Zipcode'}
            ]},
            {id: 'Region Name'},
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
            $("#importerSelect").find("#dynamicHeader")[0].innerText = "Row 1";
        });
        off.on("click", function () {
            on.removeClass("active");
            off.addClass("active");
            $("#importerSelect").find("#dynamicHeader")[0].innerText = "Row 2";
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

                //$("#importerSelect").find(".styled-select").selectBox({data: importerSelect.allFields, dataTextField: "Name", onSelect: onDropdownSelect});
                $("#importerSelect").find(".styled-select").select2({
                    placeholder: "",
                    minimumResultsForSearch: 200,
                    width: "205px",
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
                    }).on("change", function (e) {
                        var fieldToRemove = _.indexOf(importerSelect.currentFields, {id: e.val});
                        importerSelect.currentFields.splice(fieldToRemove, 1);
                        console.log(fieldToRemove);
                        console.log(importerSelect.currentFields);
                    });
                var findMatch = function (header) {
                    var match1 = _.find(importerSelect.allFields, function (field) {
                        return field.id === header;
                    });
                    var match2 = _.find(importerSelect.allFields[2].children, function (field) {
                        return field.id === header;
                    });
                    var match3 = _.find(importerSelect.allFields[4].children, function (field) {
                        return field.id === header;
                    });
                    var match4 = _.find(importerSelect.allFields[5].children, function (field) {
                        return field.id === header;
                    });

                    return match1 || match2 || match3 || match4;
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
            });
        }
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});