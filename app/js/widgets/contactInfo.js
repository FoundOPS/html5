// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "select2"], function ($) {
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
                    '<div id="list"></div>' +
                    '<button class="k-button k-button-icontext add"><span class="k-icon k-add"></span>Add New</button>' +
                '</div>' +
                '<div id="editWrapper">' +
                '<label>Info/Value</label><br />' +
                '<input id="value" type="text"/><br />' +
                '<label>Label</label><br />' +
                '<span id="labelIcon" class="Email"></span>' +
                '<input id="label" /><br />' +
                '<button class="k-button k-button-icontext save"><span class="k-icon k-update"></span>Save</button>' +
                '<button class="k-button k-button-icontext delete"><span class="k-icon k-delete"></span>Delete</button>' +
                '</div>');

            that.element.append(_contactInfo);

            that._renderContactList(sampleContacts);

            var labels = [
                {Name: "Phone Number"},
                {Name: "Email Address"},
                {Name: "Website"},
                {Name: "Fax Number"}
            ];

            //function to format the option names of the dropdown
            var formatItemName = function (item) {
                return item.Name;
            };

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
                initSelection: function () {},
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop"
            }).on("change", function() {
                    //change the label icon

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
        },

        _renderContactList: function (contacts) {
            var that = this, label, value, href;

            $("#contactInfo #list")[0].innerHTML = "";

            for(var i = 0; i < contacts.length; i++){
                value = contacts[i].Value;
                label = contacts[i].Label;
                href = "javascript:void(0)";
                if(label === "Website"){
                    href = value;
                }else if(label === "Email"){
                    href = "mailto:" + value;
                }else if(label === "Phone"){
                    href = "tel:" + value;
                }

                if(value){
                    value = value.replace("http://", "");
                }

                var element = "<a href='" + href + "' id='" + i + "'><div class='info'><span class='" + label + "'></span><p class='label'>" + label +
                    "</p><p class='value'>" + value + "</p></div><div class='editBtn'><span></span></div></a>";
                $("#contactInfo #list").append(element);
            }

            $("#contactInfo .editBtn").on("click", function (e) {
                var index;
                if(e.target.className === "editBtn"){
                    index = e.target.parentNode.id;
                }else{
                    index = e.target.parentNode.parentElement.id;
                }
                that._editIndex = index;
                that._edit(sampleContacts[index]);
            });
        },

        _edit: function (contact) {
            $("#contactInfo #value").val(contact.Value);
            $("#contactInfo #label").select2("val", {Name: contact.Label});
            $("#contactInfo h3")[0].innerText = contact.Entity;

            $("#contactInfo #listWrapper").attr("style", "display:none");
            $("#contactInfo #editWrapper").attr("style", "display:block");
        }
    });
});