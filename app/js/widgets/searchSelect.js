// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "underscore", "db/services", "ui/ui", "tools/generalTools", "kendo"], function ($, _, dbServices, fui, generalTools) {
    (function ($, window, undefined) {
        /**
         * A jquery widget that uses a textbox input to search for options in a list that is automatically generated from developer defined data.
         * *****NOTE: Setting a max height for option list in order to enable scrolling will only work along side KendoUI Mobile.
         */
        var searchSelect = {
            /**
             * options - {
             *     query {function(string, callback())}
             *        This should be a function that uses a passed string to query results. It should pass these results to the callback function supplied.
             *     data {Array.<*>}
             *         Used to define results immediately (independent of search term)
             *         array: data to display
             *     formatOption {function(data)}
             *         should return text or a valid HTML string to display as an option (defaults to JSON.stringify())
             *     onSelect {function(e, selectedData)}
             *         A callback function triggered when an item is selected. The parameters are the triggered jQuery event and the selected data.
             *     minimumInputLength {int}
             *         number of characters necessary search box to start a search (defaults to 1)
             *     showPreviousSelection {boolean}
             *         defines whether the previous selection should be attached at the end of the list or not (defaults to false)
             *         only works for predefined data, user must set this in their query function if they desire such behavior.
             *     }
             */
            options: {
                query: undefined,
                data: undefined,
                formatOption: function (data) {
                    return JSON.stringify(data);
                },
                onSelect: function (event, selectedData) {
                    this._trigger("selected", event, selectedData);
                },
                queryDelay: null,
                minimumInputLength: 1,
                showPreviousSelection: false
            },
            _create: function () {
                var searchSelect = this;
                /**
                 * Model for searchSelect widget elements.
                 * <div id="" class=""> <-- This is the element that searchSelect is created on (id/class can be whatever user desires).
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
                 */
                var element = searchSelect.element.context;

                element.appendChild(document.createElement("div"));
                element.children[0].appendChild(document.createElement("input"));
                element.children[0].children[0].setAttribute("type", "text");
                element.appendChild(document.createElement("div"));
                element.children[1].setAttribute("id", "optionListScroller");
                element.children[1].setAttribute("data-role", "scroller");
                element.children[1].setAttribute("data-elastic", "false");
                element.children[1].setAttribute("class", "scroller-content");
                element.children[1].appendChild(document.createElement("ul"));
                element.children[1].children[0].setAttribute("class", "optionList");

                //Listen to input in search box and update the widget accordingly.
                generalTools.observeInput(searchSelect.element.find("input"), $.proxy(searchSelect._getOptions, searchSelect), searchSelect.options.queryDelay || 1);

                try {
                    document.createEvent("TouchEvent");
                    searchSelect.isTouchDevice = true;
                } catch (e) {
                    searchSelect.isTouchDevice = false;
                }

                if (!searchSelect.isTouchDevice) {
                    searchSelect.element.find(".optionList").css("overflow-y", "auto");
                }

                //These variables act as flags in order to stop behavior from certain listeners when other listeners fire.
                var _scrolling;

                //Event Listeners
                searchSelect.element.find("input").on("click touchstart", searchSelect.element.find("input"), function (e) {
                    if (searchSelect.selectedOptionTempText) {
                        this.value = searchSelect.selectedOptionTempText;
                    } else {
                        this.value = "";
                    }
                    searchSelect.selectedOptionTempText = searchSelect.element.find("input").val();
                    searchSelect._getOptions(this.value);
                });
                //Select an option on click or touchend. Does not occur if user is scrolling instead of selecting.
                searchSelect.element.find(".optionList").on("click touchend", searchSelect.element.find(".optionList li"), function (e) {
                    //Wait for scrolling flag to get set if user is scrolling.
                    setTimeout(function () {
                        if (!_scrolling) {
                            searchSelect.selectedData = $(e.target).parent().data().selectedData || $(e.target).data().selectedData;
                            if (e.target.nodeName === "SPAN") {
                                searchSelect.selectedOptionText = $(e.target).parent()[0].innerText
                            } else {
                                searchSelect.selectedOptionText = $(e.target)[0].innerText;
                            }
                            searchSelect.element.find("input")[0].value = searchSelect.selectedOptionText;
                            searchSelect.selectedOptionTempText = "";
                            searchSelect.options.onSelect(e, searchSelect.selectedData);
//                            //Wait for listeners from other widgets to use the selected option before removing it from the DOM.
//                            setTimeout(function () {
                                searchSelect.clearList();
//                            }, 200);
                            if (searchSelect.isTouchDevice) {
                                $(".km-scroll-wrapper").kendoMobileScroller("reset");
                            }
                        }
                    }, 200);
                    _scrolling = false;
                });
                //Set the scrolling flag to on.
                searchSelect.element.find(".optionList").on("touchmove", searchSelect.element.find(".optionList"), function (e) {
                    console.log("Scrolling...");
                    _scrolling = true;
                });
                $(document.body).on('touchmove', function (e) {
                    console.log("Scrolling...");
                    _scrolling = true;
                });
                //When clicking outside of the select widget, close the option list and handle text inside the textbox.
                $(document.body).on('click touchend', function (e) {
                    if (!($(e.target).closest(searchSelect.element)[0] === searchSelect.element.context)) {
                        setTimeout(function () {
                            if (!_scrolling) {
                                if (searchSelect.selectedOptionText) {
                                    searchSelect.element.find("input")[0].value = searchSelect.selectedOptionText;
                                } else {
                                    searchSelect.selectedOptionTempText = searchSelect.element.find("input")[0].value;
                                    searchSelect.element.find("input")[0].value = "";
                                }
                                searchSelect.clearList();
                                if (searchSelect.isTouchDevice) {
                                    $(".km-scroll-wrapper").kendoMobileScroller("reset");
                                }
                            }
                        }, 200);
                    }
                });
            },
            // Private functions
            //Disable touch scrolling of the view when user is scrolling whatever element is passed.
            _disableTouchScroll: function (element) {
                if (this.isTouchDevice) {
                    var scrollStartPos = 0;
                    element.addEventListener("touchstart", function (event) {
                        scrollStartPos = this.scrollTop + event.touches[0].pageY;
                        event.preventDefault();
                    }, false);
                    element.addEventListener("touchmove", function (event) {
                        this.scrollTop = scrollStartPos - event.touches[0].pageY;
                        event.preventDefault();
                    }, false);
                }
            },
            _getOptions: function (searchTerm) {
                var searchSelect = this, matches = [];
                if (searchSelect.options.data) {
                    //get the list of location matches
                    var dataItem, i;
                    if (searchTerm.length >= searchSelect.options.minimumInputLength) {
                        for (i = 0; i < searchSelect.options.data.length; i++) {
                            dataItem = searchSelect.options.data[i];
                            if (searchSelect.options.formatOption(dataItem).toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                matches.push(dataItem);
                            }
                        }
                    } else {
                        matches = searchSelect.options.data;
                    }
                    searchSelect.open(matches);
                } else {
                    searchSelect.options.query(searchTerm, $.proxy(searchSelect.open, searchSelect));
                }
                if (searchSelect.isTouchDevice) {
                    $(".km-scroll-wrapper").kendoMobileScroller("scrollTo", 0, -(searchSelect.element.height()));
                    searchSelect.element.find(".optionList").css("-webkit-transform", "translate3d(0px, " + (searchSelect.element.height()) + "px, 0)").css("position", "relative").css("top", -searchSelect.element.height());
                    $(".km-scroll-container").css("-webkit-transform", "translate3d(0px, -1px, 0)");
                }
            },
            // Public functions
            clearList: function () {
                var optionList = this.element.find(".optionList")[0];
                //Clear current list if there is one.
                while (optionList.hasChildNodes()) {
                    optionList.removeChild(optionList.lastChild);
                }
            },
            /**
             * Opens the list of items the user can select.
             */
            open: function (options) {
                var searchSelect = this,
                    optionList = searchSelect.element.find(".optionList"),
                    i;
                searchSelect.clearList();
                //Set option list to same width as input box.
                searchSelect.element.find("#optionListScroller").width(searchSelect.element.find("input").parent().width());
                if (options) {
                    if (options.length) {
                        //Add each option item to the list.
                        for (i = 0; i < options.length; i++) {
                        optionList.append($('<li id="' + i + '"><span class="name">' + searchSelect.options.formatOption(options[i]) + '</span></li>').data("selectedData", options[i]));
                        }
                    } else {
                        optionList.append($('<div id="noOptions"><span>No Options Found</span></div>'));
                    }
                }
                if (searchSelect.options.showPreviousSelection && searchSelect.selectedData && searchSelect.options.data) {
                    optionList.append($('<li id="' + i + '"><span id="previousSelection" class="name">' + searchSelect.options.formatOption(searchSelect.selectedData) + '</span></li>').data("selectedData", searchSelect.selectedData));
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
            //Returns the selected data. If a parameter is supplied it set the current selection to the corresponding data.
            data: function (selectData) {
                var searchSelect = this;

                if (selectData) {
                    searchSelect.selectedData = selectData;
                    searchSelect.selectedOptionText = searchSelect.options.formatOption(selectData);
                    searchSelect.element.find("input")[0].value = searchSelect.selectedOptionText;
                    searchSelect.selectedOptionTempText = "";
                    searchSelect.options.onSelect(null, searchSelect.selectedData);
                    //Wait for listeners from other widgets to use the selected option before removing it from the DOM.
                }

                return searchSelect.selectedData;
            },
            //Returns the current selected data's text.
            text: function () {
                var searchSelect = this;
                return searchSelect.selectedOptionText ? searchSelect.selectedOptionText : "";
            }
        };

        $.widget("ui.searchSelect", searchSelect);
    })(jQuery, window);
});
