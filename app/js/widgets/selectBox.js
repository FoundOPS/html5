'use strict';

define(['jquery', 'underscore'], function ($, _) {
    /**
     * A dynamic drop down list jquery widget that uses a <select> element for mobile compatibility.
     * @param config - {
     *          data: array,
     *              Unformatted data for use in selectBox, if non-existent will use config.options.
     *          dataTextField: string,
     *              The key in data who's value will be displayed as an option.
     *          dataSelectedIdentifier: string,
     *              The key in data who's value determines the selected status of an option.
     *          options: [{name: string, value: string, selected: boolean}, ...],
     *              Preformatted data for use in the selectBox.
     *          onSelect: {function(number, string, string, boolean)}
     *              A callback function that gets sent the selected option upon selection.
     *        }
     * @return {*} Returns the jquery widget (allows widget to be chainable).
     */
    $.fn.selectBox = function (config) {
        return this.each(function () {
            var i, textField = config.dataTextField, optionsArray = [];
            if (config.data) {
                for (i=0; i<config.data.length; i++) {
                    optionsArray[i] = {
                        name: config.data[i][textField],
                        value: _.values(_.omit(config.data[i], textField, config.dataSelectedIdentifier)),
                        selected: config.data[i][config.dataSelectedIdentifier]
                    };
                }
            } else if (config.options) {
                optionsArray = config.options;
            }

            var selectBox = this, options = [], i;

            //go through each option, and setup the select box
            for (i = 0; i < optionsArray.length; i++) {
                options[i] = document.createElement("option");
                options[i].setAttribute("data-value", optionsArray[i].value);
                options[i].innerHTML = optionsArray[i].name;
                if (optionsArray[i].selected === true) {
                    options[i].setAttribute("selected", "true");
                }
            }

            $(this).live('change', function (e) {
                var i, optionsHTML = e.target.children;

                //call the onSelect function with the selected item
                for (i = 0; i < optionsHTML.length; i++) {
                    var option = optionsHTML[i];
                    option.value = optionsHTML[i].dataset.value;

                    if (option.selected) {
                        config.onSelect({index: option.index, name: option.text, value: option.value, selected: option.selected });
                    }
                }
            });

            //setup this element's html
            var sel = document.createElement("select");
            sel.setAttribute("class", "selectBox");
            for (i = 0; i < options.length; i++) {
                sel.appendChild(options[i]);
            }
            selectBox.appendChild(sel);
        });
    };
});
