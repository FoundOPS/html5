'use strict';
define(["lib/text!widgets/serviceDetails.html", "jquery", "lib/kendo.all"], function (template, $) {
    // shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget;

    template = kendo.template(template);

    var ServiceDetails = Widget.extend({
        init: function (element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            for (var i in options.service.Fields) {
                var fieldElement = template(options.service.Fields[i]);
                that.element.append(fieldElement);
            }
        },
        options: new kendo.data.ObservableObject({
            name: "ServiceDetails"
        })
    });

    ui.plugin(ServiceDetails);
});