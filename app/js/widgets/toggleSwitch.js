// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

    /**
     * Attaches a custom toggle switch to an element
     **/
    var toggleSwitch = {
        /**
         * Options for the widget that the user can set or override.
         **/
        options: {
            //Public options here
            leftText: "",
            rightText: "",
            //action to perform when left button is clicked on
            leftClick: function () {
            },
            //action to perform when right button is clicked on
            rightClick: function () {
            }
        },

        _create: function () {
            //Creates a reference to the widget.
            var toggleSwitch = this;

            var _toggle = $('<a class="on active" href="javascript:void(0)"><span>' + toggleSwitch.options.leftText + '</span></a>' +
                '<a class="off" href="javascript:void(0)"><span>' + toggleSwitch.options.rightText + '</span></a>');

            toggleSwitch.element.append(_toggle);

            //click event fo left button
            var on = toggleSwitch.element.find(".on");
            on.on("click", function () {
                off.removeClass("active");
                on.addClass("active");
                toggleSwitch.options.leftClick();
            });

            //click event fo right button
            var off = toggleSwitch.element.find(".off");
            off.on("click", function () {
                on.removeClass("active");
                off.addClass("active");
                toggleSwitch.options.rightClick();
            });
        }
    };

    //Use jQuery's widget factory to instantiate the widget.
    $.widget("ui.toggleSwitch", toggleSwitch);