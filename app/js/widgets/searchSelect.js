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
             *     query {function({term: string, render: function(Array.<*>)})}
             *         Used to query results for the search term
             *         Parameters
             *             searchTerm: the search term
             *             render: callback function to render the data
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
                minimumInputLength: 2,
                showPreviousSelection: false
            },
            _init: function () {
                var searchSelect = this;
                /**
                 * Model for searchSelect widget elements.
                 * <div class="searchSelect">
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

                element.setAttribute("class", ".searchSelect");
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
                generalTools.observeInput($(element).find("input"), this.getOptions, this.options.query ? 0 : 750);

                try{
                    document.createEvent("TouchEvent");
                    searchSelect.isTouchDevice = true;
                }catch(e){
                    searchSelect.isTouchDevice = false;
                }

                //These variables act as flags in order to stop behavior from certain listeners when other listeners fire.
                var _scrolling;

                //Event Listeners
                this.element.find("input").on("click touchstart", this.element.find("input"), function(e) {
                    console.log(e);
                    if (searchSelect.selectedOptionTempText && !searchSelect.selectedOptionText) {
                        this.value = searchSelect.selectedOptionTempText || "";
                    } else {
                        this.value = "";
                    }
                    searchSelect.updateOptionList(this.value);
                });
                //Select an option on click or touchend. Does not occur if user is scrolling instead of selecting.
                this.element.find(".optionList").on("click touchend", this.element.find(".optionList li"), function(e) {
                    console.log(e);
//                    if (!_scrolling) {
//                        selector.selectedData = $(e.target).parent().data().selectedData || $(e.target).data().selectedData;
//                        if (e.target.nodeName === "SPAN") {
//                            selector.selectedOptionText = $(e.target).parent()[0].innerText
//                        } else {
//                            selector.selectedOptionText = $(e.target)[0].innerText;
//                        }
//                        selector.children[0].children[0].value = selector.selectedOptionText;
//                        this.options.onSelect(e, selector.selectedData);
//                        //Wait for listeners from other widgets to use the selected option before removing it from the DOM.
//                        setTimeout(function () {
//                            selector._clearList();
//                        }, 200);
//                        if (isTouchDevice()) {
//                            $(".km-scroll-wrapper").kendoMobileScroller("reset");
//                        }
//                    }
                    _scrolling = false;
                });
                //Set the scrolling flag to on.
                this.element.find(".optionList").on("touchmove", this.element.find(".optionList"), function(e) {
                    console.log(e);
                    _scrolling = true;
                });
                //When clicking outside of the select widget, close the option list and handle text inside the textbox.
                $('html').on('click touchend', function (e) {
                    var clicked = $(e.target);
                    //TODO: Find better listener for this.
                    var widgetID = searchSelect.element.context.id
                    if (clicked.parents(".searchSelect")[widgetID]) {
                        if (clicked.parents(".searchSelect")[widgetID].id === searchSelect.element.context.id) {
                            searchSelect.clearList();
                        }
                    } else {
                        searchSelect.clearList();
                    }
                });
//                this.element.find("input").blur(function(e) {
//                    console.log(e);
//                    _scrolling = false;
//                    //Wait until other listeners on options list fire.
//                    setTimeout(function () {
//                        if (!_scrolling) {
//                            if (searchSelect.selectedOptionText) {
//                                searchSelect.element.find("input").value = searchSelect.selectedOptionText;
//                            } else {
//                                searchSelect.selectedOptionTempText = searchSelect.element.find("input").value;
//                                searchSelect.element.find("input").value = "";
//                            }
//                            searchSelect.clearList();
//                            if (searchSelect.isTouchDevice) {
//                                $(".km-scroll-wrapper").kendoMobileScroller("reset");
//                            }
//                        }
//                    }, 200);
//                });
            },
            // Private functions
            //Disable touch scrolling of the view when user is scrolling whatever element is passed.
            _disableTouchScroll: function(element) {
                if(this.isTouchDevice) {
                    var scrollStartPos = 0;
                    element.addEventListener("touchstart", function(event) {
                        scrollStartPos = this.scrollTop + event.touches[0].pageY;
                        event.preventDefault();
                    }, false);
                    element.addEventListener("touchmove", function(event) {
                        this.scrollTop = scrollStartPos - event.touches[0].pageY;
                        event.preventDefault();
                    }, false);
                }
            },
            // Public functions
            getOptions: function (searchTerm) {
                //get the list of location matches
                if (this.options.query) {
                    if (searchTerm.length >= this.options.minimumInputLength) {
                        var data = this.options.query({searchTerm: searchTerm, render: this.updateOptionList});
                    } else {
                        this.clearList();
                    }
                } else {
                    var dataItem, matches = [], i;
                    if (searchTerm.length) {
                        for (i = 0; i < this.options.data.length; i++) {
                            dataItem = this.options.data[i];
                            if (this.options.format(dataItem).toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                matches.push(dataItem);
                            }
                        }
                    } else {
                        matches = this.options.data;
                    }
                    return matches;
                }
                if (this.isTouchDevice) {
                    $(".km-scroll-wrapper").kendoMobileScroller("scrollTo", 0, -($('.selectorWidget').height()));
                    this.element.find(".optionList").css("-webkit-transform", "translate3d(0px, "+($('.selectorWidget').height())+"px, 0)").css("position", "relative").css("top", -$('.selectorWidget').height());
                    $(".km-scroll-container").css("-webkit-transform", "translate3d(0px, -1px, 0)");
                }
            },
            clearList: function () {
                var optionList = this.element.find(".optionList");
                //Clear current list if there is one.
                while (optionList[0].hasChildNodes()) {
                    optionList[0].removeChild(optionList[0].lastChild);
                }
            },
            //Populates and edits the list of items that the user can select.
            updateOptionList: function (searchTerm) {
                var optionList = this.element.find(".optionList"),
                    options = this.getOptions(searchTerm),
                    i;
                this.clearList();
                //add each returned item to the list
                for (i = 0; i < options.length; i++) {
                    $('<li id="' + i + '"><span class="name">' + this.options.format(options[i]) + '</div></li>').data("selectedData", options[i]).appendTo(optionList);
                }

                if (this.options.showPreviousSelection && this.selectedData && this.options.data) {
                    $('<li id="' + i + '"><span id="previousSelection" class="name">' + this.options.format(this.selectedData) + '</div></li>').data("selectedData", this.selectedData).appendTo(optionList);
                }
                //adjust the text to make sure everything is vertically centered
                optionList.each(function () {
                    if ($(this)[0].childNodes[0].clientHeight < 25) {
                        $(this).addClass("singleLine");
                    } else if ($(this)[0].childNodes[0].clientHeight > 50) {
                        $(this).addClass("tripleLine");
                    }
                });
            }
        };
        $.widget("ui.searchSelect", searchSelect);
    })(jQuery, window);
});
