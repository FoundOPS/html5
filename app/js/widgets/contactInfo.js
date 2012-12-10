//OLD - importerV2
// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

//need to require kendo so it is loaded before this widget, otherwise funky stuff happens
define(["jquery", "underscore", "tools/generalTools", "tools/parserTools", "tools/analytics", "select2", "kendo"], function ($, _, generalTools, parserTools, analytics) {
    //region Locals
//   var sampleContacts = [
//            {Entity: "Burger King", Data: "765-494-2786", Type: "Phone Number", Label: "Mobile"},
//            {Entity: "Burger King", Data: "bk47906@gmail.com", Type: "Email Address", Label: "Personal"},
//            {Entity: "Mary Lou's", Data: "http://www.marylousdonuts.com", Type: "Website", Label: "Business"}
//        ];

    //labels for each category
    var phoneLabels = [
            {value: "Mobile"},
            {value: "Work"},
            {value: "Home"},
            {value: "Fax"}
        ],
        websiteLabels = [
            {value: "Personal"},
            {value: "Business"},
            {value: "Blog"}
        ],
        emailLabels = [
            {value: "Personal"},
            {value: "Business"}
        ],
        otherLabels = [];
    //endregion

    var contactInfo =  {
        //Contacts is an array of the contacts for the widget to display.
        options: {
            contacts: []
        },

        _create: function () {
            var contactInfo = this;
            contactInfo.contacts = contactInfo.options.contacts;
            var _contactInfo = $('<h3>Contact Info</h3>' +
                //list pane(first view)
                '<ul class="contactList"></ul>' +
                '<div class="addButtonWrapper">' +
                    '<button class="k-button k-button-icontext add"><span class="k-icon k-add"></span>Add New</button>' +
                '</div>' +
                //edit pane
                '<div class="editWrapper">' +
                    '<label>Value</label><br />' +
                    '<input class="value" type="text"/><br />' +
                    '<label>Label</label><br />' +
                    '<select class="labelIcon">' +
                        '<option class="EmailSmall" value="Email">&nbsp;</option>' +
                        '<option class="WebsiteSmall" value="Website">&nbsp;</option>' +
                        '<option class="PhoneSmall" value="Phone">&nbsp;</option>' +
                        '<option class="OtherSmall" value="Other">&nbsp;</option>' +
                    '</select>' +
                    '<div class="contactInfoSearchSelect" /></div>' +
                    '<br />' +
                '</div>' +
                '<div class="saveDeleteButtonWrapper">' +
                    '<button class="k-button k-button-icontext save"><span class="k-icon k-update"></span>Save</button>' +
                    '<button class="k-button k-button-icontext delete"><span class="k-icon k-delete"></span>Delete</button>' +
                '</div>');

            contactInfo.element.append(_contactInfo);

            contactInfo.renderContactList(contactInfo.contacts);

            //setup the dropdown of category icons
            $(contactInfo.element).find(".labelIcon").select2({
                placeholder: "",
                width: "28px",
                containerCssClass: "iconContainer OtherSmall",
                minimumResultsForSearch: 15,
                dropdownCssClass: "bigdrop iconDropdown"
            }).on("change", function (e) {
                //change the label icon
                contactInfo._changeType(e.val, false);
            });

            contactInfo._setupLabelDropdown();

            $(contactInfo.element).find(".add").on("click", function () {
                //add an empty contact to the list
                contactInfo.contacts.unshift({Entity: "New", Data: "", Type: "Other", Label: ""});
                //refresh the list so it contains the new contact
                contactInfo.renderContactList(contactInfo.contacts);
                //set the edit index to the last item(the new item gets added to the end)
                contactInfo._editIndex = 0;
                //move to edit mode with the new contact
                contactInfo._edit(contactInfo.contacts[contactInfo._editIndex]);
                contactInfo._isNew = true;
            });
            $(contactInfo.element).find(".save").on("click", $(contactInfo.element), function () {
                //save the old value to be used to check for changes
                var oldContact = generalTools.deepClone(contactInfo.contacts[contactInfo._editIndex]);
                //get the value of the selected label
                var selectedLabel = $(contactInfo.element).find(".editWrapper .contactInfoSearchSelect").searchSelect("text");
                //set the value
                contactInfo.contacts[contactInfo._editIndex].Data = $(contactInfo.element).find(".editWrapper .value").val();
                //set the label
                contactInfo.contacts[contactInfo._editIndex].Label = selectedLabel;
                //set the category
                contactInfo.contacts[contactInfo._editIndex].Type = $(contactInfo.element).find(".labelIcon").select2("val");
                //refresh the list with the new values
                contactInfo.renderContactList(contactInfo.contacts);
                //show the list
                contactInfo._changePane("list");

                //check if the label is one that was custon added
                var isOldLabel = _.find(contactInfo._currentLabels, function (label) {
                    return label.value === selectedLabel;
                });

                //if custom label, save it to the corresponding list
                if (!isOldLabel) {
                    contactInfo._currentLabels.push({value: selectedLabel});
                }
                //save changes
                //TODO
                if (contactInfo._isNew && contactInfo.options.entity) {
                    contactInfo.options.entity.create(contactInfo.contacts[contactInfo._editIndex]);
                } else {
                    //check if contact changed
                    var newContact = generalTools.deepClone(contactInfo.contacts[contactInfo._editIndex]);
                    if (!_.isEqual(newContact, oldContact) && contactInfo.options.entity) {
                        contactInfo.options.entity.update(newContact);
                    }
                }
                contactInfo._isNew = false;
            });
            $(contactInfo.element).find(".delete").on("click", $(contactInfo.element), function () {
                var id = contactInfo.contacts[contactInfo._editIndex].Id;

                //remove the selected contact from the list
                contactInfo.contacts.splice(contactInfo._editIndex, 1);
                //refresh the list of contacts
                contactInfo.renderContactList(contactInfo.contacts);
                //show the list of contacts
                contactInfo._changePane("list");
                //submit the change
                //TODO
                if (contactInfo.options.entity) {
                    contactInfo.options.entity.destroy(id);
                }
            });
            //automatically update the category as the value changes
            generalTools.observeInput($(contactInfo.element).find(".editWrapper .value"), function (string) {
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
                contactInfo._changeType(category, true);
            }, 250);

            $(window).resize(function () {
                contactInfo._setLabelWidth(".editWrapper");
            });
        },
        renderContactList: function (contacts) {
            var contactInfo = this, list, category, label, value;

            list = $(contactInfo.element).find(".contactList");
            list[0].innerHTML = "";

            for (var i = 0; i < contacts.length; i++) {
                //get the values for the contact
                value = contacts[i].Data;
                category = contacts[i].Type;
                label = contacts[i].Label;

                //remove the "http://" if website
                if (value && category === "Website") {
                    value = value.replace("http://", "");
                }

                //setup the individual contact element
                var element = "<li id='" + i + "'><div class='editBtn'><span></span></div><a class='info' target='_blank'>" +
                    "<span class='" + category + "'></span><p class='label'>" + label + "</p><p class='value'>" + value + "</p></a></li>";
                //add it to the lists
                list.append(element);
            }

            $(contactInfo.element).find(".contactList a").on("click", function (e) {
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
            $(contactInfo.element).find(".editBtn").on("click", function (e) {
                var index;
                //get the id of the list item that was clicked on(need to check if the span or div element was clicked on)
                if (e.target.className === "editBtn") {
                    index = e.target.parentNode.id;
                } else {
                    index = e.target.parentNode.parentElement.id;
                }
                //set the edit index
                contactInfo._editIndex = index;
                //move to edit mode
                contactInfo._edit(contactInfo.contacts[index]);
            });
        },

        //creates a select2 dropdown for the list of labels
        _setupLabelDropdown: function () {
            var contactInfo = this;

            //function to format the option names of the dropdown
            var formatItemName = function (item) {
                return item.value;
            };

            $(contactInfo.element).find(".editWrapper .contactInfoSearchSelect").searchSelect({
                formatOption: function (item) {
                    return item.value;
                },
                query: function (searchTerm, callback) {
                    var data = contactInfo._currentLabels.slice() //clone the phone labels
                    if (searchTerm !== "") {
                        data.unshift({value: searchTerm});
                    }
                    return data;
                },
                onSelect: function (e, selectedData) {
                    console.log(e);
                    console.log(selectedData);
                },
                minimumInputLength: 0
            });
        },
        /**
         * A function to setup edit mode
         * @param {object} contact
         * @private
         */
        _edit: function (contact) {
            var contactInfo = this;
            //set the value in the textbox
            $(contactInfo.element).find(".editWrapper .value").val(contact.Data);
            //set the category
            contactInfo._changeType(contact.Type, true);
            //set the label
            $(contactInfo.element).find(".editWrapper .contactInfoSearchSelect").searchSelect("data", {value: contact.Label});
            //show the edit pane
            contactInfo._changePane("edit");
        },
        /**
         * Changes the category dropdown and sets up the correct label dropdown list
         * @param {string} category
         * @param {boolean} manuallySelect If the icon dropdown needs to be changes manually
         * @private
         */
        _changeType: function (category, manuallySelect) {
            var contactInfo = this, labels = [];
            //remove the select2 from the label dropdown
//            $(contactInfo.element).find(".editWrapper .contactInfoSearchSelect").searchSelect("destroy");
            //set the correct label list based on the category
            if (category === "Phone") {
                labels = phoneLabels;
            } else if (category === "Email") {
                labels = emailLabels;
            } else if (category === "Website") {
                labels = websiteLabels;
            } else {
                labels = otherLabels;
            }

            //get the selected label
            var label = $(contactInfo.element).find(".editWrapper .contactInfoSearchSelect").searchSelect("textSelection");
            var sameLabels;
            if (contactInfo._currentLabels === labels) {
                sameLabels = true;
            } else {
                contactInfo._currentLabels = labels;
            }
            //set the correct list of labels
            contactInfo._setupLabelDropdown();
            //if the labels are the same as before, reset to the original selected label
            if (sameLabels) {
                $(contactInfo.element).find(".editWrapper .contactInfoSearchSelect").searchSelect("dataSelected", label);
            }

            //change the selected category icon
            //get reference to the icon category dropdown
            var container = $(contactInfo.element).find(".iconContainer")[0];
            //replace the select2 container's class name with the new class
            $(container)[0].className = "select2-container iconContainer " + category.replace(/\s/g, "") + "Small";

            //set the category in the icon dropdown
            if (manuallySelect) {
                $(contactInfo.element).find(".labelIcon").select2("val", category);
            }
        },
        _changePane: function (newPane) {
            var contactInfo = this;
            //if moving to edit pane
            if (newPane === "edit") {
                $(contactInfo.element).find(".contactList").animate({
                    height: 'hide'
                }, "swing", function () {
                    $(contactInfo.element).find(".addButtonWrapper").attr("style", "display:none");
                    $(contactInfo.element).find(".save, .delete").attr("style", "display:block");
                    $(contactInfo.element).find(".editWrapper").animate({
                        height: 'show'
                    }, "swing");
                });
                //make sure the label dropdown is correct width
                contactInfo._setLabelWidth(".contactList");

                //if moving to list pane
            } else {
                $(contactInfo.element).find(".editWrapper").animate({
                    height: 'hide'
                }, "swing", function () {
                    $(contactInfo.element).find(".save, .delete").attr("style", "display:none");
                    $(contactInfo.element).find(".addButtonWrapper").attr("style", "display:block");
                    $(contactInfo.element).find(".contactList").animate({
                        height: 'show'
                    }, "swing");
                });

            }
        },
        //make sure the label dropdown is correct width
        _setLabelWidth: function (guideElement) {
            var contactInfo = this;
            var containerWidth = $(contactInfo.element).find(guideElement).width();
            $(contactInfo.element).find(".editWrapper .contactInfoSearchSelect").width(containerWidth - 28);
        },
        //remove the widget
        removeWidget: function () {
            var contactInfo = this;
            $(contactInfo.element)[0].innerHTML = "";
        }
    };

    $.widget("ui.contactInfo", contactInfo);
});