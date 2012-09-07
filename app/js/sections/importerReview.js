'use strict';

define(["tools", "sections/importerUpload", "sections/importerSelect", "db/services"], function (tools, importerUpload, importerSelect, dbServices) {
    var importerReview = {}, dataSource, grid, gridData, dataToValidate = [];

    var validateData = function () {
        dataToValidate = formatGridDataForValidation(gridData);

        dbServices.validateData(dataToValidate, importerSelect.headers, function (data) {
            gridData = formatDataForGrid(data, true);

            //remake the grid columns to include lat, lng, and any other fields that were hidden originally
            //use importerSelect.headers to know what all should show up

            //calculate how many are missing
            var column, fieldName, name, template, width, hiddenNum = 0;
            importerSelect.rowTemplateString = importerSelect.rowTemplateString.replace("</tr>", "");
            for(var i = 0; i < importerSelect.headers.length; i++){
                name = importerSelect.headers[i];
//                if(name === "Location"){
//                    importerSelect.columns[i].hidden = false;
//                    importerSelect.rowTemplateString += "<td>c" + i + ".V</td>";
//                }
                if((i > importerSelect.columns.length - 1) && name !== "Latitude" && name !== "Longitude"){
                    fieldName = "c10" + hiddenNum;
                    template = "# if (" + fieldName + ".S == 3) { # <div class='cellError'></div> # } # #=" + fieldName + ".V#";
                    //calculate the width of the title
                    width = name.length * 6.5 + 35;
                    //set the width to 100 if it's less than 100
                    if(width < 100){
                        width = 100;
                    }
                    column = {
                        field: fieldName, //ex. "c0"
                        title: name, //ex. "Client Name"
                        template: template,
                        width: width + "px"
                    };
                    importerSelect.rowTemplateString += "<td>" + fieldName + ".V</td>";
                    importerSelect.columns.push(column);
                    hiddenNum ++;
                }
            }
            importerSelect.rowTemplateString += "</tr>";

            //refresh the grid's data with the new data
            grid.columns = importerSelect.columns;
            grid.thead.remove();
            grid.options.rowTemplate = kendo.template(importerSelect.rowTemplateString);
            grid._thead();
            grid.dataSource.data(gridData);
            grid.dataSource.read();

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
            //iterate through each column
            for (var r in row) {
                field = row[r];
                //save the whole field as a property of newRow
                newRow["c" + r] = field;
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

    var setupGrid = function () {
        grid = $("#gridView").kendoGrid({
            columns: importerSelect.columns,
            dataSource: dataSource,
            editable: false,
            resizable: true,
            scrollable: true,
            sortable: "multiple"
        }).data("kendoGrid");
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
            gridData = formatDataForGrid(importerUpload.oldData, false);
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
        setupGrid();

        resizeGrid();

        validateData();
    };

    window.importerReview = importerReview;

    return importerReview;
});