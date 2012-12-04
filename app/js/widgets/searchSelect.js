// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "underscore", "db/services", "ui/ui", "tools/generalTools", "kendo"], function ($, _, dbServices, fui, generalTools) {
    (function ($) {
        $.fn.searchSelect = function (options) {
            //Extend default options with those provided.
            var opts = $.extend({}, $.fn.searchSelect.defaults, options);
            return this.each(function () {
                var $this = $(this);

                //Plugin code goes here

            });
        };

        $.fn.searchSelect.renderOptionsList = function (options) {
//            var optionList = $(this.element).find(".optionList"), i;
//            //TODO: Clear list.
//            //add each returned item to the list
//            for (i = 0; i < options.length; i++) {
//                $('<li id="' + i + '"><span class="name">' + $.fn.searchSelect.defaults.format(options[i]) + '</div></li>').data("selectedData", options[i]).appendTo(optionList);
//            }
//
//            if (config.showPreviousSelection && selector.selectedData && config.data) {
//                $('<li id="' + i + '"><span id="previousSelection" class="name">' + config.format(selector.selectedData) + '</div></li>').data("selectedData", selector.selectedData).appendTo(optionList);
//            }
//            //adjust the text to make sure everything is vertically centered
//            $(selector).find(".optionList li").each(function () {
//                if ($(this)[0].childNodes[0].clientHeight < 25) {
//                    $(this).addClass("singleLine");
//                } else if ($(this)[0].childNodes[0].clientHeight > 50) {
//                    $(this).addClass("tripleLine");
//                }
//            });
        };

        $.fn.searchSelect.defaults = {
            formatOptions: function (data) {
                return JSON.stringify(data);
            }
        };

    })(jQuery);
});