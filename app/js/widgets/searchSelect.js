// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["db/services", "ui/ui", "tools/generalTools"], function (dbServices, fui, generalTools) {
    (function ($, window, undefined) {
        /**
         * A jquery widget that uses a textbox input to search for options in a list that is automatically generated from developer defined data.
         * *****NOTE: Setting a max height for option list in order to enable scrolling will only work along side KendoUI Mobile.
         */
        var widget = {
            /**
             * options - {
             *     query {function(string, callback())}
             *        This should be a function that uses a passed string to query results.
             *        It should pass these results to the callback function supplied.
             *     data {Array.<*>}
             *         Used to define results immediately (independent of search term)
             *         array: data to display
             *     formatOption {function(data)}
             *         should return text or a valid HTML string to display as an option (defaults to toString)
             *     onSelect {function(e, selectedData)}
             *         A callback function triggered when an item is selected.
             *         The parameters are the triggered jQuery event and the selected data.
             *     onClose {function()}
             *         A callback function triggered when the list is closed.
             *     minimumInputLength {int}
             *         Number of characters necessary search box to start a search (defaults to 1)
             *     showPreviousSelection {boolean} (Default: false)
             *         Defines whether the previous selection should be attached at the end of the list.
             *         Only works for predefined data, user must set this in their query function if they desire such behavior.
             *     additionalListItem {string}
             *         Optionally add other items to the list (ex. "Manually Place Pin")
             *     dontCloseOn {string}
             *         A class from an element that the user would like to be able to click on without closing the optionList.
             * }
             */
            options: {
                query: undefined,
                data: undefined,
                formatOption: function (data) {
                    return data ? data.toString() : "";
                },
                onSelect: function (event, selectedData) {
                    console.log("selectedData: "+selectedData);
                },
                onClose: null,
                queryDelay: null,
                minimumInputLength: 1,
                showPreviousSelection: false,
                additionalListItem: null,
                dontCloseOn: null
            },

// Private functions

            //_create() -
            _create: function () {
                var widget = this,
                    element = widget.element;
                /**
                 * Model for searchSelect widget elements.
                 * searchSelect is created on the id/class below.
                 * <div id="" class="">
                 *     <div>
                 *         <input type="text" />
                 *     </div>
                 *     <div id="optionListScroller" data-role="scroller" class="scroller-content km-scroll-wrapper">
                 *         <div class="km-scroll-header"></div>
                 *         <div class="km-scroll-container">
                 *             <ul class="optionList">
                 *                 <!--options are generated here-->
                 *             </ul>
                 *         </div>
                 *         <div class="km-touch-scrollbar km-horizontal-scrollbar"></div>
                 *         <div class="km-touch-scrollbar km-vertical-scrollbar"></div>
                 *     </div>
                 * </div>
                 **/

                //These variables act as flags in order to stop behavior from certain listeners when other listeners fire.
                var _scrolling = false;

                var context = element.context;
                context.appendChild(document.createElement("div"));
                context.children[0].appendChild(document.createElement("input"));
                context.children[0].children[0].setAttribute("type", "text");
                context.appendChild(document.createElement("div"));
                $(context.children[1]).attr({
                    id: "optionListScroller",
                    "data-role": "scroller",
                    "data-elastic": "false",
                    "class": "scroller-content"
                });
                context.children[1].appendChild(document.createElement("ul"));
                context.children[1].children[0].setAttribute("class", "optionList");

                var input = element.find("input");

                //Listen to input in search box and update the widget accordingly.
                generalTools.observeInput(input, widget._getOptions, widget.options.queryDelay || 1);

                //Tests if touch device by checking for exceptions on TouchEvent creation.
                //TODO: Check if this is compatible with all devices.
                try {
                    document.createEvent("TouchEvent");
                    widget.isTouchDevice = true;
                } catch (e) {
                    widget.isTouchDevice = false;
                }

                //If not touch, allow normal html div scrolling.
                if (!widget.isTouchDevice) {
                    element.find(".optionList").css("overflow-y", "auto");
                }

                //Event Listeners
                input.on("click touchstart", function () {
                    if (widget.selectedOptionTempText) {
                        input.val(widget.selectedOptionTempText);
                    }
                    widget.selectedOptionTempText = input.val();
                    widget._getOptions(input.val());
                });

                //Select an option on click or touchend. Does not occur if user is scrolling instead of selecting.
                var optionsList = element.find(".optionList");
                optionsList.on("click touchend", function (e) {
                    //Wait for scrolling flag to get set if user is scrolling.
                    setTimeout(function () {
                        if (!_scrolling) {
                            widget.selectedData = $(e.target).parent().data().selectedData || $(e.target).data().selectedData;

                            element.find("input")[0].value = widget.options.formatOption(widget.selectedData);
                            widget.selectedOptionTempText = "";

                            if (widget.options.onSelect) {
                                widget.options.onSelect(e, widget.selectedData);
                            }
//                            //Wait for listeners from other widgets to use the selected option before removing it from the DOM.
//                            setTimeout(function () {
                            widget.clearList();
                            if (widget.options.onClose) {
                                widget.options.onClose();
                            }

//                            }, 200);
                            if (widget.isTouchDevice) {
                                $(".km-scroll-wrapper").kendoMobileScroller("reset");
                            }
                        }
                    }, 200);
                    _scrolling = false;
                });

                //Set the scrolling flag to on.
                optionsList.on("touchmove", function () {
                    _scrolling = true;
                });

                $(document.body).on('touchmove', function () {
                    _scrolling = true;
                });

                //When clicking outside of the select widget, close the option list and handle text inside the textbox.
                $(document.body).on('click touchend', function (e) {
                    //This if statement creates an xor logic gate
                    //If there is a dontCloseOn option provided by the user it will use it to check if it should clear the option list.
                    //TODO: Find a way to do this without relying on searchSelect element's class name (element.context.className).
                    if ($(e.target).parents().filter("." + element.context.className).length === 0 ||
                        widget.options.dontCloseOn && e.target.className ? e.target.className.indexOf(widget.options.dontCloseOn) === -1 : false) {
                        setTimeout(function () {
                            if (!_scrolling) {
                                widget.selectedOptionTempText = element.find("input")[0].value;
                                widget.clearList();
                                if (widget.options.onClose) {
                                    widget.options.onClose();
                                }

                                if (widget.isTouchDevice) {
                                    $(".km-scroll-wrapper").kendoMobileScroller("reset");
                                }
                            }
                        }, 200);
                    }
                });
            },

            _getOptions: function (searchTerm) {
                var widget = this, element = widget.element, matches = [];
                if (widget.options.data) {
                    //get the list of location matches
                    var dataItem, i;
                    if (searchTerm.length >= widget.options.minimumInputLength) {
                        for (i = 0; i < widget.options.data.length; i++) {
                            dataItem = widget.options.data[i];
                            if (widget.options.formatOption(dataItem).toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                matches.push(dataItem);
                            }
                        }
                        widget.open(matches);
                    }
                } else if (searchTerm.length >= widget.options.minimumInputLength) {
                    widget.open(matches);
                    widget.options.query(searchTerm, $.proxy(widget.open, widget));
                }

                if (widget.isTouchDevice) {
                    $(".km-scroll-wrapper").kendoMobileScroller("scrollTo", 0, -(element.height()));
                    element.find(".optionList").css("-webkit-transform", "translate3d(0px, " +
                        (element.height()) + "px, 0)").css("position", "relative").css("top", -element.height());
                    $(".km-scroll-container").css("-webkit-transform", "translate3d(0px, -1px, 0)");
                }
            },

// Public functions
            //clearList() -
            clearList: function () {
                var optionList = this.element.find(".optionList").first();
                //Clear current list if there is one.
                optionList.children().remove();
                /*while (optionList.hasChildNodes()) {
                 optionList.removeChild(optionList.lastChild);
                 }*/
            },

            //open(options) - Opens the list of items the user can select.
            open: function (options) {
                var widget = this,
                    element = widget.element,
                    optionList = element.find(".optionList");

                widget.clearList();
                //Set option list to same width as input box.
                var inputParentWidth = element.find("input").parent().width();
                element.find("#optionListScroller").width(inputParentWidth);
                if (options) {
                    if (options.length) {
                        //Add each option item to the list.
                        var i=0;
                        for (i = 0; i < options.length; i++) {
                            var className;
                            //use a different class for client locations
                            if (options[i].ClientId) {
                                className = "clientLocation";
                            } else {
                                className = "fromWeb";
                            }

                            var listElement = $('' +
                                '<li id="' + i + '">' +
                                    '<span class="' + className + '"></span>' +
                                    '<span class="name">' + widget.options.formatOption(options[i]) + '</span>' +
                                '</li>');
                            optionList.append(listElement);
                            listElement.data("selectedData", options[i]);
                            console.log("selectedData: "+ listElement.data("selectedData"))
                        }
                    } else {
                        //optionList.append($('<div id="noOptions"><span>No Options Found</span></div>'));
                    }
                }

                if (widget.options.showPreviousSelection && widget.selectedData) {
                    optionList.append($('<li><span class="previousSelection"></span><span id="previousSelection" class="name">' +
                        widget.options.formatOption(widget.selectedData) + '</span></li>').data("selectedData", widget.selectedData));
                }

                if (widget.options.additionalListItem) {
                    optionList.append($(widget.options.additionalListItem));
                }

                //adjust the text to make sure everything is vertically centered
                optionList.each(function () {
                    if (this.hasChildNodes()) {
                        if (this.childNodes[0].clientHeight < 25) {
                            $(this).addClass("singleLine");
                        } else if (this.childNodes[0].clientHeight > 50) {
                            $(this).addClass("tripleLine");
                        }
                    }
                });
            },

            //data(selectData) - Returns the selected data.
            // If a parameter is supplied it set the current selection to the corresponding data.
            data: function (selectData) {
                var widget = this;

                if (selectData) {
                    widget.selectedData = selectData;
                    widget.element.find("input")[0].value = widget.text();
                    //TODO private var
                    widget.selectedOptionTempText = "";
                    widget.options.onSelect(null, widget.selectedData);
                    //Wait for listeners from other widgets to use the selected option before removing it from the DOM.
                }

                return widget.selectedData;
            },

            //text() - Returns the current selected data's text.
            text: function () {
                var widget = this;
                var data = widget.selectedData;
                if (data) {
                    var text = widget.options.formatOption(data);
                    return text ? text : "";
                }

                return "";
            }
        };

        $.widget("ui.searchSelect", widget);
    })(jQuery, window);
});