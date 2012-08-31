'use strict';

define(["tools", "sections/importerUpload", "sections/importerSelect", "db/services"], function (tools, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid;

    //import on button click
    $("#importBtn").on("click", function () {


        //dbServices.submitData(rows, headers, importerUpload.selectedService);
    });

    var validate= function () {
        //dbServices.validateData(rows, headers, function () {

        //});
    };

    //converts an array to an object
    var toObject = function(arr) {
        var rv = {}, value, obj;
        for (var i = 0, len = arr.length; i < len; ++i){
            value = arr[i];
            if (value !== undefined){
                obj = {
                    v: value,
                    s: 0,
                    h: ""
                };
                rv["c" + i] = obj;
            }
        }
        return rv;
    };

    var formatDataForGrid = function (data) {
        var newData = [];
        var obj;
        for(var i in data){
            //skip the first row, because that is the row with the headers
            if(i != 0){
                //convert row to an object
                obj = toObject(data[i]);
                //add it to the new array
                newData.push(obj);
            }
        }
        return newData;
    };

    //resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 230;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $('#gridView .k-grid-content').css("height", contentHeight + 'px');
    };

    importerReview.initialize = function () {
        //check if importerUpload exists
        //if not, then no data has been loaded
        if(importerUpload.oldData){
            var data = formatDataForGrid(importerUpload.oldData);
        }else{
            //redirect to upload page
            window.application.navigate("view/importerUpload.html");
        }

        dataSource = new kendo.data.DataSource({
            data: data
        });

        $(window).resize(function () {
            resizeGrid();
        });
    };

    importerReview.show = function () {
        if(grid){

        }

        grid = $("#gridView").kendoGrid({
            columns: importerSelect.columns,
            dataSource: dataSource,
            editable: true,
            resizable: true,
            scrollable: true,
            sortable: "multiple"
        }).data("kendoGrid");

        resizeGrid();

        validate();
    };

    window.importerReview = importerReview;

    return importerReview;
});