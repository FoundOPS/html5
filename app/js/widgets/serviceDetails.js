'use strict';
define(["jquery", "db/services", "db/session", "lib/kendo.all", "lib/jquery.maskMoney", "lib/jquery.autosize", "lib/select2"], function ($, dbServices, session) {

    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DATABINDING = "dataBinding",
        DATABOUND = "dataBound",
        inputTemplate = "<input />",
        multiLineTextTemplate = "<textarea class='textarea'></textarea>";

    var ServiceDetails = Widget.extend({
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
                fieldElement = $(multiLineTextTemplate).autosize();
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
            var fieldElement = $(inputTemplate).attr("type", "number");

            var step = 1 / Math.pow(10, field.DecimalPlaces);
            fieldElement.attr("step", step).attr("min", field.Minimum).attr("max", field.Maximum)
                .appendTo(listView).wrap("<li>" + field.Name + "</li>");

            //TODO: improve using http://stackoverflow.com/questions/7933505/mask-input-for-number-percent
            if (field.Mask === "c") {
                $("<span> $</span>").insertBefore(fieldElement);
            } else if (field.Mask === "p") {
                //percentage
                //TODO: improve using http://stackoverflow.com/questions/7933505/mask-input-for-number-percent
                $("<span>%</span>").insertAfter(fieldElement);
            }

            return fieldElement;
        },

        _createDateTimeField: function (field, fieldIndex, listView) {
            var fieldElement = $(inputTemplate).appendTo(listView).wrap("<li>" + field.Name + "</li>");

            //console.log(field);

            var options = {
                change: function (e) {
                    //manually handle change event so the format is correct
                    var newValue = e.sender.value();
                    if (newValue) {
                        e.sender.fieldParent.set("Value", newValue);
                    }
                },
                min: field.Earliest,
                max: field.Latest
            };

            var picker;

            if (field.TypeInt === 0) {
                //DateTime
                options.value = moment(field.Value).format("LLL");
                picker = fieldElement.kendoDateTimePicker(options).data("kendoDateTimePicker");
            } else if (field.TypeInt === 1) {
                //TimeOnly
                options.value = moment(field.Value).format("LT");
                picker = fieldElement.kendoTimePicker(options).data("kendoTimePicker");
            } else if (field.TypeInt === 2) {
                //DateOnly
                options.value = moment(field.Value).format("LL");
                picker = fieldElement.kendoDatePicker(options).data("kendoDatePicker");
            }
            //store a reference to the field for access by the change function
            picker.fieldParent = field;

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
                        for (var i = 0; i < field.Options.length; i++) {
                            field.Options[i].IsChecked = false;
                        }
                        if (index >= 0) {
                            //check this item
                            field.set('Options[' + index + '].IsChecked', true);
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
                    return dataItem.get("IsChecked");
                });
            } else {
                //Checkbox (1) or checklist (2)
                fieldElement = $('<ul data-role="listview" data-style="inset">' + field.Name + '</ul>').appendTo(elementToAppendTo);

                for (var optionIndex = 0; optionIndex < field.Options.length; optionIndex++) {
                    var optionElement = $(inputTemplate).attr("type", "checkbox");

                    var option = field.Options[optionIndex];

                    //store a reference to the option for access by the change function
                    optionElement[0].optionParent = option;

                    //manually bind to avoid issues
                    if (option.IsChecked) {
                        optionElement.attr("checked", "checked");
                    }
                    optionElement.change(function () {
                        var checked = !$(this).is(':checked');
                        $(this)[0].optionParent.set("IsChecked", checked);
                    });

                    optionElement.appendTo(fieldElement).wrap("<li><label>" + option.Name + "</label></li>");
                }
            }

            return fieldElement;
        },

        render: function (service) {
            var that = this;

            that.trigger(DATABINDING);

            that.element.empty();

            if (!service) {
                return;
            }

            if (!that.options.clientReadonly) {
                var format = function (client) {
                    return client.Name;
                };

                //Add the Client auto-complete
                var clientAutoComplete = $(inputTemplate).attr("type", "hidden").attr("style", "width: 90%").appendTo(that.element).wrap("<label>Client</label>");
                clientAutoComplete.select2({
                    placeholder: "Choose a client",
                    minimumInputLength: 1,
                    ajax: {
                        url: dbServices.API_URL + "Clients/Get?roleId=" + session.get("role.id"),
                        dataType: 'jsonp',
                        quietMillis: 100,
                        data: function (term, page) { // page is the one-based page number tracked by Select2
                            return {
                                search: term,
                                skip: (page - 1) * 10,
                                take: 10 // page size
                            };
                        },
                        results: function (data, page) {
                            // whether or not there are more results available
                            var more = data.length > 9;
                            return {results: data, more: more};
                        }
                    },
                    id: function (client) {
                        return client.Id;
                    },
                    formatSelection: format,
                    formatResult: format,
                    dropdownCssClass: "bigdrop"
                }).on("change", function (e) {
                        var clientId = e.val;
                        service.set("ClientId", clientId);

                        //todo clear/disable locations comboxbox
                        //load the client's locations
                        //select first automatically
                    });
            }
            //set the initial selection
            clientAutoComplete.select2("data", service.Client);

            //Add the Location auto-complete //address line one & 2
//            var locationAutoComplete = $(inputTemplate).appendTo(that.element).wrap("<li><label>Location</label></li>");

            //Add all the fields
            var fieldCreationFunctions = {
                "TextBoxField": that._createTextBoxField,
                "NumericField": that._createNumericField,
                "DateTimeField": that._createDateTimeField,
                "OptionsField": that._createOptionsField
            };

            var fieldsListView = $('<ul></ul>').appendTo(that.element);
            var checkLists = $('<div></div>').appendTo(that.element);

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

                    if (field.Type !== "OptionsField" && field.Type !== "DateTimeField") {
                        //setup the value binding
                        var dataBindAttr = "value: Fields[" + fieldIndex + "].Value";
                        fieldElement.attr("data-bind", dataBindAttr);
                    }
                }
            }

            kendo.bind(fieldsListView, service, kendo.mobile.ui);
            kendo.bind(checkLists, service, kendo.mobile.ui);

            that.trigger(DATABOUND);
        },
        options: new kendo.data.ObservableObject({
            name: "ServiceDetails",
            clientReadonly: false
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