// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "underscore", "db/services", "ui/ui", "tools/generalTools", "kendo"], function ($, _, dbServices, fui, generalTools) {
    /**
     * A jquery widget that uses a textbox input to search for options in a list that is automatically generated from developer defined data.
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
     *              A callback function triggered when an item is selected. The parameter is the selected data
     *          minimumInputLength {int}
     *              number of characters necessary search box to start a search (defaults to 1)
     *        }
     * @return {*} Returns the jquery widget (allows widget to be chainable).
     */
    $.fn.searchSelect = function (config) {
        return this.each(function () {
            var selector = this, i; // Matches is an array that contains all the data that matches the search text.

            if (!config.query && !config.data) {
                throw "The selector widget did not recieve any data.";
            }
            if (!config.minimumInputLength) {
                config.minimumInputLength = 1;
            }
            if (!config.format) {
                config.format = function (data) {
                    return data.toString();
                };
            }

//          Model for selectorWidget elements.
//          <div class="selectSearch" style=" ">
//              <input id="selectSearchTextBox" type="text" />
//              <ul class="optionList">
//                  <!--options are generated here-->
//              </ul>
//          </div>
            selector.appendChild(document.createElement("div"));
            selector.children[0].appendChild(document.createElement("input"));
            selector.children[0].children[0].setAttribute("type", "text");
            selector.children[0].children[0].setAttribute("id", "selectSearchTextBox");
            selector.children[0].appendChild(document.createElement("span"));
            selector.children[0].children[1].setAttribute("class", "addItemIcon");
            selector.appendChild(document.createElement("ul"));
            selector.children[1].setAttribute("class", "optionList");

            // Listen to input in search box and update the widget accordingly.
            generalTools.observeInput($(selector).find("input"), function (searchText) {
                //get the list of location matches
                if (searchText.length >= config.minimumInputLength) {
                    var matches = [];
                    if (config.query) {
                        var data = config.query({searchTerm: searchText, render: selector._updateOptionList});
                    } else {
                        var dataItem;
                        for (i = 0; i < config.data.length; i++) {
                            dataItem = config.data[i];
                            if (config.format(dataItem).indexOf(searchText) !== -1) {
                                matches.push(dataItem);
                            }
                        }
                        selector._updateOptionList(matches);
                    }
                } else {
                    selector._clearList();
                }
            }, config.query ? 0 : 1);

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
                    $('<li id="' + i + '"><span class="selectSearchOptionIcon"></span><span class="name">' + config.format(options[i]) + '</span></li>').data("selectedData", options[i]).appendTo(optionList);
                }

                //add the current selected item to the list, if there is one
                if (selector.selectedItem) {
                    $('<li id="previous"><span id="selectedItem"></span><span class="name">' + selector.selectedItem + '</span></li>').appendTo(optionList);
                }

                //adjust the text to make sure everything is vertically centered
                $(selector).find(".optionList li").each(function () {
                    if ($(this)[0].childNodes[1].clientHeight < 25) {
                        $(this).addClass("singleLine");
                    } else if ($(this)[0].childNodes[1].clientHeight > 50) {
                        $(this).addClass("tripleLine");
                    }
                });
            };

            $(selector).find(".optionList li").live("click", function (e) {
                //TODO: match the selected item to an item in the data object
                selector.selectedData = $(e.currentTarget).data().selectedData;

                config.onSelect(selector.selectedData);
            });
            //Add new item to list and automatically select it.
            $(".addItemIcon").live("click", function () {
                var newItem = {};
                newItem[config.dataTextField] =  $("#selectSearchTextBox")[0].value;
                selector.selectedItem = newItem[config.dataTextField];
                config.onSelect(selector.selectedItem);
                config.data[config.data.length] = newItem;
                $('<li id="manual"><span id="customItem"></span><span class="name">' + newItem[config.dataTextField] + '</span></li>').prependTo($(selector).find(".optionList"));
            });
        });
    };
});