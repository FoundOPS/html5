'use strict';

define(["tools", "sections/importerUpload", "sections/importerSelect", "db/services"], function (tools, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid, gridData, dataToValidate = [], validatedData, headers = [];

    //import on button click
    $("#importBtn").on("click", function () {
        //dbServices.submitData(rows, headers, importerUpload.selectedService);
    });

    var validate = function (data) {
        dataToValidate = formatGridDataForValidation(data);

        for(var i in grid.columns){
            var column = grid.columns[i];
            headers.push(column.title);
        }

        dbServices.validateData(dataToValidate, headers, function (data) {
            validatedData = formatValidatedDataForGrid(data);
        });
    };

    var formatGridDataForValidation = function (data) {
        var object;
        dataToValidate = [];
        for (var r in data) {
            object = data[r];
            var newArray = [], newObject, key, keyNum;
            for (var c in importerSelect.columns) {
                key = importerSelect.columns[c].field;
                keyNum = key.substr(1,1);
                newObject = object[key];
                if(!newObject){
                    newObject = {
                        h: "",
                        s: 0,
                        v: ""
                    }
                }
                newObject["r"] = r;
                newObject["c"] = c;
                newArray.push(newObject);
            }
            dataToValidate.push(newArray);
        }
        return dataToValidate;
    };

    var formatValidatedDataForGrid = function (data) {

    };

    //converts row array to an object
    var toObject = function(arr) {
        var rv = {}, value, obj, num, field;
        for (var c in importerSelect.columns) {
            field = importerSelect.columns[c].field;
            num = field.substr(1, 3);
            value = arr[num] ? arr[num] : "";
            obj = {
                v: value,
                s: 0,
                h: ""
            };
            rv["c" + num] = obj;
        }
        return rv;
    };

    var formatOriginalDataForGrid = function (data) {
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
            gridData = formatOriginalDataForGrid(importerUpload.oldData);
        }else{
            //redirect to upload page
            window.application.navigate("view/importerUpload.html");
        }

        dataSource = new kendo.data.DataSource({
            data: gridData,
            schema: {
                model: {
                    fields: importerSelect.fields
                }
            }
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
            editable: false,
            resizable: true,
            scrollable: true,
            sortable: "multiple"
        }).data("kendoGrid");

        resizeGrid();

        //validate(gridData);
    };

    window.importerReview = importerReview;

    return importerReview;
});