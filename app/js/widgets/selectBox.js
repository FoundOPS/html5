'use strict';

define(['jquery', 'underscore'], function ($, _) {
    /**
     * A drop down list jquery widget.
     * @param optionsArray - [{name: string, selected: boolean}, ...]
     * @param onSelect A callback function that recieves the selected item.
     * @return {*} Returns the jquery widget (allows widget to be chainable).
     */
    $.fn.selectBox = function (optionsArray, onSelect) {
        return this.each(function () {
            var selectBox = this, options = [], i;

            //go through each option, and setup the select box
            for (i = 0; i < optionsArray.length; i++) {
                options[i] = "<option>" + optionsArray[i].name + "</option>\n";
                if (optionsArray[i].selected === true) {
                    options[i] = "<option selected='selected'>" + optionsArray[i].name + "</option>\n";
                }
            }

            $(".selectBox").live('change', function (e) {
                var i, optionsHTML = e.srcElement.children;

                //call the onSelect function with the selected item
                for (i = 0; i < optionsHTML.length; i++) {
                    var option = optionsHTML[i];

                    if (option.selected) {
                        onSelect({ name: option.text, index: option.index, selected: option.selected });
                        return;
                    }
                }
            });

            //setup this element's html
            selectBox.innerHTML = '<select class="selectBox">' + options + '</select>';
        });
    }
});
