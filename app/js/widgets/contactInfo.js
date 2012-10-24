// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

//need to require kendo so it is loaded before this widget, otherwise funky stuff happens
define(["jquery", "tools/generalTools", "tools/parserTools", "select2", "kendo"], function ($, generalTools, parserTools) {
    var sampleContacts = [
        {Entity: "Burger King", Value: "765-494-2786", Category: "Phone", Label: "Mobile"},
        {Entity: "Burger King", Value: "bk47906@gmail.com", Category: "Email", Label: "Personal"},
        {Entity: "Mary Lou's", Value: "http://www.marylousdonuts.com", Category: "Website", Label: "Business"}
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
                '<label>Value</label><br />' +
                '<input id="value" type="text"/><br />' +
                '<label>Label</label><br />' +
                '<select id="labelIcon">' +
                '<option class="EmailSmall" value="Email">&nbsp;</option>' +
                '<option class="WebsiteSmall" value="Website">&nbsp;</option>' +
                '<option class="PhoneSmall" value="Phone">&nbsp;</option>' +
                '<option class="OtherSmall" value="Other">&nbsp;</option>' +
                '</select>​' +
                '<input id="label" /><br />' +
                '<button class="k-button k-button-icontext save"><span class="k-icon k-update"></span>Save</button>' +
                '<button class="k-button k-button-icontext delete"><span class="k-icon k-delete"></span>Delete</button>' +
                '</div>');

            that.element.append(_contactInfo);

            that._renderContactList(sampleContacts);

            $("#contactInfo #labelIcon").select2({
                placeholder: "",
                width: "26px",
                containerCssClass: "iconContainer OtherSmall",
                minimumResultsForSearch: 15,
                dropdownCssClass: "bigdrop iconDropdown"
            }).on("change", function (e) {
                //change the label icon
                that._changeLabelClass(e.val);
            });

            var labels = [
                {value: "Mobile"},
                {value: "Work"},
                {value: "Home"},
                {value: "Fax"}
            ];

            //function to format the option names of the dropdown
            var formatItemName = function (item) {
                return item.value;
            };

            $("#contactInfo #label").select2({
                placeholder: "Select a label",
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
                initSelection: function () {},
//                multiple: true,
//                tags: labels,
//                maximumSelectionSize: 1,
//                tokenSeparators: [",", " "],
//                tokenizer(input, selection, selectCallback, opts),
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop"
            }).on("change", function (e) {
                //change the label icon
                $("#contactInfo #labelIcon")[0].className = e.val;
            });

            $("#contactInfo .add").on("click", function () {
                sampleContacts.push({Entity: "New", Value: "", Category: "Other", Label: ""});
                that._renderContactList(sampleContacts);
                that._editIndex = sampleContacts.length - 1;
                that._edit(sampleContacts[sampleContacts.length - 1]);
            });
            $("#contactInfo .save").live("click", function () {
                $("#contactInfo h3")[0].innerText = "Contact Info";
                sampleContacts[that._editIndex].Value = $("#contactInfo #value").val();
                sampleContacts[that._editIndex].Label = $("#contactInfo #label").select2("val");
                sampleContacts[that._editIndex].Category = $("#contactInfo #labelIcon").select2("val");
                that._renderContactList(sampleContacts);

                $("#contactInfo #listWrapper").attr("style", "display:block");
                $("#contactInfo #editWrapper").attr("style", "display:none");
            });
            $("#contactInfo .delete").live("click", function () {
                $("#contactInfo h3")[0].innerText = "Contact Info";
                sampleContacts.splice(that._editIndex, 1);

                $("#contactInfo #listWrapper").attr("style", "display:block");
                $("#contactInfo #editWrapper").attr("style", "display:none");
                that._renderContactList(sampleContacts);
            });

            //attempt to update label on value change
            generalTools.observeInput("#contactInfo #value", function (string) {
                string = string.toLowerCase();
                var label;
                //if value is a website
                if (parserTools.isEmail(string)) {
                    label = "Email";
                    //if value is an email
                } else if (parserTools.isUrl(string)) {
                    label = "Website";
                    //if value is a phone number
                } else if (parserTools.isPhone(string)) {
                    label = "Phone";
                } else {
                    label = "Other";
                }

                $("#contactInfo #labelIcon").select2("data", {value: label});
                that._changeLabelClass(label);
            });
        },

        _renderContactList: function (contacts) {
            var that = this, category, label, value, href;

            $("#contactInfo #list")[0].innerHTML = "";

            for (var i = 0; i < contacts.length; i++) {
                value = contacts[i].Value;
                category = contacts[i].Category;
                label = contacts[i].Label;
                href = "javascript:void(0)";
                if (category === "Website") {
                    href = value;
                } else if (category === "Email") {
                    href = "mailto:" + value;
                } else if (category === "Phone") {
                    href = "tel:" + value;
                }

                if (value) {
                    value = value.replace("http://", "");
                }

                var element = "<li id='" + i + "'><a href='" + href + "' class='info' target='_blank'><span class='" + category + "'></span><p class='label'>" + label +
                    "</p><p class='value'>" + value + "</p></a><div class='editBtn'><span></span></div></li>";
                $("#contactInfo #list").append(element);
            }

            $("#contactInfo .editBtn").on("click", function (e) {
                var index;
                if (e.target.className === "editBtn") {
                    index = e.target.parentNode.id;
                } else {
                    index = e.target.parentNode.parentElement.id;
                }
                that._editIndex = index;
                that._edit(sampleContacts[index]);
            });
        },

        _edit: function (contact) {
            var that = this;
            $("#contactInfo h3")[0].innerText = contact.Entity;
            $("#contactInfo #value").val(contact.Value);
            that._changeLabelClass(contact.Category);
            $("#contactInfo #labelIcon").select2("data", {value: contact.Category});
            $("#contactInfo #label").select2("data", {value: contact.Label});
            $("#contactInfo #listWrapper").attr("style", "display:none");
            $("#contactInfo #editWrapper").attr("style", "display:block");
        },

        _changeLabelClass: function (newClass) {
            var container = $("#contactInfo .iconContainer")[0];
            var className = container.className.match(/(\s(.*)Small)/);
            var extra = className[0].match(/((.*)\s)/);
            var match = className[0].replace(extra[0], "");
            $(container).removeClass(match);
            $(container).addClass(newClass + "Small");
        }
    });
});