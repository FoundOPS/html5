(function ($) {
    'use strict';
    $.fn.extend({

        selectBox: function (optionsArray) {

            var options = [],
                methods = {
                    selected: function(options) {
                        for (var i= 0; i < options.length; i++) {
                            console.log("Index: \"" + options[i].index+'\"' + " Name: \"" + options[i].name+'\"' + " Value: \"" + options[i].value+'\"');
                        }
                    }
                };

            $.fn.selectBox = function(method) {
                // Method calling logic
                if ( methods[method] ) {
                    return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
                } else if ( typeof method === 'object' || ! method ) {
                    return methods.init.apply( this, arguments );
                } else {
                    $.error( 'Method ' +  method + ' does not exist on jQuery.selectBox' );
                }
            };

            return this.each(function () {
                var element = this;

                var i;
                for (i = 0; i < optionsArray.length; i++) {
                    options[i] = "<option>" + optionsArray[i].name + "</option>\n";
                    if (optionsArray[i].value === true) {
                        options[i] = "<option selected='selected'>" + optionsArray[i].name + "</option>\n";
                    }
                }
                element.innerHTML = '<select id="selectBox">' + options + '</select>';
            });
        }

    });
})(jQuery);