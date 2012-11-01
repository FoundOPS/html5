'use strict';

define(["jquery", "sections/importerUpload", "sections/importerSelect", "db/services"], function ($, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid, gridData;

    /**
     * @param data
     * @return {Array} newData
     */
    var formatDataForGrid = function (data) {
    };

    /**
     * @param data
     * @return {Array} newData
     */
    var formatGridDataForValidation = function (data) {
    };

    var submitData = function (data) {
        var dataToSubmit = formatGridDataForValidation(data);

        //dbServices.submitData(dataToSubmit, importerSelect.headers, importerUpload.selectedService);
    };

    var createColumn = function (name) {
        var column, template;
        if (name === "Location") {
            template = "# #";
        } else {
            template = "# #";
        }
        //calculate the width of the title
        var width = name.length * 6.5 + 35;
        //set the width to 100 if it's less than 100
        if (width < 100) {
            width = 100;
        }
        column = {
            field: name.replace(/s+/g,''), //ex. "ClientName"
            title: name, //ex. "Client Name"
            template: template,
            width: width + "px"
        };
        //add the column to the list of columns
        importerSelect.columns.push(column);
    };

    //region Grid Methods
    var setupGrid = function () {
        dataSource = new kendo.data.DataSource({
            data: gridData,
            schema: {
                model: {
                    fields: importerSelect.fields
                }
            }
        });

        grid = $("#gridView").kendoGrid({
            columns: importerSelect.columns,
            dataSource: dataSource,
            editable: false,
            resizable: true,
            scrollable: true,
            sortable: "multiple"
        }).data("kendoGrid");
    };

    var removeGrid = function () {
        $("#gridView").empty();
        dataSource = "";
    };

    //resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 230;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $('#gridView .k-grid-content').css("height", contentHeight + 'px');
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
        if (importerUpload.oldData && importerSelect.gridData) {
            gridData = formatDataForGrid(importerSelect.gridData);
        } else {
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