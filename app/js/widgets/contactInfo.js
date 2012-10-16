// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "select2"], function ($) {
    var sampleContactInfo = [{Entity: "Burger King", Value: "765-494-2786", Label: "Phone"}, {Entity: "Burger King", Value: "bk47906@gmail.com", Label: "Email"}, {Entity: "Mary Lou's", Value: "http://www.marylousdonuts.com", Label: ""}];

    $.widget("ui.contactInfo", {
        _create: function () {
            var that = this;

            var _contactInfo = $('<h3>Contact Info</h3>' +
                '<ul id="list">' +
                '</ul>' +
                '<button class="k-button k-button-icontext add"><span class="k-icon k-add"></span>Add New</button>');

            that.element.append(_contactInfo);

            var list = $($(_contactInfo)[1]);
            for(var i in sampleContactInfo){
                var element = "<li id='" + i + "'><input class='entity' /><input class='value' style='width:50px' /><input class='label'/><button class='k-button k-button-icontext k-grid-delete'></button></li>";
                list.append(element);
            }

            var labels = [{Value: "0", Name: "Phone Number"}, {Value: "1", Name: "Email Address"}, {Value: "2", Name: "Website"}, {Value: "3", Name: "Fax Number"}];
            var entities = [{Value: "0", Name: "Location A"}, {Value: "1", Name: "Location B"}];

            that._createDropdown($("#contactInfo .label"), labels, "100px");
            that._createDropdown($("#contactInfo .entity"), entities, "90px");

            $("#contactInfo .add").on("click", function () {
                var element = "<li class='newLi'><input class='entity' /><input class='value' style='width:50px' /><input class='label'/><button class='k-button k-button-icontext k-grid-delete'></button></li>";
                list.append(element);
                that._createDropdown($("#contactInfo li:last-child .label"), labels, "100px");
                that._createDropdown($("#contactInfo li:last-child .entity"), entities, "90px");
            });

            $("#contactInfo .k-grid-delete").live("click", function (e) {
                var item = e.target.parentNode;
                $("#contactInfo #list")[0].removeChild(item);
            });
        },

        _createDropdown: function (element, results, width) {
            element.select2({
                placeholder: "",
                minimumResultsForSearch: 15,
                width: width,
                id: function (item) {
                    return item.value;
                },
                query: function (query) {
                    if (!results) {
                        results = [];
                    }
                    var data = {results: results};
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
        }
    });
});