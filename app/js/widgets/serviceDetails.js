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

        _createTextBoxField: function (field, fieldIndex, listView) {
            var fieldElement;
            if (field.IsMultiLine) {
                fieldElement = $(multiLineTextTemplate);
            }
            else {
                fieldElement = $(inputTemplate);
                fieldElement.attr("type", "text");
            }
            fieldElement.appendTo(listView).wrap("<li></li>");
            return fieldElement;
        },

        _createNumericField: function (field, fieldIndex, listView) {
            var fieldElement = $(inputTemplate).attr("type", "number");
            var step = 1 / Math.pow(10, field.DecimalPlaces);
            fieldElement.attr("step", step);
            fieldElement.attr("min", field.Minimum);
            fieldElement.attr("max", field.Maximum);
            fieldElement.appendTo(listView).wrap("<li></li>");
            return fieldElement;
        },

        _createDateTimeField: function (field, fieldIndex, listView) {
            var fieldElement = $(inputTemplate).appendTo(listView).wrap("<li></li>");
            if (field.TypeInt === 0) {
                //DateTime
                field.Value = moment(field.Value).format("LLL");
                fieldElement.kendoDateTimePicker();
            } else if (field.TypeInt === 1) {
                //TimeOnly
                field.Value = moment(field.Value).format("LT");
                fieldElement.kendoTimePicker();
            } else if (field.TypeInt === 2) {
                //DateOnly
                field.Value = moment(field.Value).format("LL");
                fieldElement.kendoDatePicker();
            }

            return fieldElement;
        },

        _createOptionsField: function (field, fieldIndex, listView) {
            var fieldElement;
            if (field.TypeInt === 0) {
                //ComboBox
                fieldElement = $(inputTemplate).appendTo(listView).wrap("<li></li>");
                fieldElement.kendoComboBox({
                    change: function (e) {
                        var index = this.selectedIndex;
                        var field = this.fieldParent;
                        //clear the other checked items
                        for (var i = 0; i < field.Options.count; i++) {
                            field.Options[i].IsChecked = false;
                        }
                        if (index >= 0) {
                            //check this item
                            field.Options[index].IsChecked = true;
                        }
                    },
                    dataTextField: "Name",
                    dataValueField: "Id",
                    dataSource: field.Options,
                    filter: "contains",
                    suggest: true
                });
                var comboBox = fieldElement.data("kendoComboBox");
                //store a reference to the field for access by the change function
                comboBox.fieldParent = field;

                //select the first checked option
                comboBox.select(function (dataItem) {
                    return dataItem.IsChecked;
                });
            } else {
                //Checkbox (1) or checklist (2)
                fieldElement = $("<ul data-role='listview' data-style='inset'></ul>").appendTo(listView);

                for (var optionIndex = 0; optionIndex < field.Options.length; optionIndex++) {
                    var optionElement = $(inputTemplate).attr("type", "checkbox");

                    var dataBindAttr = "checked: Fields[" + fieldIndex + "].Options[" + optionIndex + "].IsChecked";
                    optionElement.attr("data-bind", dataBindAttr);

                    var option = field.Options[optionIndex];

                    optionElement.appendTo(fieldElement).wrap("<li>" + option.Name + "</li>");
                }
            }

            return fieldElement;
        },

        render: function (service) {
            var that = this;

            that.trigger(DATABINDING);

            that.element.empty();

            var fieldCreationFunctions = {
                "TextBoxField": that._createTextBoxField,
                "NumericField": that._createNumericField,
                "DateTimeField": that._createDateTimeField,
                "OptionsField": that._createOptionsField
            };

            var fieldsListView = $("<ul data-role='listview' data-style='inset'></ul>").appendTo(that.element).wrap("<form></form>");

            if (service) {
                for (var fieldIndex = 0; fieldIndex < service.Fields.length; fieldIndex++) {
                    var field = service.Fields[fieldIndex];
                    var fieldElement = fieldCreationFunctions[field.Type](field, fieldIndex, fieldsListView);

                    if (fieldElement) {
                        //setup the tooltip
                        if (field.ToolTip) {
                            fieldElement.attr("text", field.ToolTip);
                        }

                        if (field.Type !== "OptionsField") {
                            //setup the value binding
                            var dataBindAttr = "value: Fields[" + fieldIndex + "].Value";
                            fieldElement.attr("data-bind", dataBindAttr);
                        }
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
})
;