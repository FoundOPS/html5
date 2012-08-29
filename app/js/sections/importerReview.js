'use strict';

define(["tools"], function (tools) {
    var importerReview = {}, dataSource;
    importerReview.data = [];
    importerReview.columns = [];
    importerReview.fields = [];

    importerReview.import = function () {

    };

    importerReview.initialize = function () {
        dataSource = new kendo.data.DataSource({
            data: importerReview.data,
            schema: {
                model: {
                    id: tools.newGuid(),
                    fields: importerReview.fields
                }
            }
        });

    };

    importerReview.show = function () {
        $("#gridView").kendoGrid({
            columns: importerReview.columns,
            dataSource: dataSource,
            editable: true,
            resizable: true,
            scrollable: true
        });
    };

    window.importerReview = importerReview;

    return importerReview;
});