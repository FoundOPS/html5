'use strict';

define(["tools", "sections/importerUpload", "sections/importerSelect"], function (tools, importerUpload, importerSelect) {
    var importerReview = {}, dataSource, grid;

    importerReview.import = function () {};

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
            if(i !== 0){
                obj = toObject(data[i]);
                newData.push(obj);
            }
        }
        return newData;
    };

    importerReview.initialize = function () {
        if(importerUpload.oldData){
            var data = formatDataForGrid(importerUpload.oldData);
        }else{
            window.application.navigate("view/importerUpload.html");
        }

        dataSource = new kendo.data.DataSource({
            data: data
        });
    };

    importerReview.show = function () {
        grid = $("#gridView").kendoGrid({
            columns: importerSelect.columns,
            dataSource: dataSource,
            editable: true,
            resizable: true,
            scrollable: true
        }).data("kendoGrid");
    };

    window.importerReview = importerReview;

    return importerReview;
});