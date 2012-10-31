'use strict';

define(['jquery', 'underscore'], function ($, _) {
    /**
     * A drop down list jquery widget.
     * @param optionsArray - [{name: string, data: object, selected: boolean}, ...]
     * @param onSelect A callback function that recieves the selected item.
     * @return {*} Returns the jquery widget (allows widget to be chainable).
     */
    $.fn.selectBox = function (optionsArray, onSelect) {
        return this.each(function () {
            var selectBox = this, options = [], i;

            //go through each option, and setup the select box
            for (i = 0; i < optionsArray.length; i++) {
                options[i] = document.createElement("option");
                options[i].setAttribute("data-data", optionsArray[i].data);
                options[i].innerHTML = optionsArray[i].name;
                if (optionsArray[i].selected === true) {
                    options[i].setAttribute("selected", "true");
                }
            }

            $(this).live('change', function (e) {
                var i, optionsHTML = e.srcElement.children;

                //call the onSelect function with the selected item
                for (i = 0; i < optionsHTML.length; i++) {
                    var option = optionsHTML[i];
                    option.data = optionsHTML[i].dataset.data;

                    if (option.selected) {
                        onSelect({index: option.index, name: option.text, data: option.data, selected: option.selected });
                        return;
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
