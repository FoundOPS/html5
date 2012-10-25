(function ($) {
    'use strict';

    $.fn.selectBox = function (optionsArray, callback) {

            return this.each(function () {
                var selectBox = this, options = [], i;
                for (i = 0; i < optionsArray.length; i++) {
                    options[i] = "<option>" + optionsArray[i].name + "</option>\n";
                    if (optionsArray[i].selected === true) {
                        options[i] = "<option selected='selected'>" + optionsArray[i].name + "</option>\n";
                    }
                }
                $(".selectBox").live('change', function (e) {
                    var i, option, options = [], optionsHTML = e.srcElement.children;
                    for(i=0; i < optionsHTML.length; i++) {
                        option = optionsHTML[i];
                        options[i] = { name :option.text, index: option.index, selected: option.selected};
                    }
                    callback(options);
                });
                selectBox.innerHTML = '<select class="selectBox">' + options + '</select>';
            });
        }


})(jQuery);