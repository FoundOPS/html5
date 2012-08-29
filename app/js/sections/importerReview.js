'use strict';

define(function () {
    var importerReview = {};
    importerReview.data = [];
    importerReview.columns = [];

    importerReview.import = function () {

    };

    importerReview.initialize = function () {

    };

    importerReview.show = function () {
        $("#gridView").kendoGrid({
            columns: importerReview.columns,
            dataSource: importerReview.data,
            editable: true,
            resizable: true,
            scrollable: true
        });
    };

    window.importerReview = importerReview;

    return importerReview;
});