// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "select2"], function ($) {
    var sampleContactInfo = [
        {Entity: "Burger King", Value: "765-494-2786", Label: "Phone"},
        {Entity: "Burger King", Value: "bk47906@gmail.com", Label: "Email"},
        {Entity: "Mary Lou's", Value: "http://www.marylousdonuts.com", Label: "Website"}
    ];

    $.widget("ui.contactInfo", {
        _create: function () {
            var that = this;

            var _contactInfo = $('<h3>Contact Info</h3>' +
                '<div id="listWrapper">' +
                    '<ul id="list"></ul>' +
                    '<button class="k-button k-button-icontext add"><span class="k-icon k-add"></span>Add New</button>' +
                '</div>' +
                '<div id="editWrapper">' +
                '<label>Info/Value</label><br />' +
                '<input id="value" type="text"/><br />' +
                '<label>Label</label><br />' +
                '<span id="labelIcon" class="Email"></span>' +
                '<input id="label" type="hidden"/><br />' +
                '<button class="k-button k-button-icontext save"><span class="k-icon k-update"></span>Save</button>' +
                '<button class="k-button k-button-icontext delete"><span class="k-icon k-delete"></span>Delete</button>' +
                '</div>');

            that.element.append(_contactInfo);

            var list = $($(_contactInfo)[1].firstChild), value;
            for(var i in sampleContactInfo){
                value = sampleContactInfo[i].Value.replace("http://", "");
                var element = "<li><div class='info'><span class='" + sampleContactInfo[i].Label + "'></span><p class='label'>" + sampleContactInfo[i].Label +
                    "</p><p class='value'>" + value + "</p></div><div class='editBtn'><span></span></div></li>";
                list.append(element);
            }

            var labels = [
                {Value: "0", Name: "Phone Number"},
                {Value: "1", Name: "Email Address"},
                {Value: "2", Name: "Website"},
                {Value: "3", Name: "Fax Number"}
            ];

            $("#contactInfo #label").select2({
                placeholder: "Select a label",
                minimumResultsForSearch: 15,
                width: "244px",
                id: function (item) {
                    return item.value;
                },
                query: function (query) {
                    if (!labels) {
                        labels = [];
                    }
                    var data = {results: labels};
                    query.callback(data);
                },
                formatSelection: function (item) {
                    return item.Name;
                },
                formatResult: function (item) {
                    return item.Name;
                },
                dropdownCssClass: "bigdrop"
            });

            $("#contactInfo .editBtn").on("click", function () {
                $("#contactInfo #listWrapper").attr("style", "display:none");
                $("#contactInfo #editWrapper").attr("style", "display:block");
            });

            $("#contactInfo .add").on("click", function () {
            });

            $("#contactInfo .k-grid-delete").live("click", function (e) {
//                var item = e.target.parentNode;
//                $("#contactInfo #list")[0].removeChild(item);
            });
        }
    });
});