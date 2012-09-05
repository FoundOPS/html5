'use strict';

define(["tools", "sections/importerUpload", "sections/importerSelect", "db/services"], function (tools, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid, gridData, dataToValidate = [], validatedData;

    var validateData = function () {
        dataToValidate = formatGridDataForValidation(gridData);

        dbServices.validateData(dataToValidate, importerSelect.headers, function (data) {
            validatedData = formatValidatedDataForGrid(data);
            //TODO: check if there are errors
            //if(!error){
            //  //enable import button
                $("#importBtn").removeAttr("disabled");
            //}
        });
    };

    var submitData = function () {
        dataToValidate = formatGridDataForValidation(gridData);

        dbServices.submitData(dataToValidate, importerSelect.headers, importerUpload.selectedService);
    };

    //region Data Conversions
    var formatGridDataForValidation = function (data) {
        var object, dataToValidate = [];
        //iterate through each row of the data
        for (var r in data) {
            object = data[r];
            var newArray = [], newObject, keyNum;
            //iterate through each of the grid fields
            for (var c in importerSelect.fields) {
                //remove the "c" from the name
                keyNum = c.substr(1,3);
                //get the object from the data that corresponds to the current field
                newObject = object[c];
                //if no corresponding object exists, create a blank one
                if(!newObject){
                    newObject = {
                        h: "",
                        s: 0,
                        v: ""
                    }
                }
                //set the row and cell
                newObject["r"] = r;
                newObject["c"] = keyNum;
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
        var newRow = {}, value, obj, num, field;
        //iterate through each column
        for (var c in importerSelect.columns) {
            //get the column name ex. "c0"
            field = importerSelect.columns[c].field;
            //remove the "c" from the name
            num = field.substr(1, 3);
            //if there is a corresponding grid column to the data column,
            //set value equal to it, otherwise set value to ""
            value = arr[num] ? arr[num] : "";
            //create the cell
            obj = {
                h: "",
                s: 0,
                v: value
            };
            //save the object as a property of newRow
            newRow["c" + num] = obj;
        }
        return newRow;
    };

    var formatOriginalDataForGrid = function (data) {
        var newData = [];
        var obj;
        //iterate through each row of the data
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
    //endregion

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

        //import on button click
        $("#importBtn").on("click", function () {
            submitData();
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

        //validateData();
    };

    window.importerReview = importerReview;

    return importerReview;
});