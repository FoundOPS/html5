// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "underscore", "db/services", "ui/ui", "tools/generalTools", "kendo"], function ($, _, dbServices, fui, generalTools) {
    /**
     * A jquery widget that uses a textbox input to search for options in a list that is automatically generated from developer defined data.
     * *****NOTE: Setting a max height for option list in order to enable scrolling will only work along side KendoUI Mobile.
     * @param config - {
     *          query {function({term: string, render: function(Array.<*>)})}
     *              Used to query results for the search term
     *              Parameters
     *                  searchTerm: the search term
     *                  render: callback function to render the data
     *          data {Array.<*>}
     *              Used to define results immediately (independent of search term)
     *              array: data to display
     *          format {function(data)}
     *              should return the value to display as an option (defaults to toString())
     *          onSelect {function(*)}
     *              A callback function triggered when an item is selected. The parameters are the triggered jQuery event and the selected data.
     *          minimumInputLength {int}
     *              number of characters necessary search box to start a search (defaults to 1)
 *              showPreviousSelection {boolean}
 *                  defines whether the previous selection should be attached at the end of the list or not (defaults to false)
 *                  only works for predefined data, user must set this in their query function if they desire such behavior.
     *        }
     * @return {*} Returns the jquery widget (allows widget to be chainable).
     */
    $.fn.selectorWidget = function (config) {
        return this.each(function () {
            var selector = this, i;

            if (!config.query && !config.data) {
                throw "The selector widget did not recieve any data.";
            }
            if (!config.minimumInputLength) {
                config.minimumInputLength = 1;
            }
            if (!config.format) {
                config.format = function (data) {
                    return JSON.stringify(data);
                };
            }
            var isTouchDevice = function() {
                try{
                    document.createEvent("TouchEvent");
                    return true;
                }catch(e){
                    return false;
                }
            };

            /**
             * Model for selectorWidget elements.
             * <div class="selectSearch" style=" ">
             *     <div>
             *         <input id="selectSearchTextBox" type="text" />
             *     </div>
             *     <div data-role="scroller" class="scroller-content">
             *         <ul class="optionList">
             *             <!--options are generated here-->
             *         </ul>
             *     </div>
             * </div>
             */
            selector.appendChild(document.createElement("div"));
            selector.children[0].appendChild(document.createElement("input"));
            selector.children[0].children[0].setAttribute("type", "text");
            selector.children[0].children[0].setAttribute("id", "selectSearchTextBox");
            selector.appendChild(document.createElement("div"));
            selector.children[1].setAttribute("id", "optionListScroller");
            selector.children[1].setAttribute("data-role", "scroller");
            selector.children[1].setAttribute("class", "scroller-content");
            selector.children[1].appendChild(document.createElement("ul"));
            selector.children[1].children[0].setAttribute("class", "optionList");
            if (!isTouchDevice()) {
                selector.children[1].children[0].setAttribute("style", "overflow-y: auto");
            }

            //Disable touch scrolling of the view when user is scrolling whatever element is passed.
            var touchScroll = function(element) {
                    var scrollStartPos = 0;
                    element.addEventListener("touchstart", function(event) {
                        scrollStartPos = this.scrollTop + event.touches[0].pageY;
                        event.preventDefault();
                    }, false);
                    element.addEventListener("touchmove", function(event) {
                        this.scrollTop = scrollStartPos - event.touches[0].pageY;
                        event.preventDefault();
                    }, false);
            };
            touchScroll(selector.children[1].children[0]);

            //Fetches the options to display for selection based on the user's provided data source and his/her search term.
            var getOptions = function (searchText) {
                //get the list of location matches
                if (config.query) {
                    if (searchText.length >= config.minimumInputLength) {
                        var data = config.query({searchTerm: searchText, render: selector._updateOptionList});
                    } else {
                        selector._clearList();
                    }
                } else {
                    var dataItem, matches = [];
                    if (searchText.length) {
                        for (i = 0; i < config.data.length; i++) {
                            dataItem = config.data[i];
                            if (config.format(dataItem).toLowerCase().indexOf(searchText.toLowerCase()) !== -1) {
                                matches.push(dataItem);
                            }
                        }
                    } else {
                        matches = config.data;
                    }
                    selector._updateOptionList(matches);
                }
                if (isTouchDevice()) {
                    $(".km-scroll-wrapper").kendoMobileScroller("scrollTo", 0, -($('.selectorWidget').height()));
                    $(".selectorWidget .optionList").css("-webkit-transform", "translate3d(0px, "+($('.selectorWidget').height())+"px, 0)").css("position", "relative").css("top", -$('.selectorWidget').height());
                    $(".km-scroll-container").css("-webkit-transform", "translate3d(0px, -1px, 0)");
                }
            };

            //Listen to input in search box and update the widget accordingly.
            generalTools.observeInput($(selector).find("input"), getOptions, config.query ? 0 : 750);

            selector._clearList = function () {
                var optionList = $(selector).find(".optionList");
                //Clear current list if there is one.
                while (optionList[0].hasChildNodes()) {
                    optionList[0].removeChild(optionList[0].lastChild);
                }
            };

            //Populates and edits the list of items that the user can select.
            selector._updateOptionList = function (options) {
                var optionList = $(selector).find(".optionList");
                selector._clearList();
                //add each returned item to the list
                for (i = 0; i < options.length; i++) {
                    $('<li id="' + i + '"><span class="name">' + config.format(options[i]) + '</div></li>').data("selectedData", options[i]).appendTo(optionList);
                }

                if (config.showPreviousSelection && selector.selectedData && config.data) {
                    $('<li id="' + i + '"><span id="prevoiusSelection" class="name">' + config.format(selector.selectedData) + '</div></li>').data("selectedData", selector.selectedData).appendTo(optionList);
                }
                //adjust the text to make sure everything is vertically centered
                $(selector).find(".optionList li").each(function () {
                    if ($(this)[0].childNodes[0].clientHeight < 25) {
                        $(this).addClass("singleLine");
                    } else if ($(this)[0].childNodes[0].clientHeight > 50) {
                        $(this).addClass("tripleLine");
                    }
                });
            };

            //These variables act as flags in order to stop behavior from certain listeners when other listeners fire.
            var _scrolling;

            //Event Listeners
            $(selector.children[0].children[0]).on("click touchstart", selector.children[0].children[0], function(e) {
                if (selector.selectedOptionTempText && !selector.selectedOptionText) {
                    this.value = selector.selectedOptionTempText || "";
                } else {
                    this.value = "";
                }
                getOptions(selector.children[0].children[0].value);
            });
            //Select an option on click or touchend. Does not occur if user is scrolling instead of selecting.
            $(selector).find(".optionList").on("click touchend", $(selector).find(".optionList li"), function(e) {
                if (!_scrolling) {
                    selector.selectedData = $(e.target).parent().data().selectedData || $(e.target).data().selectedData;
                    if (e.target.nodeName === "SPAN") {
                        selector.selectedOptionText = $(e.target).parent()[0].innerText
                    } else {
                        selector.selectedOptionText = $(e.target)[0].innerText;
                    }
                    selector.children[0].children[0].value = selector.selectedOptionText;
                    config.onSelect(e, selector.selectedData);
                    selector._clearList();
                    if (isTouchDevice()) {
                        $(".km-scroll-wrapper").kendoMobileScroller("reset");
                    }
                }
                _scrolling = false;
            });
            //Set the scrolling flag to on.
            $(selector).find(".optionList").on("touchmove", $(selector).find(".optionList"), function(e) {
                _scrolling = true;
            });
            //When clicking outside of the select widget, close the option list and handle text inside the textbox.
            $(selector.children[0].children[0]).blur(function(e) {
                //Wait until click/touchend listener on options list fires.
                setTimeout(function () {
                    if (!_scrolling) {
                        if (selector.selectedOptionText) {
                            selector.children[0].children[0].value = selector.selectedOptionText;
                        } else {
                            selector.selectedOptionTempText = selector.children[0].children[0].value;
                            selector.children[0].children[0].value = "";
                        }
                        selector._clearList();
                        if (isTouchDevice()) {
                            $(".km-scroll-wrapper").kendoMobileScroller("reset");
                        }
                    }
                }, 200);
            });
        });
    };
});