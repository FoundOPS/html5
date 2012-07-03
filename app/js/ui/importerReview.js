'use strict';

define(["ui/importerSelect"],function (upload) {
    var review = {};

    review.initialize = function () {
        $("#gridView").kendoGrid({
            columns:[],
            dataSource: ""
        });
    }

    window.review = review;
});