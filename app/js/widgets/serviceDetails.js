'use strict';
define(["text!widgets/serviceDetails.html", "jquery", "lib/kendo.all"], function (template, $) {
    // shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget;

    var ServiceDetails = Widget.extend({
        init: function (element, options) {
            var that = this, templateElement;

            Widget.fn.init.call(that, element, options);
            console.log(template);

//            templateElement = $(template);
//            that.element.append(templateElement);
        },
        options: new kendo.data.ObservableObject({
            name: "ServiceDetails"
        })
    });

    ui.plugin(ServiceDetails);
});