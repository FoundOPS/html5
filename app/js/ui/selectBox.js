(function ($) {
    'use strict';
    $.fn.extend({

        selectBox: function (optionArray) {

            var options = {
                options: null
            }

            return this.each(function () {
                var obj = $(this);

                var items = 
            });
        }

//        fieldElement = $('<select id="select" ></select>').appendTo(elementToAppendTo).wrap("<li><label>" + field.Name + "<br/></label></li>");
//
//        for (i = 0; i < field.Options.length; i++) {
//            options[i] = "<option>" + field.Options[i].Name + "</option>\n";
//            if (field.Options[i].IsChecked === true) {
//                options[i] = "<option selected='selected'>" + field.Options[i].Name + "</option>\n";
//            }
//        }
//
//        fieldElement[0].innerHTML = options;
//
//        $("#select").change(function (e) {
//            for (i = 0; i < field.Options.length; i++) {
//                field.Options[i].IsChecked = false;
//            }
//            field.set('Options[' + e.target.selectedIndex + '].IsChecked', true);
//        });

    });
})(jQuery);