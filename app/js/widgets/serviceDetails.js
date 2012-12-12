'use strict';
define(["jquery", "db/services", "db/session", "db/models", "widgets/selectBox", "select2", "kendo", "jmaskmoney", "jautosize", "jtooltip"], function ($, dbServices, session, models) {

    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DATABINDING = "dataBinding",
        DATABOUND = "dataBound",
        inputTemplate = "<input />",
        multiLineTextTemplate = "<textarea class='textarea' style='padding: 5px 0 5px 0;'></textarea>";

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

        /**
         * Add the client and location selectors
         * @param service
         * @private
         */
        _createClientLocation: function (service) {
            var that = this, clientSelector, locationSelector, locationSelected;

            var formatClientName = function (client) {
                return client.Name;
            };

            //updates the location's comboBox to the current client's locations
            var updateLocations = function (client) {
                //clear & disable the locations combobox
                if (locationSelector) {
                    locationSelector.select2("data", {AddressLineOne: "", AddressLineTwo: ""});
                    locationSelector.select2("disable");
                }

                if (client) {
                    //load the client's locations
                    dbServices.locations.read({params: {clientId: client.Id}}).done(function (locations) {
                        that._locations = locations;

                        // select the selected destination
                        var destinationField = models.getDestinationField(service);
                        if (locations.length > 0) {
                            var destination = models.firstFromId(locations, destinationField.LocationId);
                            if (destination) {
                                locationSelector.select2("data", destination);

                                //trigger location selected because it does not happen by default
                                locationSelected();
                            } else {
                                //set the destination to the first location
                                //in serviceDetails
                                locationSelector.select2("data", locations[0]);

                                //trigger location selected because it does not happen by default
                                locationSelected();
                            }

                            locationSelector.select2("enable");
                        }
                    });
                }
            };

            //Add the Client selector w auto-complete and infinite scrolling
            clientSelector = $(inputTemplate).attr("type", "hidden")
                //For validation message
                .attr("name", "Client").attr("required", "required")
                .appendTo(that.element).wrap("<h1>Client</h1>");
            clientSelector.select2({
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
                formatSelection: formatClientName,
                formatResult: formatClientName,
                dropdownCssClass: "bigdrop"
            }).on("change", function () {
                    var client = clientSelector.select2("data");
                    service.set("Client", client);
                    service.set("ClientId", client.Id);
                    updateLocations(client);
                });

            if (service.Client) {
                //set the initial selection
                clientSelector.select2("data", service.Client);
                updateLocations(service.Client);
            }

            //Add the Location selector
            var formatLocationName = function (location) {
                return location.AddressLineOne + " " + location.AddressLineTwo;
            };

            locationSelected = function () {
                var location = locationSelector.select2("data");
                var destinationField = models.getDestinationField(service);
                //Used for updating the grid
                destinationField.Value = location;
                destinationField.set("LocationId", location.Id);
            };

            locationSelector = $(inputTemplate).attr("type", "hidden")
                //For validation message
                .attr("name", "Location").attr("required", "required")
                .appendTo(that.element).wrap("<h1>Location</h1>");
            locationSelector.select2({
                placeholder: "Choose a location",
                id: function (location) {
                    return location.Id;
                },
                query: function (query) {
                    if (!that._locations) {
                        that._locations = [];
                    }
                    var data = {results: that._locations};
                    query.callback(data);
                },
                formatSelection: formatLocationName,
                formatResult: formatLocationName,
                dropdownCssClass: "bigdrop"
            }).on("change", locationSelected);
        },

        //region Field Factories

        _fieldFactories: {
            "TextBoxField": function (field, fieldIndex, listView) {
                var fieldElement;
                if (field.IsMultiLine) {
                    fieldElement = $(multiLineTextTemplate);
                    fieldElement.appendTo(listView).wrap("<li class='textarea'>" + field.Name + "</li>");
                } else {
                    fieldElement = $(inputTemplate).attr("type", "text");
                    fieldElement.appendTo(listView).wrap("<li>" + field.Name + "</li>");
                }

                return fieldElement;
            },
            "NumericField": function (field, fieldIndex, listView) {
                var fieldElement = $(inputTemplate).attr("type", "number");

                var step = 1 / Math.pow(10, field.DecimalPlaces);
                fieldElement.appendTo(listView).wrap("<li>" + field.Name + "</li>");

                var format = "#";

                var min = field.Minimum;
                var max = field.Maximum;

                var initialValue = field.Value;

                if (field.Mask === "c") {
                    format = "c";
                } else if (field.Mask === "p") {
                    //percentage
                    format = "# \\%";
                    step = step * 100;
                    min = min * 100;
                    max = max * 100;
                    initialValue = initialValue * 100;
                }

                fieldElement.kendoNumericTextBox({
                    step: step,
                    min: min,
                    max: max,
                    format: format,
                    value: initialValue,
                    spinners: false,
                    change: function (e) {
                        var newValue = e.sender.value();
                        var field = this.fieldParent;

                        if (field.Mask === "p") {
                            field.set("Value", newValue / 100);
                        } else {
                            field.set("Value", newValue);
                        }
                    }
                });

                //store a reference to the field for access by the change function
                fieldElement.data("kendoNumericTextBox").fieldParent = field;

                return fieldElement;
            },
            "OptionsField": function (field, fieldIndex, elementToAppendTo) {
                var fieldElement, i;
                if (field.TypeInt === 0) {
                    //Select Dropdown
                    fieldElement = $('<div class="styled-select"></div>').selectBox({
                        data: field.Options,
                        dataTextField: "Name",
                        dataSelectedField: "IsChecked",
                        onSelect: function (selectedOption) {
                            //Clear previous selections.
                            for (i = 0; i < field.Options.length; i++) {
                                field.Options[i].IsChecked = false;
                            }
                            field.set('Options[' + selectedOption.index + '].IsChecked', selectedOption.selected);
                        }
                    }).appendTo(elementToAppendTo).wrap("<li><label>" + field.Name + "<br/></label></li>");
                } else {
                    //Checkbox (1) or checklist (2)
                    fieldElement = $('<ul data-role="listview" data-style="inset">' + field.Name + '</ul>').appendTo(elementToAppendTo);

                    var optionIndex;
                    for (optionIndex = 0; optionIndex < field.Options.length; optionIndex++) {
                        var optionElement = $(inputTemplate).attr("type", "checkbox");

                        var option = field.Options[optionIndex];

                        //store a reference to the option for access by the change function
                        optionElement[0].optionParent = option;

                        //manually bind to avoid issues
                        if (option.IsChecked) {
                            optionElement.attr("checked", "checked");
                        }
                        optionElement.change(function () {
                            var checked = $(this).is(':checked');
                            $(this)[0].optionParent.set("IsChecked", checked);
                        });

                        optionElement.appendTo(fieldElement).wrap("<li><label>" + option.Name + "</label></li>");
                    }
                }

                return fieldElement;
            }
        },

        //endregion

        render: function (service) {
            var that = this;

            that.trigger(DATABINDING);

            that.element.empty();

            if (!service) {
                return;
            }

            if (!that.options.clientIsReadOnly) {
                that._createClientLocation(service);
            }

            //Add all the fields
            $('<h1 class="serviceFields">Service Fields</h1>').appendTo(that.element);
            var fieldsListView = $('<ul id="fields"></ul>').appendTo(that.element);
            var checkLists = $('<ul id="checkLists"></ul>').appendTo(that.element);

            var fieldIndex;
            for (fieldIndex = 0; fieldIndex < service.Fields.length; fieldIndex++) {
                var field = service.Fields[fieldIndex];

                //Location Destination is manually handled for now
                if (field.Type === "LocationField") {
                    continue;
                }

                //Checkbox (1) or checklist (2)
                var checkField = field.Type === "OptionsField" && (field.TypeInt === 1 || field.TypeInt === 2);

                var elementToAppendTo = checkField ? checkLists : fieldsListView;

                var factory = that._fieldFactories[field.Type];

                if (!factory) {
                    continue;
                }

                var fieldElement = factory(field, fieldIndex, elementToAppendTo);

                //setup the tooltip
                if (field.ToolTip) {
                    fieldElement.attr("title", field.ToolTip);
                    //use jquery tooltip plugin http://docs.jquery.com/Plugins/Tooltip
                    //this removes the title attribute and adds a custom tooltip
                    //important because having a title messes up the validation messages
                    fieldElement.tooltip({
                        left: -65
                    });
                }

                //add "required" to the element if it's required
                if (field.Required) {
                    fieldElement.attr("required", "required");
                }

                if (field.Name) {
                    var name = field.Name.replace(/\s/g, "");
                    name.toLowerCase();
                    fieldElement.attr("name", name);
                }

                //setup the value binding for TextBoxField
                //the others are handled manually
                if (field.Type === "TextBoxField") {
                    var dataBindAttr = "value: Fields[" + fieldIndex + "].Value";
                    fieldElement.attr("data-bind", dataBindAttr);
                }
            }

            kendo.bind(fieldsListView, service, kendo.mobile.ui);
            kendo.bind(checkLists, service, kendo.mobile.ui);

            that.trigger(DATABOUND);

            //wait until data is bound
            //then setup autosize to keep textarea the right size
            _.delay(function () {
                fieldsListView.find('textarea').autosize();
            }, 200);
        },
        options: new kendo.data.ObservableObject({
            name: "ServiceDetails",
            clientIsReadOnly: false
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