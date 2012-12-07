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
             *     onSelect {function(*)}
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
                minimumInputLength: 2,
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
                generalTools.observeInput(searchSelect.element.find("input"), $.proxy(searchSelect.updateOptionList, searchSelect), searchSelect.options.queryDelay || 1);

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
                    searchSelect.updateOptionList(this.value);
                });
                //Select an option on click or touchend. Does not occur if user is scrolling instead of selecting.
                searchSelect.element.find(".optionList").on("click touchend", searchSelect.element.find(".optionList li"), function (e) {
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
                        //Wait for listeners from other widgets to use the selected option before removing it from the DOM.
                        setTimeout(function () {
                            searchSelect.clearList();
                        }, searchSelect.options.queryDelay ? searchSelect.options.queryDelay : 0);
                        if (searchSelect.isTouchDevice) {
                            $(".km-scroll-wrapper").kendoMobileScroller("reset");
                        }
                    }
                    _scrolling = false;
                });
                //Set the scrolling flag to on.
                searchSelect.element.find(".optionList").on("touchmove", searchSelect.element.find(".optionList"), function (e) {
                    console.log("Scrolling...");
                    _scrolling = true;
                });
                //When clicking outside of the select widget, close the option list and handle text inside the textbox.
                $(document.body).on('click touchend', function (e) {
                    if (!($(e.target).closest(searchSelect.element)[0] === searchSelect.element.context)) {
//                            setTimeout(function () {
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
//                            }, searchSelect.options.queryDelay ? searchSelect.options.queryDelay : 0);
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
            // Public functions
            getOptions: function (searchTerm) {
                var searchSelect = this, matches = [];
                //get the list of location matches
                if (searchSelect.options.query) {
                    if (searchTerm.length >= searchSelect.options.minimumInputLength) {
                        searchSelect.options.query(searchTerm, $.proxy(searchSelect.updateOptionList, searchSelect));
                    } else {
                        searchSelect.clearList();
                    }
                } else {
                    var dataItem, i;
                    if (searchTerm.length) {
                        for (i = 0; i < searchSelect.options.data.length; i++) {
                            dataItem = searchSelect.options.data[i];
                            if (searchSelect.options.format(dataItem).toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                matches.push(dataItem);
                            }
                        }
                    } else {
                        matches = searchSelect.options.data;
                    }
                }
                return matches;
                if (searchSelect.isTouchDevice) {
                    $(".km-scroll-wrapper").kendoMobileScroller("scrollTo", 0, -(searchSelect.element.height()));
                    searchSelect.element.find(".optionList").css("-webkit-transform", "translate3d(0px, " + (searchSelect.element.height()) + "px, 0)").css("position", "relative").css("top", -searchSelect.element.height());
                    $(".km-scroll-container").css("-webkit-transform", "translate3d(0px, -1px, 0)");
                }
            },
            clearList: function () {
                var optionList = this.element.find(".optionList")[0];
                //Clear current list if there is one.
                while (optionList.hasChildNodes()) {
                    optionList.removeChild(optionList.lastChild);
                }
            },
            //Populates and edits the list of items that the user can select.
            updateOptionList: function (data) {
                var searchSelect = this,
                    optionList = searchSelect.element.find(".optionList"),
                    options = $.isArray(data) ? data : searchSelect.getOptions(data),
                    i;
                searchSelect.selectedOptionTempText = searchSelect.element.find("input").val();
                searchSelect.clearList();
                //add each returned item to the list
                for (i = 0; i < options.length; i++) {
                    $('<li id="' + i + '"><span class="name">' + searchSelect.options.format(options[i]) + '</div></li>').data("selectedData", options[i]).appendTo(optionList);
                }

                if (searchSelect.options.showPreviousSelection && searchSelect.selectedData && searchSelect.options.data) {
                    $('<li id="' + i + '"><span id="previousSelection" class="name">' + searchSelect.options.format(searchSelect.selectedData) + '</div></li>').data("selectedData", searchSelect.selectedData).appendTo(optionList);
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
            //Returns the selected data TODO: Allow user to select item using this method.
            dataSelection: function () {
                var searchSelect = this;
                return searchSelect.selectedData;
            },
            //Returns the current selected data's text
            textSelection: function () {
                var searchSelect = this;
                return searchSelect.selectedOptionText ? searchSelect.selectedOptionText : "";
            }
        };

        $.widget("ui.searchSelect", searchSelect);
    })(jQuery, window);
});
