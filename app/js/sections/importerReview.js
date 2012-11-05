'use strict';

define(["jquery", "underscore", "sections/importerUpload", "sections/importerSelect", "db/services", "widgets/location",
    "ui/popup", "widgets/selectBox"], function ($, _, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid, clients = {}, locations = {}, repeats = {}, columns = [
        {
            field: "Client"//,
            //template: "<div class='Client #= Client #'>#= Client #</div>"//,
//            editor: function (container, options) {
//                $('<div class="styled-select"></div>').appendTo(container)
//                    .selectBox({data: importerSelect.gridData.Suggestions.Clients, dataTextField: "Name"});
//            }
        },
        {
            field: "Location"//,
            //template: "<div class='Location #= Location #'>#= Location #</div>"//,
//            editor: function (container, options) {
//                // create a KendoUI AutoComplete widget as column editor
//                $('<div class="locationWidget"></div>').appendTo(container).location();
//            }
        },
        {
            field: "ContactInfo"//,
            //template: "<div class='ContactInfo #= ContactInfo #'>#= ContactInfo #</div>"
        },
        {
            field: "Repeat"//,
            //template: "<div class='Repeat #= Repeat #'>#= Repeat #</div>"
        }
    ];

    /**
     * @param data
     * @return {Array} newData
     */
    var formatDataForGrid = function (data) {
        var newData = [], newRow, row;
        for (var i in data) {
            var client = {}, location = {}, repeat, contactInfo = [], contactData, contactString = "";
            row = data[i];
            newRow = [];

            for (var j in row) {
                if (j === "0") {
                    client = clients[row[j]];
                    newRow["Client"] = client.Name;
                } else if (j === "1") {
                    location = locations[row[j]];
                    newRow["Location"] = location.AddressLineOne + ", " + location.AddressLineTwo + ", " + location.City + ", " + location.State + " " + location.Zipcode;
                } else if (j === "2") {
                    if (client && client.ContactInfo) {
                        contactInfo = client.ContactInfo;
                    }
                    if (location && location.ContactInfo) {
                        for (var i in location.ContactInfo) {
                            contactInfo.push(location.ContactInfo[i]);
                        }
                    }

                    if (contactInfo.length !== 0) {
                        contactData = contactInfo[0].Data.replace("http://", "");
                        contactData = contactData.replace("https://", "");

                        contactString = contactData + "(" + contactInfo[0].Label + ")";
                        if (contactInfo.length > 1) {
                            contactString = contactString.concat(" +", contactInfo.length - 1, " more");
                        }
                    }

                    newRow["ContactInfo"] = contactString;
                } else if (j === "3") {
                    repeat = repeats[row[j]];
                    newRow["Repeat"] = repeat.Name;
                }
            }
            newData.push(newRow);
        }
        return newData;
    };

    /**
     * @param data
     * @return {Array} newData
     */
    var formatGridDataForSubmission = function (data) {
    };

    var submitData = function (data) {
        var dataToSubmit = formatGridDataForSubmission(data);

        //dbServices.submitData(dataToSubmit, importerSelect.headers, importerUpload.selectedService);
    };

//    var createColumns = function (data) {
//        for (var i in data) {
//            var column, template;
//            if (name === "Location") {
//                template = "# #";
//            } else {
//                template = "# #";
//            }
//            //calculate the width of the title
//            var width = name.length * 6.5 + 35;
//            //set the width to 100 if it's less than 100
//            if (width < 100) {
//                width = 100;
//            }
//            column = {
//                field: name.replace(/s+/g,''), //ex. "ClientName"
//                title: name, //ex. "Client Name"
//                template: template,
//                width: width + "px"
//            };
//            //add the column to the list of columns
//            columns.push(column);
//        }
//    };

    //region Grid Methods
    var setupGrid = function () {
        var data = formatDataForGrid(importerSelect.gridData.RowSuggestions);

        dataSource = new kendo.data.DataSource({
            data: data,
            batch: true,
            schema: {
                model: {
                    fields: {
                        Client: { type: "string" },
                        Location: { type: "string" },
                        ContactInfo: { type: "string" },
                        Repeat: { type: "string" }
                    }
                }
            }
        });

        grid = $("#importerReview").find(".grid").kendoGrid({
            columns: columns,
            dataSource: dataSource,
            editable: true,
            resizable: true,
            scrollable: true
        }).data("kendoGrid");
    };

    var removeGrid = function () {
        $("#importerReview").find(".grid").empty();
        dataSource = "";
    };

    //resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 230;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $("#importerReview").find('.k-grid-content').css("height", contentHeight + 'px');
    };
    //endregion

    importerReview.initialize = function () {
        $(window).resize(function () {
            resizeGrid();
        });

        //import on button click
        $("#importBtn").on("click", function () {
            submitData();
        });
    };

    importerReview.show = function () {
        //check if importerUpload exists
        //if not, then no data has been loaded
        //TODO:
        if (!importerUpload.oldData) {
            //redirect to last page
            window.viewImporterSelect();
            return;
        }

        //create arrays for clients, locations, and repeats that match the guid with the object
        var entity;
        for (var i in importerSelect.gridData.Suggestions.Clients) {
            entity = importerSelect.gridData.Suggestions.Clients[i];
            clients[entity.Id] = entity;
        }
        for (var j in importerSelect.gridData.Suggestions.Locations) {
            entity = importerSelect.gridData.Suggestions.Locations[j];
            locations[entity.Id] = entity;
        }
        for (var k in importerSelect.gridData.Suggestions.Repeats) {
            entity = importerSelect.gridData.Suggestions.Repeats[k];
            repeats[entity.Id] = entity;
        }

        if (grid) {
            removeGrid();
        }
        setupGrid();
        resizeGrid();
        //validateData();
    };

    window.importerReview = importerReview;

    return importerReview;
});