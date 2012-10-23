// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

//need to require kendo so it is loaded before this widget, otherwise funky stuff happens
define(["jquery", "tools/generalTools", "select2", "kendo"], function ($, generalTools) {
    var sampleContacts = [
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
                '<label>Value</label><br />' +
                '<input id="value" type="text"/><br />' +
                '<label>Label</label><br />' +
                '<select id="labelIcon" class="EmailSmall">' +
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

            var labels = [
                {name: "Mobile"},
                {name: "Work"},
                {name: "Home"},
                {name: "Fax"}
            ];

            //function to format the option names of the dropdown
            var formatItemName = function (item) {
                return item.name;
            };

            $("#contactInfo #label").select2({
                placeholder: "Select a label",
                minimumResultsForSearch: 15,
                width: "244px",
                id: function (item) {
                    return item.name;
                },
                query: function (query) {
                    if (!labels) {
                        labels = [];
                    }
                    var data = {results: labels};
                    query.callback(data);
                },
                initSelection: function () {},
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop"
            }).on("change", function (e) {
                //change the label icon
                $("#contactInfo #labelIcon")[0].className = e.val;
            });

            $("#contactInfo #labelIcon").select2({
                placeholder: "",
                width: "26px",
                containerCssClass: "iconContainer",
                minimumResultsForSearch: 15,
                dropdownCssClass: "bigdrop iconDropdown"
            });

            $("#contactInfo .add").on("click", function () {
                sampleContacts.push({Entity: "", Value: "", Label: ""});
                that._renderContactList(sampleContacts);
                that._editIndex = sampleContacts.length - 1;
                that._edit(sampleContacts[sampleContacts.length - 1]);
            });
            $("#contactInfo .save").live("click", function () {
                $("#contactInfo h3")[0].innerText = "Contact Info";
                sampleContacts[that._editIndex].Value = $("#contactInfo #value").val();
                sampleContacts[that._editIndex].Label = $("#contactInfo #label").select2("val");
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
                //if value is a website /((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                if (string.match(/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/)) {
                    $("#contactInfo #labelIcon").val("Website");
                //if value is an email
                } else if (string.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)){
                    $("#contactInfo #labelIcon").val("Email");
                //if value is a phone number  /\d{3}-\d{3}-\d{4}|\d{10}/
                } else if (string.match(/^\(([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)){
                    $("#contactInfo #labelIcon").val("Phone");
                } else {
                    $("#contactInfo #labelIcon").val("Other");
                }
            });
        },

        _renderContactList: function (contacts) {
            var that = this, label, value, href;

            $("#contactInfo #list")[0].innerHTML = "";

            for (var i = 0; i < contacts.length; i++) {
                value = contacts[i].Value;
                label = contacts[i].Label;
                href = "javascript:void(0)";
                if (label === "Website") {
                    href = value;
                } else if (label === "Email") {
                    href = "mailto:" + value;
                } else if (label === "Phone") {
                    href = "tel:" + value;
                }

                if (value) {
                    value = value.replace("http://", "");
                }

                var element = "<li id='" + i + "'><a href='" + href + "' class='info' target='_blank'><span class='" + label + "'></span><p class='label'>" + label +
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
            $("#contactInfo #value").val(contact.Value);
            $("#contactInfo #labelIcon")[0].className = contact.Label;
            $("#contactInfo #label").select2("data", {name: contact.Label});
            $("#contactInfo h3")[0].innerText = contact.Entity;

            $("#contactInfo #listWrapper").attr("style", "display:none");
            $("#contactInfo #editWrapper").attr("style", "display:block");
        }
    });
});