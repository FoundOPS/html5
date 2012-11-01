'use strict';

define(["jquery", "sections/importerUpload", "sections/importerSelect", "db/services"], function ($, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid, columns = [
        {
            field: "Client",
            template: "<div class='client #= Client #'>#= Client #</div>"
        },
        {
            field: "Location",
            attributes: {
                "class": "locationCell"
            }
        },
        {
            field: "Repeat",
            attributes: {
                "class": "repeatCell"
            }
        }
    ];

    /**
     * @param data
     * @return {Array} newData
     */
    var formatDataForGrid = function (data) {
        var newData = [], newRow, row;
        for (var i in data) {
            row = data[i];
            newRow = [];
            for (var j in row) {
                if (j === "0") {
                    newRow["Client"] = row[j];
                } else if (j === "1") {
                    newRow["Location"] = row[j];
                } else if (j === "2") {
                    newRow["Repeat"] = row[j];
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
            schema: {
                model: {
                    fields: {
                        Client: { type: "string" },
                        Location: { type: "string" },
                        Repeat: { type: "string" }
                    }
                }
            }
        });

        grid = $("#importerReview").find(".grid").kendoGrid({
            columns: columns,
            dataSource: dataSource,
            editable: false,
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