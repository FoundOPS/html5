'use strict';

define(function () {
    var importerReview = {};

    importerReview.import = function () {

    };

    importerReview.initialize = function () {

        $("#gridView").kendoGrid({
            columns:[],
            dataSource: ""
        });
    };

    window.importerReview = importerReview;
});