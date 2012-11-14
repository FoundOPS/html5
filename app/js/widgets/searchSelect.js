// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "underscore", "db/services", "ui/ui", "tools/generalTools", "kendo"], function ($, _, dbServices, fui, generalTools) {
    /**
     * A jquery widget that uses a textbox input to search for options in a list that is automatically generated from developer defined data.
     * @param config - {
     *          data: array
     *              Data that will be used to generate the list to select from.
     *          dataTextField: string,
     *              The key in data who's value will be displayed as an option.
     *          onSelect: {function(number, string, string, boolean)}
     *              A callback function that gets sent the selected option upon selection.
     *        }
     *        @return {*} Returns the jquery widget (allows widget to be chainable).
     */
    $.fn.searchSelect = function (config) {
        return this.each(function () {
            var searchSelect = this, i;

            if (!config.data) {
                throw "No data was passed to the selectSearch widget.";
            }

//          Model for selectSearchWidget elements.
//          <div class="selectSearch" style=" ">
//              <input id="selectSearchTextBox" type="text" />
//              <ul class="generatedList">
//                  <!--options are generated here-->
//              </ul>
//          </div>
            searchSelect.appendChild(document.createElement("div"));
            searchSelect.children[0].appendChild(document.createElement("input"));
            searchSelect.children[0].children[0].setAttribute("type", "text");
            searchSelect.children[0].children[0].setAttribute("id", "selectSearchTextBox")
            searchSelect.children[0].appendChild(document.createElement("span"));
            searchSelect.children[0].children[1].setAttribute("class", "addItemIcon");
            searchSelect.appendChild(document.createElement("ul"));
            searchSelect.children[1].setAttribute("class", "generatedList");

            //update search after 1 second of input edit
            generalTools.observeInput($(searchSelect).find("input"), function (text) {
                //get the list of location matches
                if (text) {
                    var matches = [], dataItemText;
                    for (i = 0; i < config.data.length; i++) {
                        //Use JSON stringify to ensure indexOf can be applied.
                        dataItemText = config.data[i][config.dataTextField];
                        if (dataItemText.indexOf(text) !== -1) {
                            matches.push(dataItemText);
                        }
                    }
                    searchSelect._updateGeneratedList(matches);
                } else {
                    searchSelect._clearList();
                }
            }, 0);

            searchSelect._clearList = function () {
                var generatedList = $(searchSelect).find(".generatedList");
                //Clear current list if there is one.
                while (generatedList[0].hasChildNodes()) {
                    generatedList[0].removeChild(generatedList[0].lastChild);
                }
            };

            //Populates and edits the list of items that the user can select.
            searchSelect._updateGeneratedList = function (options) {
                var generatedList = $(searchSelect).find(".generatedList");
                searchSelect._clearList();
                //add each returned item to the list
                for (i = 0; i < options.length; i++) {
                    $('<li id="' + i + '"><span class="selectSearchOptionIcon"></span><span class="name">' + options[i] + '</span></li>').appendTo(generatedList);
                }

                //add the current selected item to the list, if there is one
                if (searchSelect.selectedItem) {
                    $('<li id="previous"><span id="selectedItem"></span><span class="name">' + searchSelect.selectedItem + '</span></li>').appendTo(generatedList);
                }

                //TODO: add enter button to insert own custom item.
                searchSelect._updateGeneratedList.addItem = function (itemText) {

                }

                //adjust the text to make sure everything is vertically centered
                $(searchSelect).find(".generatedList li").each(function () {
                    if ($(this)[0].childNodes[1].clientHeight < 25) {
                        $(this).addClass("singleLine");
                    } else if ($(this)[0].childNodes[1].clientHeight > 50) {
                        $(this).addClass("tripleLine");
                    }
                });
            };

            $(searchSelect).find(".generatedList li").live("click", function (e) {
                //TODO: match the selected item to an item in the data object
                searchSelect.selectedItem = e.target.textContent;

                config.onSelect(searchSelect.selectedItem);
            });
            //Add new item to list and automatically select it.
            $(".addItemIcon").live("click", function () {
                var newItem = {};
                newItem[config.dataTextField] =  $("#selectSearchTextBox")[0].value;
                searchSelect.selectedItem = newItem[config.dataTextField];
                config.onSelect(searchSelect.selectedItem);
                config.data[config.data.length] = newItem;
                $('<li id="manual"><span id="customItem"></span><span class="name">' + newItem[config.dataTextField] + '</span></li>').prependTo($(searchSelect).find(".generatedList"));
            });

        });
    };
});