'use strict';
define(["jquery", "lib/kendo.all", "lib/jquery.maskMoney"], function ($) {

    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DATABINDING = "dataBinding",
        DATABOUND = "dataBound",
        inputTemplate = "<input />",
        multiLineTextTemplate = "<textarea class='textarea'></textarea>";

    var TaskStatuses = Widget.extend({
        init: function (element, options) {
            var that = this;

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
                fieldElement.appendTo(listView).wrap("<li>" + field.Name + "</li>");
            }
            else {
                fieldElement = $(inputTemplate);
                fieldElement.attr("type", "text");
                fieldElement.appendTo(listView).wrap("<li>" + field.Name + "</li>");

            }

            return fieldElement;
        },

        _createNumericField: function (field, fieldIndex, listView) {
            var fieldElement = $(inputTemplate);

            if (field.Mask === "g" || field.Mask === "p") {
                //number or percentage
                fieldElement.attr("type", "number");
            }
            fieldElement.appendTo(listView).wrap("<li>" + field.Name + "</li>");

            if (field.Mask === "c") {
                //currency


                var options = { showSymbol: true};
                if (field.Minimum <= 0) {
                    options.allowZero = true;
                    if (field.Minimum < 0) {
                        options.allowNegative = true;
                    }
                }
                options.precision = field.DecimalPlaces;
                fieldElement.maskMoney(options);
            } else if (field.Mask === "p") {
                //percentage
                //TODO: improve using http://stackoverflow.com/questions/7933505/mask-input-for-number-percent
                $("<span>%</span>").insertAfter(fieldElement);
            }

            var step = 1 / Math.pow(10, field.DecimalPlaces);
            fieldElement.attr("step", step);
            fieldElement.attr("min", field.Minimum);
            fieldElement.attr("max", field.Maximum);
            return fieldElement;
        },

        _createDateTimeField: function (field, fieldIndex, listView) {
            var fieldElement = $(inputTemplate).appendTo(listView).wrap("<li>" + field.Name + "</li>");

            //console.log(field);

            var options = {min: field.Earliest, max: field.Latest};
            if (field.TypeInt === 0) {
                //DateTime
                field.Value = moment(field.Value).format("LLL");
                fieldElement.kendoDateTimePicker(options);
            } else if (field.TypeInt === 1) {
                //TimeOnly
                field.Value = moment(field.Value).format("LT");
                fieldElement.kendoTimePicker(options);
            } else if (field.TypeInt === 2) {
                //DateOnly
                field.Value = moment(field.Value).format("LL");
                fieldElement.kendoDatePicker(options);
            }

            return fieldElement;
        },

        _createOptionsField: function (field, fieldIndex, elementToAppendTo) {
            var fieldElement;
            if (field.TypeInt === 0) {
                //ComboBox
                fieldElement = $(inputTemplate).appendTo(elementToAppendTo).wrap("<li><label>" + field.Name + "</label></li>");
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
                fieldElement = $('<ul data-role="listview" data-style="inset">' + field.Name + '</ul>').appendTo(elementToAppendTo);

                for (var optionIndex = 0; optionIndex < field.Options.length; optionIndex++) {
                    var optionElement = $(inputTemplate).attr("type", "checkbox");

                    var dataBindAttr = "checked: Fields[" + fieldIndex + "].Options[" + optionIndex + "].IsChecked";
                    optionElement.attr("data-bind", dataBindAttr);

                    var option = field.Options[optionIndex];

                    optionElement.appendTo(fieldElement).wrap("<li><label>" + option.Name + "</label></li>");
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


            var fieldsListView = $('<ul data-role="listview" data-style="inset"></ul>').appendTo(that.element).wrap("<form></form>");
            var checkLists = $('<div></div>').appendTo(that.element);

            if (service) {
                for (var fieldIndex = 0; fieldIndex < service.Fields.length; fieldIndex++) {
                    var field = service.Fields[fieldIndex];

                    //Checkbox (1) or checklist (2)
                    var checkField = field.Type === "OptionsField" && (field.TypeInt === 1 || field.TypeInt === 2);

                    var elementToAppendTo = checkField ? checkLists : fieldsListView;

                    var fieldElement = fieldCreationFunctions[field.Type](field, fieldIndex, elementToAppendTo);

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
            kendo.bind(checkLists, service, kendo.mobile.ui);

            that.trigger(DATABOUND);
        },
        options: new kendo.data.ObservableObject({
            name: "TaskStatuses"
        })
    });

    ui.plugin(TaskStatuses);

    kendo.data.binders.service = kendo.data.Binder.extend(({
        init: function (element, bindings, options) {
            kendo.data.Binder.fn.init.call(this, element, bindings, options);
        },

        refresh: function (e) {
            var service = this.bindings.service.get();
            var taskStatuses = $(this.element).data("kendoTaskStatuses");
            if (taskStatuses) {
                taskStatuses.render(service);
            }
        }
    }));
})
;