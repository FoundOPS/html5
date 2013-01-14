'use strict';
$.widget("ui.selectBox", {
    options: {
        //Array.<Object> Array of data for use in selectBox. Need to pass this or options
        data: null,
        //{string} The key in data to display
        dataTextField: null,
        //(Optional) {string} The key in data to determine if the value is selected
        dataSelectedField: null,
        //Array.<{name: string, value: string, selected: boolean}> Pre-formatted data for use in the selectBox.
        options: null,
        //(Optional) {function(Object, number)} A callback function that gets sent the selected option and index upon selection
        onSelect: null,
        //(Optional) {function(Object, Object)} Used in the select function to compare items. If not underscores deep comparison will used
        isEqual: _.isEqual
    },

    _init: function () {
        var widget = this, element = $(widget.element), options = widget.options;

        var textField = options.dataTextField, selectOptions = [];
        //format data into select options
        if (options.options) {
            selectOptions = options.options;
        } else if (options.data) {
            for (var i = 0; i < options.data.length; i++) {
                var selected = false;
                if (options.dataSelectedField) {
                    selected = options.data[i][options.dataSelectedField];
                }

                selectOptions[i] = {
                    name: options.data[i][textField],
                    selected: selected
                };
            }
        }


        var selectBox = this, selectElements = [];

        //go through each option, and setup the select box
        for (var i = 0; i < selectOptions.length; i++) {
            selectElements[i] = document.createElement("option");
            selectElements[i].innerHTML = selectOptions[i].name;
            if (selectOptions[i].selected === true) {
                selectElements[i].setAttribute("selected", "true");
            }
        }

        //setup this element's html
        var selectBox = document.createElement("select");
        selectBox.setAttribute("class", "selectBox");
        for (var i = 0; i < selectElements.length; i++) {
            selectBox.appendChild(selectElements[i]);
        }
        element.append(selectBox);

        $(selectBox).live('change', function (e) {
            var selectOptions = e.target.children;

            //call the onSelect function with the selected item
            for (var i = 0; i < selectOptions.length; i++) {
                var selectOption = selectOptions[i];
                if (selectOption.selected) {
                    var item = options.data ? options.data[i] : options.options[i];
                    if (options.onSelect) {
                        options.onSelect(item, i);
                    }
                }
            }
        });
    },

    /**
     * Select the matching item
     * @param item
     */
    select: function (item) {
        var widget = this, isEqual = widget.options.isEqual, data = widget.options.data, optionsData = widget.options.options,
            selectOptions = $(this.element).find("select").children("*");

        for (var i = 0; i < data.length; i++) {
            if ((data && isEqual(data[i], item)) || (optionsData && isEqual(optionsData[i], item))) {
                selectOptions[i].selected = true;
                break;
            }
        }
    }
});