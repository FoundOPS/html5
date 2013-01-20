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
             *     formatItem {function(data)}
             *         should return text or a valid HTML string to display as an item (defaults to toString)
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
                //Note: Currently used in location.js line 102
                formatItem: function (data) {
                    return data ? data.toString() : "";
                },
                onSelect: function (event, selectedData) {
                    //Calls jquery widget _trigger
                    if (this._trigger) {
                        this._trigger("selected", event, selectedData);
                    }
                },
                onClose: null,
                queryDelay: null,
                minimumInputLength: 1,
                showPreviousSelection: false,
                additionalListItem: null,
                dontCloseOn: null
            },

            // Private functions

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
            //_create() -
            _create: function () {
                var widget = this,
                    element = widget.element,
                    context = element.context;

                //Flags
                var scrolling = false;

                //Create div and input
                var divElement = document.createElement("div");
                var inputElement = document.createElement("input");
                var $input = $(inputElement);

                //Set input type as text
                inputElement.setAttribute("type", "text");

                //TODO: Determine if appendChild should be used in place of append.
                //Add input to wrapper div and add to DOM.
                divElement.appendChild(inputElement);
                context.appendChild(divElement);

                //Create optionListScroller Div and set its attributes.
                var optionListScrollerDiv = document.createElement("div");
                $(optionListScrollerDiv).attr({
                    id: "optionListScroller",
                    "data-role": "scroller",
                    "data-elastic": "false",
                    "class": "scroller-content"
                });
                //Create list in new div and set its class.
                var optionListElement = document.createElement("ul");
                var $optionList = $(optionListElement);
                optionListElement.className = "optionList";

                //Add optionListElement to scroller div and add to DOM
                optionListScrollerDiv.appendChild(optionListElement);
                context.appendChild(optionListScrollerDiv);

                //Listen to input in search box and update the widget accordingly.
                generalTools.observeInput($input, $.proxy(widget._getListItems, widget), widget.options.queryDelay || 1);

                //TODO: Check if this is compatible with all devices.
                //Tests if touch device by checking for exceptions on TouchEvent creation.
                try {
                    document.createEvent("TouchEvent");
                    widget.isTouchDevice = true;
                } catch (e) {
                    widget.isTouchDevice = false;
                }

                //If not touch, allow normal html div scrolling.
                if (!widget.isTouchDevice) {
                    $optionList.css("overflow-y", "auto");
                }

                //NOTE: Can't add classes to element directly. Causes menu to clear.
                $optionList.addClass("closed");

                //Event Listeners
                $input.on("click touchstart", function () {
                    /*if (widget.selectedOptionTempText) {
                        $input.val(widget.selectedOptionTempText);
                    }
                    widget.selectedOptionTempText = $input.val();*/
                    widget._getListItems($input.val());
                });

                //Select an option on click or touchend. Does not occur if user is scrolling instead of selecting.
                $optionList.on("click touchend", function (e) {
                    //Wait for scrolling flag to get set if user is scrolling.
                    setTimeout(function () {
                        if (!scrolling) {
                            //TODO: When would data be in parent?
                            widget.selectedData = $(e.target).parent().data().selectedData || $(e.target).data().selectedData;

                            var selectedDataText = widget.options.formatItem(widget.selectedData);
                            $input.val(selectedDataText);

                            //widget.selectedOptionTempText = "";

                            if (widget.options.onSelect) {
                                widget.options.onSelect(e, widget.selectedData);
                            }
                            //Wait for listeners from other widgets to use the selected option before removing it from the DOM.
                            //setTimeout(function () {
                            widget.clearList();
                            //If onClose callback set, execute.
                            if (widget.options.onClose) {
                                widget.options.onClose();
                            }

                            //NOTE: Can't add classes to element directly. Causes menu to clear.
                            $optionList.removeClass("opened");
                            $optionList.addClass("closed");

                            //}, 200);
                            if (widget.isTouchDevice) {
                                $(".km-scroll-wrapper").kendoMobileScroller("reset");
                            }
                        }
                    }, 200);
                    scrolling = false;
                });

                //Set the scrolling flag to on.
                $optionList.on("touchmove", function () {
                    scrolling = true;
                });

                $(document.body).on('touchmove', function () {
                    scrolling = true;
                });

                //When clicking outside of the select widget, close the option list and handle text inside the textbox.
                $(document.body).on('click touchend', function (e) {
                    //This if statement creates an xor logic gate
                    //If there is a dontCloseOn option provided by the user it will use it to check if it should clear the option list.
                    //TODO: Find a way to do this without relying on searchSelect element's class name (element.context.className).

                    var parentClassesLen = $(e.target).parents().filter("." + element.context.className).length;

                    var className = e.target.className;
                    var dontCloseOn = widget.options.dontCloseOn;
                    var classNameNotInDontCloseOn = (className && dontCloseOn) ? className.indexOf(dontCloseOn) === -1 : false;

                    //Close list if clicked element is outside list.
                    //If not closed, do not clear.
                    if ( $optionList.hasClass("opened") && (parentClassesLen === 0 || classNameNotInDontCloseOn) ){
                        setTimeout(function () {
                            if (!scrolling) {
                                //widget.selectedOptionTempText = $input.val();
                                widget.clearList();
                                if (widget.options.onClose) {
                                    widget.options.onClose();
                                }

                                //NOTE: Can't add classes to element directly. Causes menu to clear.
                                $optionList.removeClass("opened");
                                $optionList.addClass("closed");

                                if (widget.isTouchDevice) {
                                    $(".km-scroll-wrapper").kendoMobileScroller("reset");
                                }
                            }
                        }, 200);
                    }
                });
            },

            //TODO: Pull open out of _getListItems.
            _getListItems: function (searchTerm) {
                var widget = this,
                    element = widget.element,
                    matches = [],
                    options = widget.options;

                var searchLen = searchTerm.length;
                var minInputLen = widget.options.minimumInputLength;

                //If data is defined, get list from query
                //Else, send empty matches.
                if (searchLen >= minInputLen) {
                    var data = options.data || null;
                    if (data) {
                        var i = 0;
                        for (; i < data.length; i++) {
                            var dataItem = data[i];
                            var dataItemLowercase = options.formatItem(dataItem).toLowerCase();
                            var searchTermLowercase = searchTerm.toLowerCase();

                            // If searchTerm is found in dataItem, push to matches.
                            if (dataItemLowercase.indexOf(searchTermLowercase) !== -1) {
                                matches.push(dataItem);
                            }
                        }

                        widget.open(matches);
                    }else{
                        //Proxy is needed for widget 'this' context. 'this' is in caller's context otherwise.
                        if (options.query) {
                            options.query(searchTerm, $.proxy(widget.open, widget));
                        }
                    }
                }

                if (widget.isTouchDevice) {
                    $(".km-scroll-wrapper").kendoMobileScroller("scrollTo", 0, -(element.height()));

                    element.find(".optionList")
                        .css("-webkit-transform", "translate3d(0px, " + (element.height()) + "px, 0)")
                        .css("position", "relative")
                        .css("top", -element.height());

                    //TODO: Are these bug fixes?
                    $(".km-scroll-container").css("-webkit-transform", "translate3d(0px, -1px, 0)");
                }
            },

            // Public functions
            //clearList() - Clear list if there are nodes.
            clearList: function () {
                var optionList = this.element.find(".optionList")[0];

                //Fastest implementation http://jsperf.com/innerhtml-vs-removechild-yo/3
                //Sets child to the last child in optionList, checks if it exists.
                //Continues until all children are removed.
                var child;
                while (child = optionList.lastChild) {
                    optionList.removeChild(optionList.lastChild);
                }

                //Slower, but cleaner
                //optionList.empty();
            },
            //open(options) - Opens the list of items the user can select.
            open: function (items) {
                var widget = this,
                    element = widget.element,
                    $optionList = $(element).find(".optionList"),
                    $optionListScroller = $(element).find("#optionListScroller");

                //NOTE: Can't add classes to element directly. Causes menu to clear.
                $optionList.addClass("opened");
                $optionList.removeClass("closed");

                //Clear list before setting data.
                widget.clearList();

                //TODO: Give class to input wrapper and change optionList name.
                //Set option list to same width as input box.
                var inputParentWidth = element.find("input").parent().width();
                $optionListScroller.width(inputParentWidth);

                if (items && items.length > 0) {
                    //Add each option item to the list.
                    var i=0;
                    for (i = 0; i < items.length; i++) {
                        var className;
                        //use a different class for client locations
                        if (items[i].ClientId) {
                            className = "clientLocation";
                        } else {
                            className = "fromWeb";
                        }

                        var listElement = $('' +
                            '<li>' +
                                '<span class="' + className + '"></span>' +
                                '<span class="name">' + widget.options.formatItem(items[i]) + '</span>' +
                            '</li>');
                        $optionList.append(listElement);
                        listElement.data("selectedData", items[i]);
                        //console.log("selectedData: "+ listElement.data("selectedData"))
                    }
                } else {
                    //optionList.append($('<div id="noOptions"><span>No Options Found</span></div>'));
                }

                //If showPreviousSelection and selectedData are set, show previousSelection.
                if (widget.options.showPreviousSelection && widget.selectedData) {
                    //Create previous selection html.
                    var $previousSelection= $('' +
                         '<li>' +
                             '<span class="previousSelection"></span>' +
                             '<span id="previousSelection" class="name">' +
                                widget.options.formatItem(widget.selectedData) +
                            '</span>' +
                         '</li>');

                    //Attach selectedData to html and append to DOM.
                    $optionList.append($previousSelection);
                    $previousSelection.data("selectedData", widget.selectedData);
                }

                //If additionalItem is set, append it.
                var additionalItem = widget.options.additionalListItem;
                if (additionalItem) {
                    $optionList.append(additionalItem);
                }

                //TODO: Find out what the arbitrary height values are and document them.
                //Adjust the text to make sure everything is vertically centered
                if ($optionList.children().length > 0) {
                    //Find height of first child of list.
                    var firstChildHeight = $optionList.children(":first").height();
                    if (firstChildHeight < 25) {
                        $optionList.addClass("singleLine");
                    } else if (firstChildHeight > 50) {
                        $optionList.addClass("tripleLine");
                    }
                }
            },

            //data(selectData) - Returns the selected data.
            // If selectedData is passed, set the selectedData.
            // Function always returns widget.selectedData regardless of parameters.
            data: function (selectData) {
                var widget = this;

                if (selectData) {
                    widget.selectedData = selectData;
                    var $input = widget.element.find("input");

                    //Uses the text() function to format selectedData.
                    $input.val(widget.text());

                    //TODO private var
                    //widget.selectedOptionTempText = "";

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
                    var text = widget.options.formatItem(data);
                    return text ? text : "";
                }

                return "";
            },

            //TODO: Fix widget.selectedData to be set on when edited.
            //inputText() - Returns the current value in the input box.
            inputText: function (){
                var element = this.element;
                var $input = $(element).find("input");
                return $input ? $input.val() : "";
            }
        };

        $.widget("ui.searchSelect", widget);
    })(jQuery, window);
});