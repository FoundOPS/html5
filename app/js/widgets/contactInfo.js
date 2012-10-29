// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

//need to require kendo so it is loaded before this widget, otherwise funky stuff happens
define(["jquery", "underscore", "tools/generalTools", "tools/parserTools", "tools/analytics", "select2", "kendo"], function ($, _, generalTools, parserTools, analytics) {
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
            that._contactInfo = $('<h3>Contact Info</h3>' +
                //list pane(first view)
                '<ul id="list"></ul>' +
                '<button class="k-button k-button-icontext add"><span class="k-icon k-add"></span>Add New</button>' +
                //edit pane
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
                '</div>' +
                '<button class="k-button k-button-icontext save"><span class="k-icon k-update"></span>Save</button>' +
                '<button class="k-button k-button-icontext delete"><span class="k-icon k-delete"></span>Delete</button>');

            that.element.append(that._contactInfo);

            that._renderContactList(sampleContacts);

            //setup the dropdown of category icons
            $(that._contactInfo).find("#labelIcon").select2({
                placeholder: "",
                width: "28px",
                containerCssClass: "iconContainer OtherSmall",
                minimumResultsForSearch: 15,
                dropdownCssClass: "bigdrop iconDropdown"
            }).on("change", function (e) {
                //change the label icon
                that._changeCategory(e.val, false);
            });

            that._setupLabelDropdown();

            $(that.element).find(".add").on("click", function () {
                //add an empty contact to the list
                sampleContacts.unshift({Entity: "New", Value: "", Category: "Other", Label: ""});
                //refresh the list so it contains the new contact
                that._renderContactList(sampleContacts);
                //set the edit index to the last item(the new item gets added to the end)
                that._editIndex = 0;
                //move to edit mode with the new contact
                that._edit(sampleContacts[that._editIndex]);
            });
            $(that.element).find(".delete").live("click", function () {
                //remove the selected contact from the list
                sampleContacts.splice(that._editIndex, 1);
                //refresh the list of contacts
                that._renderContactList(sampleContacts);
                //show the list of contacts
                that._changePane("list");
            });
            $(that.element).find(".save").live("click", function () {
                //get the value of the selected label
                var selectedLabel = $(that.element).find("#label").select2("val");
                //set the value
                sampleContacts[that._editIndex].Value = $(that.element).find("#value").val();
                //set the label
                sampleContacts[that._editIndex].Label = selectedLabel;
                //set the category
                sampleContacts[that._editIndex].Category = $(that.element).find("#labelIcon").select2("val");
                //refresh the list with the new values
                that._renderContactList(sampleContacts);
                //show the list
                that._changePane("list");

                //check if the label is one that was custon added
                var isOldLabel = _.find(that._currentLabels, function (label) {
                    return label.value === selectedLabel;
                });

                //if custom label, save it to the corresponding list
                if (!isOldLabel) {
                    that._currentLabels.push({value: selectedLabel});
                }
            });

            //automatically update the category as the value changes
            generalTools.observeInput($(that._contactInfo).find("#value"), function (string) {
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
            }, 250);
        },

        /**
         * Creates the list of contact info
         * @param {Array<Object>} contacts
         * @private
         */
        _renderContactList: function (contacts) {
            var that = this, list, category, label, value, href;

            list = $(that.element).find("#list");
            list[0].innerHTML = "";

            for (var i = 0; i < contacts.length; i++) {
                //get the values for the contact
                value = contacts[i].Value;
                category = contacts[i].Category;
                label = contacts[i].Label;

                //remove the "http://" if website
                if (value && category === "Website") {
                    value = value.replace("http://", "");
                }

                //setup the individual contact element
                var element = "<li id='" + i + "'><a class='info' target='_blank'><span class='" + category + "'></span><p class='label'>" + label +
                    "</p><p class='value'>" + value + "</p></a><div class='editBtn'><span></span></div></li>";
                //add it to the list
                list.append(element);
            }

            $(that.element).find("#list a").on("click", function (e) {
                if (e.currentTarget.children[0].className === "Phone") {
                    analytics.track("Phone Contact Click");
                    window.location.href = "tel:" + e.currentTarget.children[2].innerText;
                } else if (e.currentTarget.children[0].className === "Email") {
                    analytics.track("Email Contact Click");
                    window.open("mailto:" + e.currentTarget.children[2].innerText, "_blank");
                } else if (e.currentTarget.children[0].className === "Website") {
                    analytics.track("Website Contact Click");
                    generalTools.goToUrl(e.currentTarget.children[2].innerText);
                }
            });

            //on edit button click
            $(that.element).find(".editBtn").on("click", function (e) {
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

            $(that.element).find("#label").select2({
                width: "242px",
                id: function (item) {
                    return item.value;
                },
                query: function (query) {
                    var data = {
                        results: that._currentLabels.slice() //clone the phone labels
                    };

                    if(query.term !== ""){
                        data.results.unshift({value: query.term});
                    }

                    query.callback(data);
                },
                initSelection: function () {
                },
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop labelDropdown"
            });
        },

        /**
         * A function to setup edit mode
         * @param {object} contact
         * @private
         */
        _edit: function (contact) {
            var that = this;
            //set the value in the textbox
            $(that.element).find("#value").val(contact.Value);
            //set the category
            that._changeCategory(contact.Category, true);
            //set the label
            $(that.element).find("#label").select2("data", {value: contact.Label});
            //show the edit pane
            that._changePane("edit");
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
            $(that.element).find("#label").select2("destroy");
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
            var label = $(that.element).find("#label").select2("val").val();
            var sameLabels;
            if(that._currentLabels === labels){
                sameLabels = true;
            } else {
                that._currentLabels = labels;
            }
            //set the correct list of labels
            that._setupLabelDropdown();
            //if the labels are the same as before, reset to the original selected label
            if(sameLabels){
                $(that.element).find("#label").select2("data", {value: label});
            }

            //change the selected category icon
            //get reference to the icon category dropdown
            var container = $(that.element).find(".iconContainer")[0];
            //replace the select2 container's class name with the new class
            $(container)[0].className = "select2-container iconContainer " + category + "Small";

            //set the category in the icon dropdown
            if(manuallySelect){
                $(that.element).find("#labelIcon").select2("val", category);
            }
        },

        _changePane: function (newPane) {
            var that = this;
            //if moving to edit pane
            if(newPane === "edit"){
                $(that.element).find("#list").animate({
                    height:'hide'
                }, "swing", function () {
                    $(that.element).find(".add").attr("style", "display:none");
                    $(that.element).find(".save, .delete").attr("style", "display:block");
                    $(that.element).find("#editWrapper").animate({
                        height:'show'
                    }, "swing");
                });

            //if moving to list pane
            } else {
                $(that.element).find("#editWrapper").animate({
                    height:'hide'
                }, "swing", function () {
                    $(that.element).find(".save, .delete").attr("style", "display:none");
                    $(that.element).find(".add").attr("style", "display:block");
                    $(that.element).find("#list").animate({
                        height:'show'
                    }, "swing");
                });

            }
        }
    });
});