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
            var that = this, clientSelector, locationSelector;

            var formatClientName = function (client) {
                return client.Name;
            };

            //updates the location's comboBox to the current client's locations
            var updateLocations = function (client) {
                //clear & disable the locations comboxbox
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
                                //for updating the services grid
                                destinationField.Value = destination;
                            } else {
                                //set the destination to the first location
                                //in serviceDetails
                                locationSelector.select2("data", locations[0]);
                                //in grid
                                destinationField.Value = locations[0];
                            }

                            locationSelector.select2("enable");
                        }
                    });
                }
            };

            //Add the Client selector w auto-complete and infinite scrolling
            clientSelector = $(inputTemplate).attr("type", "hidden").attr("required", "required").appendTo(that.element).wrap("<label class='client'>Client</label>");
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
            locationSelector = $(inputTemplate).attr("type", "hidden").appendTo(that.element).wrap("<label class='location'>Location</label>");
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
            }).on("change", function () {
                    var location = locationSelector.select2("data");
                    var destinationField = models.getDestinationField(service);
                    //Used for updating the grid
                    destinationField.Value = location;
                    destinationField.set("LocationId", location.Id);
                });
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
                var fieldElement, options = [], i;
                if (field.TypeInt === 0) {
                    var save = function (selectedOption) {
                        //Clear previous selections.
                        for (i = 0; i < field.Options.length; i++) {
                            field.Options[i].IsChecked = false;
                        }
                        field.set('Options[' + selectedOption.index + '].IsChecked', selectedOption.selected);
                    };

                    //Select Dropdown
                    fieldElement = $('<div class="styled-select"></div>')
                        .selectBox({data: field.Options, dataTextField: "Name", dataSelectedField: "IsChecked", onSelect: save})
                        .appendTo(elementToAppendTo)
                        .wrap("<li><label>" + field.Name + "<br/></label></li>");

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
            },
            "SignatureField": function (field, fieldIndex, elementToAppendTo) {
                $('<div class="sigWrapper">' +
                    '<a class="sigButton" id="sigCancel" onclick="routeTask.vm.closeSigPad()">Cancel</a>' +
                    '<a class="sigButton" id="sigClear" onclick="$(\'.sigPad\').jSignature(\'reset\');">Clear</a>' +
                    '<a class="sigButton" id="sigSave" onclick="routeTask.vm.saveSig()">Save</a>' +
                    '<div class="sigPad"></div>' +
                '</div>').appendTo(document.body);

                $(".sigPad").jSignature({width: "100%", height: "auto", sizeRatio: 2});
                var fieldElement = $('<ul data-role="listview" data-style="inset">'
                                        + field.Name +
                                        '<li>' +
                                            '<a onclick="routeTask.vm.openSigPad()">' +
                                                // src is temporary until API functionality is completely set up.
                                                '<img  style="width: 100%" id="signature" src="data:image/png;base64,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9Yejn+rDPeQ4fxGVD6uuuq2Ihj+OWlw44Gvx+dwuHczEd/0ecP2W+P1tFQb2NrQKSJoQIECAAAECBAgQIECAAAEC9Qu0JSya70qaVXHqr4vK19bnm8eK29mx88ioZ0V1O5+8qqj4/a7YP25AyvKb0B6K4/84KkOj4jYTO3WERd36actaDUinOQECBAgQIECAAAECBAgQIHA4CbQlgKgjHDk24C+IyreU5d9+5/b38XuOWXUrvw1t7rgMufIB2Ftmv/jn+Pv6Pp1+OX57XoVB6/CoMIwmBAgQIECAAAECBAgQIECAAIGDBRZSWFQ8swyO/iPqJX0W/Dnx2zcr/kNcF+3OmW1bvlIpv/5h1E1RF0YdVejz/+Nz8fa1YcOivJKp2E/FaWtGgAABAgQIECBAgAABAgQIEBhMYKGGRXMKT4sP+Tazp3Zh+VV899iKXBk8vaZi27lmn40PedvceaXj8vlL/ztPX9+O359ZaPMv8bnfFUsDTk1zAgQIECBAgAABAgQIECBAgEB3gVrCorPOOmv9gQMHMpgZatu6des5u3btOrd48Jlnnpm3itWybdy48dIHH3xwebmzNWvW/NvRRx/96yqDbN68+SW7d+9+SpW2Rx555C/Wrl17xU033XTx3r178wHdv9uWLFlyx6pVq/572bJl93br6/bbbz9px44dF839tnjx4v9bt27dv1YZVxsCBAgQIECAAAECBAgQIEBgegUWLVq0+frrr79mVIGRw6LZoOjqUSayc+fOTlZxi7BolC4POnbPnj2dTZs2HdLfKaec0lm+/JAMqee42U8EW50IgHq2ifCpEyHUw79v27atc+eddx7SNoKizurVqztHHVW8Y63T2bdvX+fGG2/sPPRQ3nX22+3000/vLF26tDYLHREgQIAAAQIECBAgQIAAAQILVyACow2jBkZTERblv8CWLVs6d91110H/DRkUZWA06LZ9+/bOfffd13nggQceDnjmtmOOOaZz6qmn/m7/1ltv7dx2221du88A6IQTTugcccQRD/++f//+TlxRdFBQdPzxx3dOPvnkQaenPQECBAgQIECAAAECBAgQIDClAq0Ii9K+7beh5Rzvvvvu426++ebXFv9XAnD/GWec8fZR/n+y3wiEnhmhz+6VK1d+vdzXDTfccEmESvmcooG2CJN+FlcVfWiggzQmQIAAAQIECBAgQIAAAQIEplagNbeh1bQCM9HPWwt95eU4T6qp72I3P4+dcnDz1/HdvzcwVrHL98XOpQOMsSXarhqgvaYECBAgQIAAAQIECBAgQIAAgVoERr4NrZZZdDrFsCiDkj+PyjeC1b19Mzp8dqnTu2P/pKh7ojZEjfT8pT4TrhoY5RyfU/eJ648AAQIECBAgQIAAAQIECBAgUEWgLWHR+kJIk4HNyE/u7nHyH4zvXzX7Wz5F+g9mP18Zf/Np0/kWsquiLq6CN0SbL8Qxf9LnuGvjt/OH6NchBAgQIECAAAECBAgQIECAAIFaBNoSFuXJZGCUW1NB0RxYt1vRyphNurwtBjsxanth0HzK9i1Rb65lVXVCgAABAgQIECBAgAABAgQIEBhSoMlQZMgpNX7YOTHCV6P6nfs0ujQObwACBAgQIECAAAECBAgQIECg/QLTGop8MpbmRX2WZ1pd2v8fa4YECBAgQIAAAQIECBAgQIBAowLTGoqsCNUfRC3roTutLo3+s+mcAAECBAgQIECAAAECBAgQaL/ANIcin47leaGwqP3/pGZIgAABAgQIECBAgAABAgQIjE9gmsOiVN4RdVKJO9+Stnh8S2AkAgQIECBAgAABAgQIECBAgEB7BKY9LDotlmJT1JzD/fE530h2eXuWyEwIECBAgAABAgQIECBAgAABAuMT+A2hzgZb0p8pvAAAAABJRU5ErkJggg== "/>' +
                                            '</a>' +
                                        '</li>' +
                                    '</ul>').appendTo(elementToAppendTo);

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
            var fieldsListView = $('<ul id="fields"></ul>').appendTo(that.element);
            var checkLists = $('<ul id="checkLists"></ul>').appendTo(that.element);
            var sigListView = $('<ul id="sigListView"></ul>').appendTo(that.element);

            var fieldIndex;
            for (fieldIndex = 0; fieldIndex < service.Fields.length; fieldIndex++) {
                var field = service.Fields[fieldIndex];

                //Location Destination is manually handled for now
                if (field.Type === "LocationField") {
                    continue;
                }

                //Checkbox (1) or checklist (2)
                var checkField = field.Type === "OptionsField" && (field.TypeInt === 1 || field.TypeInt === 2);

                var elementToAppendTo;
                if(checkField) {
                    elementToAppendTo= checkLists;
                } else if(field.Type === "SignatureField") {
                    elementToAppendTo = sigListView;
                } else {
                    elementToAppendTo = fieldsListView;
                };

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