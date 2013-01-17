// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

//need to require kendo so it is loaded before this widget, otherwise funky stuff happens
define(["tools/generalTools", "tools/parserTools", "tools/analytics", "widgets/searchSelect"], function (generalTools, parserTools, analytics) {
    //region Locals

    //labels for each category
    var phoneLabels = ["Mobile", "Work", "Home", "Fax"],
        websiteLabels = ["Personal", "Business", "Blog"],
        emailLabels = ["Personal" , "Business"],
        otherLabels = [];
    //endregion

    var widget = {
        //Contacts is an array of the contacts for the widget to display.
        options: {
            data: []
        },
        _isNew: null,
        _editIndex: null,
        //the currently selected category (phone / website / email) labels
        _categoryLabels: null,
        _init: function () {
            var widget = this;
            widget._renderList();
        },
        _create: function () {
            var widget = this, element = $(widget.element);
            var _contactInfo = $('<h3>Contact Info</h3>' +
                //list pane(first view)
                '<ul class="splitBtnList"></ul>' +
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

            widget.element.append(_contactInfo);

            //setup the drop down of category icons
            element.find(".labelIcon").select2({
                placeholder: "",
                width: "28px",
                containerCssClass: "iconContainer OtherSmall",
                minimumResultsForSearch: 15,
                dropdownCssClass: "bigdrop iconDropdown"
            }).on("change", function (e) {
                    //change the label icon
                    widget._changeType(e.val, false);
                });

            widget._setupLabelSelector();

            element.find(".add").on("click touchend", function () {
                //add an empty contact to the list
                widget.options.data.unshift({Entity: "New", Id: generalTools.newGuid(), Data: "", Type: "Other", Label: ""});
                widget._edit(0);
                widget._isNew = true;
            });

            element.find(".save").on("click touchend", element, function () {
                var contact = widget.select();

                //save the old value to be used to check for changes
                var oldContact = generalTools.deepClone(contact);

                //get the value of the selected label
                var selectedLabel = widget._labelSearchSelect.text();

                //set the value, label, category
                contact.Data = element.find(".editWrapper .value").val();
                contact.Label = selectedLabel;
                contact.Type = element.find(".labelIcon").select2("val");

                //check if the label exists in the list of labels
                //if new, add it to the corresponding list
                var existingLabel = _.find(widget._categoryLabels, function (label) {
                    return label === selectedLabel;
                });
                if (!existingLabel) {
                    widget._categoryLabels.push(selectedLabel);
                }

                //call the respective call back function
                if (widget._isNew && widget.options.entity) {
                    widget.options.entity.create(contact);
                } else {
                    //check if contact changed
                    var newContact = generalTools.deepClone(contact);
                    if (!_.isEqual(newContact, oldContact) && widget.options.entity) {
                        widget.options.entity.update(newContact);
                    }
                }

                //open the list with the new values
                widget._renderList();
            });

            element.find(".delete").on("click touchend", element, function () {
                var id = widget.select().Id;

                //remove the selected contact from the list
                widget.options.data.splice(widget._editIndex, 1);

                //refresh the list of contacts
                widget._renderList();

                //submit the change
                if (widget.options.entity) {
                    widget.options.entity.destroy(id);
                }
            });

            //automatically update the category as the value changes
            generalTools.observeInput(element.find(".editWrapper .value"), function (string) {
                var category;
                //check what the value is(phone, email, website, or other)
                if (parserTools.isEmail(string)) {
                    category = "Email";
                    //TODO use suggestion instead https://github.com/Kicksend/mailcheck
                } else if (parserTools.isUrl(string)) {
                    category = "Website";
                } else if (parserTools.isPhone(string)) {
                    category = "Phone";
                } else {
                    category = "Other";
                }
                //set the category
                widget._changeType(category, true);
            }, 250);

            $(window).resize(function () {
                widget._setLabelWidth(".editWrapper");
            });
        },

        _renderList: function () {
            var widget = this, element = $(widget.element), contacts = widget.options.data,
                list, category, label, value;

            //clear the edit info
            widget._isNew = false;
            widget._editIndex = -1;

            list = element.find(".splitBtnList");
            list[0].innerHTML = "";

            for (var i = 0; i < contacts.length; i++) {
                //get the values for the contact
                value = contacts[i].Data;
                category = contacts[i].Type;
                if (category === "Phone Number") {
                    category = "Phone"
                } else if (category === "Email Address") {
                    category = "Email"
                }
                label = contacts[i].Label;

                //remove the "http://" if website
                if (value && category === "Website") {
                    value = value.replace("http://", "");
                }

                //setup the individual contact element
                var li = "<li id='" + i + "'><div class='splitEditBtn'><span></span></div><a class='info' target='_blank'>" +
                    "<span class='" + category + "'></span><p class='label'>" + label + "</p><p class='value'>" + value + "</p></a></li>";
                //add it to the lists
                list.append(li);
            }

            element.find(".splitBtnList a").on("click touchend", function (e) {
                //get the index of the contact that was clicked on
                 var index = e.currentTarget.parentElement.id;
                 var value = contacts[index].Data;

                if (e.currentTarget.children[0].className === "Phone") {
                    analytics.track("Phone Contact Click");
                    generalTools.call(value);
                } else if (e.currentTarget.children[0].className === "Email") {
                    analytics.track("Email Contact Click");
                    generalTools.email(value);
                } else if (e.currentTarget.children[0].className === "Website") {
                    analytics.track("Website Contact Click");
                    generalTools.openUrl(value);
                }
            });

            //setup edit button click
            element.find(".splitEditBtn").on("click touchend", function (e) {
                var index;
                //get the id of the list item that was clicked on (need to check if the span or div element was clicked on)
                if (e.target.className === "splitEditBtn") {
                    index = e.target.parentNode.id;
                } else {
                    index = e.target.parentNode.parentElement.id;
                }

                //move to edit mode
                widget._edit(index);
            });

            widget._changePane("");
        },

        //creates a search select for the list of labels
        _setupLabelSelector: function () {
            var widget = this;

            if (widget._labelSearchSelect) {
                //TODO
                // widget._labelSearchSelect.destroy();
            }

            widget._labelSearchSelect = $(widget.element).find(".contactInfoSearchSelect").searchSelect({
                query: function (searchTerm, callback) {
                    //clone the labels
                    var categoryLabels = widget._categoryLabels.slice();
                    if (searchTerm !== "") {
                        var labelExists = _.any(categoryLabels, function (label) {
                            return label === searchTerm;
                        });

                        if (!labelExists) {
                            categoryLabels.unshift(searchTerm);
                        }
                    }

                    callback(categoryLabels);
                },
                minimumInputLength: 0
            }).data("searchSelect");
        },

        /**
         * A function to setup edit mode
         * @param {Number} index Index of the item to edit
         * @private
         */
        _edit: function (index) {
            var widget = this, type;

            widget._editIndex = index;
            var contact = widget.options.data[index];

            //set the value in the text box
            $(widget.element).find(".editWrapper .value").val(contact.Data);

            //set the category
            if (contact.Type === "Phone Number") {
                type = "Phone"
            } else if (contact.Type === "Email Address") {
                type = "Email"
            } else {
                type = contact.Type
            }
            widget._changeType(type, true);

            //set the label
            widget._labelSearchSelect.data(contact.Label);

            //show the edit pane
            widget._changePane("edit");
        },

        /**
         * Changes the category drop down and sets up the correct label drop down list
         * @param {string} category
         * @param {boolean} updateIcon If the icon drop down needs to be changed
         * @private
         */
        _changeType: function (category, updateIcon) {
            var widget = this, element = $(widget.element), labels = [];
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
            widget._categoryLabels = labels;

            //set the correct list of labels
            widget._setupLabelSelector();

            //change the selected category icon
            //get reference to the icon category dropdown
            var container = element.find(".iconContainer")[0];

            //replace the select2 container's class name with the new class
            $(container)[0].className = "select2-container iconContainer " + category.replace(/\s/g, "") + "Small";

            //set the category in the icon drop down
            if (updateIcon) {
                element.find(".labelIcon").select2("val", category);
            }
        },

        _changePane: function (newPane) {
            var widget = this, element = $(widget.element);
            //if moving to edit pane
            if (newPane === "edit") {
                element.find(".splitBtnList").animate({
                    height: 'hide'
                }, "swing", function () {
                    element.find(".addButtonWrapper").attr("style", "display:none");
                    element.find(".save, .delete").attr("style", "display:block");
                    element.find(".editWrapper").animate({
                        height: 'show'
                    }, "swing");
                });
                //make sure the label dropdown is correct width
                widget._setLabelWidth(".splitBtnList");

                //if moving to list pane
            } else {
                element.find(".editWrapper").animate({
                    height: 'hide'
                }, "swing", function () {
                    element.find(".save, .delete").attr("style", "display:none");
                    element.find(".addButtonWrapper").attr("style", "display:block");
                    element.find(".splitBtnList").animate({
                        height: 'show'
                    }, "swing");
                });
            }
        },

        //make sure the label drop down is correct width
        _setLabelWidth: function (guideElement) {
            var widget = this;
            var containerWidth = $(widget.element).find(guideElement).width();
            $(widget.element).find(".contactInfoSearchSelect").width(containerWidth - 28);
        },

        /**
         * @return {*} The selected contact (only available in edit mode)
         */
        select: function () {
            var widget = this;
            if (widget._editIndex < 0) {
                return null;
            }
            return widget.options.data[widget._editIndex];
        },

        //remove the widget
        destroy: function () {
            //TODO destroy inner select2's searchSelect other widgets
            //TODO de-register listeners
            var widget = this;
            $(widget.element)[0].innerHTML = "";
            // widget._labelSearchSelect.destroy();
        }
    };

    $.widget("ui.contactInfo", widget);
});