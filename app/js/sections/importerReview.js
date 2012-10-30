'use strict';

define(["tools", "sections/importerUpload", "sections/importerSelect", "db/services"], function (tools, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid, gridData, dataToValidate = [];

    var validateData = function () {
        dataToValidate = formatGridDataForValidation(gridData);

        dbServices.validateData(dataToValidate, importerSelect.headers, function (data) {
            //add the required fields that were missing before validation
            var fieldName, name, hiddenNum = 0;
            for(var i = 0; i < importerSelect.headers.length; i++){
                name = importerSelect.headers[i];
                //unhide the Location column
                if(name === "Location"){
                    importerSelect.columns[i].hidden = false;
                }
                if((i > importerSelect.columns.length - 1) && name !== "Latitude" && name !== "Longitude"){
                    fieldName = "c10" + hiddenNum;
                    importerSelect.createColumn(fieldName, name, false);
                    hiddenNum ++;
                }
            }

            gridData = formatDataForGrid(data, true);

            //re-create the grid with the new data
            removeGrid();
            setupGrid();
            resizeGrid();

            //check for errors
            var error;
            for(var r in data){
                error = _.any(data[r], function (cell) {
                    return cell.S === 3;
                });
            }
            //if no errors, enable import button
            if(!error){
                $("#importBtn").removeAttr("disabled");
            }
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
                        H: "",
                        S: 2,
                        V: ""
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

    /**
     * converts row array to an object
     * @param {Array} row
     * @param {boolean} validated If this data is coming from the API
     * @return {Object} newRow
     */
    var toObject = function(row, validated) {
        var newRow = {}, value, obj, num, field;
        if(validated){
            //iterate through each header(use importerSelect.headers because it contains the columns that were hidden before validation)
            for (var h in importerSelect.headers) {
                if(importerSelect.headers[h] !== "Latitude" && importerSelect.headers[h] !== "Longitude"){
                    field = row[h];
                    //save the whole field as a property of newRow
                    //save the object as a property of newRow
                    newRow["c" + field.C] = field;
                }
            }
        }else{
            //iterate through each column
            for (var c in importerSelect.columns) {
                if(importerSelect.columns[c].title !== "Latitude" && importerSelect.columns[c].title !== "Longitude"){
                    //get the column name ex. "c0"
                    field = importerSelect.columns[c].field;
                    //remove the "c" from the name
                    num = field.substr(1, 3);
                    //if there is a corresponding grid column to the data column,
                    //set value equal to it, otherwise set value to ""
                    value = row[num] ? row[num] : "";
                    //create the cell
                    obj = {
                        H: "",
                        S: 2,
                        V: value
                    };
                    //save the object as a property of newRow
                    newRow["c" + num] = obj;
                }
            }
        }
        return newRow;
    };

    /**
     * @param data
     * @param validated
     * @return {Array} newData
     */
    var formatDataForGrid = function (data, validated) {
        var newData = [];
        var obj;
        //iterate through each row of the data
        for(var i in data){
            //skip the first row, because that is the row with the headers,
            //unless this is validated data
            if(i != 0 || validated){
                //convert row to an object
                obj = toObject(data[i], validated);
                //add it to the new array
                newData.push(obj);
            }
        }
        return newData;
    };
    //endregion

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
        //check if importerUpload exists
        //if not, then no data has been loaded
        if(importerUpload.oldData){
            gridData = formatDataForGrid(importerUpload.oldData, false);
        }else{
            //redirect to upload page
            window.application.navigate("view/importerUpload.html");
        }

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
            removeGrid();
        }
        setupGrid();
        resizeGrid();
        validateData();
    };

    window.importerReview = importerReview;

    return importerReview;
});