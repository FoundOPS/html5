// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

//need to require kendo so it is loaded before this widget, otherwise funky stuff happens
define(["jquery", "underscore", "tools/generalTools", "tools/parserTools", "tools/analytics", "developer", "select2", "kendo"], function ($, _, generalTools, parserTools, analytics, developer) {
    //region Locals
    var sampleContacts = [
        {Entity: "Burger King", Value: "765-494-2786", Category: "Phone", Label: "Mobile"},
        {Entity: "Burger King", Value: "bk47906@gmail.com", Category: "Email", Label: "Personal"},
        {Entity: "Mary Lou's", Value: "http://www.marylousdonuts.com", Category: "Website", Label: "Business"}
    ],
        //labels for each category
        phoneLabels = [{value: "Mobile"}, {value: "Work"}, {value: "Home"}, {value: "Fax"}],
        websiteLabels = [ {value: "Personal"}, {value: "Business"}, {value: "Blog"}],
        emailLabels = [{value: "Personal"}, {value: "Business"}],
        otherLabels = [];
    //endregion

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

            //setup the dropdown of category icons
            $("#contactInfo #labelIcon").select2({
                placeholder: "",
                width: "26px",
                containerCssClass: "iconContainer OtherSmall",
                minimumResultsForSearch: 15,
                dropdownCssClass: "bigdrop iconDropdown"
            }).on("change", function (e) {
                //change the label icon
                that._changeCategory(e.val, false);
            });

            that._setupLabelDropdown();

            $("#contactInfo .add").on("click", function () {
                //add an empty contact to the list
                sampleContacts.push({Entity: "New", Value: "", Category: "Other", Label: ""});
                //refresh the list so it contains the new contact
                that._renderContactList(sampleContacts);
                //set the edit index to the last item(the new item gets added to the end)
                that._editIndex = sampleContacts.length - 1;
                //move to edit mode with the new contact
                that._edit(sampleContacts[sampleContacts.length - 1]);
            });
            $("#contactInfo .delete").live("click", function () {
                $("#contactInfo h3")[0].innerText = "Contact Info";
                //remove the selected contact from the list
                sampleContacts.splice(that._editIndex, 1);
                //refresh the list of contacts
                that._renderContactList(sampleContacts);
                //show the list of contacts
                $("#contactInfo #listWrapper").attr("style", "display:block");
                $("#contactInfo #editWrapper").attr("style", "display:none");
            });
            $("#contactInfo .save").live("click", function () {
                $("#contactInfo h3")[0].innerText = "Contact Info";
                //get the value of the selected label
                var selectedLabel = $("#contactInfo #label").select2("val");
                //set the value
                sampleContacts[that._editIndex].Value = $("#contactInfo #value").val();
                //set the label
                sampleContacts[that._editIndex].Label = selectedLabel;
                //set the category
                sampleContacts[that._editIndex].Category = $("#contactInfo #labelIcon").select2("val");
                //refresh the list with the new values
                that._renderContactList(sampleContacts);
                //show the list
                $("#contactInfo #listWrapper").attr("style", "display:block");
                $("#contactInfo #editWrapper").attr("style", "display:none");

                //check if the label is one that was custon added
                var isOldLabel = _.find(that._currentLables, function (label) {
                    return label.value === selectedLabel;
                });

                //if custom label, save it to the corresponding list
                if (!isOldLabel) {
                    that._currentLables.push({value: selectedLabel});
                }
            });

            //automatically update the category as the value changes
            generalTools.observeInput("#contactInfo #value", function (string) {
                var category;
                //check what the value is(phone, email, website, or other)
                if (parserTools.isEmail(string)) {
                    category = "Email";
                } else if (parserTools.isUrl(string)) {
                    category = "Website";
                } else if (parserTools.isPhone(string)) {
                    category = "Phone";
                } else {
                    category = "Other";
                }

                //set the category
                that._changeCategory(category, true);
            });
        },

        /**
         * Creates the list of contact info
         * @param {Array<Object>} contacts
         * @private
         */
        _renderContactList: function (contacts) {
            var that = this, list, category, label, value, href;

            list = $("#contactInfo #list");
            list[0].innerHTML = "";

            for (var i = 0; i < contacts.length; i++) {
                //get the values for the contact
                value = contacts[i].Value;
                category = contacts[i].Category;
                label = contacts[i].Label;
                href = "javascript:void(0)";
                //setup the correct link
                if (category === "Website") {
//                    var androidDevice = developer.CURRENT_FRAME === developer.Frame.MOBILE_APP && kendo.support.detectOS(navigator.userAgent).device === "android";
//                    if (androidDevice) {
//                        window.plugins.childBrowser.showWebPage(value);
//                    } else {
//                        window.open(value);
//                    }
                    href = value;
                } else if (category === "Email") {
                    href = "mailto:" + value;
                } else if (category === "Phone") {
                    href = "tel:" + value;
                }

                //remove the "http://" if website
                if (value && category === "Website") {
                    value = value.replace("http://", "");
                }

                //setup the individual contact element
                var element = "<li id='" + i + "'><a href='" + href + "' class='info' target='_blank'><span class='" + category + "'></span><p class='label'>" + label +
                    "</p><p class='value'>" + value + "</p></a><div class='editBtn'><span></span></div></li>";
                //add it to the list
                list.append(element);
            }

            //on edit button click
            $("#contactInfo .editBtn").on("click", function (e) {
                var index;
                //get the id of the list item that was clicked on(need to check if the span or div element was clicked on)
                if (e.target.className === "editBtn") {
                    index = e.target.parentNode.id;
                } else {
                    index = e.target.parentNode.parentElement.id;
                }
                //set the edit index
                that._editIndex = index;
                //move to edit mode
                that._edit(sampleContacts[index]);
            });
        },

        //creates a select2 dropdown for the list of labels
        _setupLabelDropdown: function () {
            var that = this;

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
                    var data = {
                        results: that._currentLables.slice() //clone the phone labels
                    };

                    if(query.term !== ""){
                        data.results.push({value: query.term});
                    }

                    query.callback(data);
                },
                initSelection: function () {
                },
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop"
            });
        },

        /**
         * A function to setup edit mode
         * @param {object} contact
         * @private
         */
        _edit: function (contact) {
            var that = this;
            //set the title of the edit pane to the name of the entity(the client or location)
            $("#contactInfo h3")[0].innerText = contact.Entity;
            //set the value in the textbox
            $("#contactInfo #value").val(contact.Value);
            //set the category
            that._changeCategory(contact.Category, true);
            //set the label
            $("#contactInfo #label").select2("data", {value: contact.Label});
            //show the edit pane
            $("#contactInfo #listWrapper").attr("style", "display:none");
            $("#contactInfo #editWrapper").attr("style", "display:block");
        },

        /**
         * Changes the category dropdown and sets up the correct label dropdown list
         * @param {string} category
         * @param {boolean} manuallySelect If the icon dropdown needs to be changes manually
         * @private
         */
        _changeCategory: function (category, manuallySelect) {
            var that = this, labels = [];
            //remove the select2 from the label dropdown
            $("#contactInfo #label").select2("destroy");
            //set the correct label list based on the category
            if(category === "Phone"){
                labels = phoneLabels;
            } else if(category === "Email"){
                labels = emailLabels;
            } else if(category === "Website"){
                labels = websiteLabels;
            } else {
                labels = otherLabels;
            }

            //get the selected label
            var label = $("#contactInfo #label").select2("val").val();
            var sameLabels;
            if(that._currentLables === labels){
                sameLabels = true;
            } else {
                that._currentLables = labels;
            }
            //set the correct list of labels
            that._setupLabelDropdown();
            //if the labels are the same as before, reset to the original selected label
            if(sameLabels){
                $("#contactInfo #label").select2("data", {value: label});
            }

            //change the selected category icon
            //get reference to the icon category dropdown
            var container = $("#contactInfo .iconContainer")[0];
            //check what the old value was so the old class name can be removed from the select2 container
            var className = container.className.match(/(\s(.*)Small)/);
            //make sure only the class name is matched
            var extra = className[0].match(/((.*)\s)/);
            var match = className[0].replace(extra[0], "");
            //remove the old class
            $(container).removeClass(match);
            //add the new class
            $(container).addClass(category + "Small");

            //set the category in the icon dropdown
            if(manuallySelect){
                $("#contactInfo #labelIcon").select2("val", category);
            }
        }
    });
});