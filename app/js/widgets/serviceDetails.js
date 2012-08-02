'use strict';
define(["lib/text!widgets/serviceTemplate.html", "jquery", "lib/kendo.all"], function (serviceTemplate, $) {

    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DATABINDING = "dataBinding",
        DATABOUND = "dataBound",
        inputTemplate = "<input />",
        multiLineTextTemplate = "<textarea id='textarea'></textarea>";

    var ServiceDetails = Widget.extend({
        init: function (element, options) {
            var that = this;

            that.options.template = serviceTemplate;

            Widget.fn.init.call(that, element, options);
            that.render();
        },

        events: [
            DATABINDING,
            DATABOUND
        ],

        items: function () {
            return this.element.children();
        },

        render: function (service) {
            var that = this;

            that.trigger(DATABINDING);

            that.element.empty();

//            var fieldsListView = $("<ul data-role='listview' data-style='inset'></ul>").appendTo(that.element).wrap("<form></form>");
            var fieldsListView = $("<ul></ul>").appendTo(that.element).wrap("<form></form>");

            if (service) {
                for (var i = 0; i < service.Fields.length; i++) {
                    var field = service.Fields[i];
                    var fieldElement = null;
                    switch (field.Type) {
                        case "TextBoxField":
                            if (field.IsMultiLine) {
                                fieldElement = $(multiLineTextTemplate);
                            }
                            else {
                                fieldElement = $(inputTemplate);
                                fieldElement.attr("type", "text");
                            }
                            fieldElement.appendTo(fieldsListView).wrap("<li></li>");
                            break;
                        case "NumericField":
                            fieldElement = $(inputTemplate).attr("type", "number");
                            var step = 1 / Math.pow(10, field.DecimalPlaces);
                            fieldElement.attr("step", step);
                            fieldElement.attr("min", field.Minimum);
                            fieldElement.attr("max", field.Maximum);
                            fieldElement.appendTo(fieldsListView).wrap("<li></li>");
                            break;
                        case "DateTimeField":
                            fieldElement = $(inputTemplate).appendTo(fieldsListView).wrap("<li></li>");
                            if (field.TypeInt === 0) {
                                //DateTime
                                fieldElement.kendoDateTimePicker();
                            } else if (field.TypeInt === 1) {
                                //TimeOnly
                                fieldElement.kendoTimePicker();
                            } else if (field.TypeInt === 2) {
                                //DateOnly
                                fieldElement.kendoDatePicker();
                            }
                    }

                    if (fieldElement) {
                        //setup the tooltip
                        if (field.ToolTip) {
                            fieldElement.attr("text", field.ToolTip);
                        }

                        //setup the value binding
                        var dataBindAttr = "value: Fields[" + i + "].Value";
                        fieldElement.attr("data-bind", dataBindAttr);
                    }
                }
            }

            kendo.bind(fieldsListView, service, kendo.mobile.ui);

            that.trigger(DATABOUND);
        },
        options: new kendo.data.ObservableObject({
            name: "ServiceDetails"
        })
    });

    ui.plugin(ServiceDetails);

    kendo.data.binders.service = kendo.data.Binder.extend(({
        init: function (element, bindings, options) {
            kendo.data.Binder.fn.init.call(this, element, bindings, options);
        },

        refresh: function (e) {
            var service = this.bindings.service.get();
            var serviceDetails = $(this.element).data("kendoServiceDetails");
            if (serviceDetails) {
                serviceDetails.render(service);
            }
        }
    }));
});