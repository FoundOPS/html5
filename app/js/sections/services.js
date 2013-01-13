// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

require(["db/session", "db/services", "tools/parameters", "tools/dateTools", "db/saveHistory", "tools/kendoTools", "tools/analytics", "db/models", "widgets/serviceDetails",
    "widgets/selectBox", "widgets/servicesGrid"], function (session, dbServices, parameters, dateTools, saveHistory, kendoTools, analytics, models) {
    var services = {}, vm,
        servicesPage = $("#services"), clientSelector = $("#clientSelector"), locationSelector = $("#locationSelector"),
        servicesGrid;

    //region UI initialization

    //Location widget
    var setupLocationWidget = function (service) {
        //remove the location widget if it exists
        if (locationSelector.data("location")) {
            locationSelector.data("location").removeWidget();
        }

        var destinationField = models.getDestinationField(service);
        //initialize the location widget with the destination
        var destination = destinationField.Value ? destinationField.Value : {};

        var client = clientSelector.select2("data"), clientId;
        if (client) {
            clientId = client.Id;
        }

        locationSelector.location({
            data: [destination],
            clientId: clientId,
            change: function (location) {
                //update and save the destination field
                destinationField = models.getDestinationField(vm.get("selectedService"));
                destinationField.Value = location;
                var destinationField = models.getDestinationField(vm.get("selectedService"));
                dbServices.locationFields.update({
                    body: destinationField,
                    params: {serviceId: vm.get("selectedService.Id"), recurringServiceId: vm.get("selectedService.RecurringServiceId"), clientId: clientId, occurDate: vm.get("selectedService.ServiceDate")}
                }).done(function () {
                        destinationField.Value.IsNew = false;
                    });

                servicesGrid.invalidateSelectedService();
            }
        });

        setLocationView();
    };
    var setLocationView = function () {
        var location = $("#locationSelector").data("location");
        //determine what location widget view should be set
        if (location) {
            var width = servicesPage.find(".km-content").data("kendoSplitter").options.panes[1].size;

            //move the location list to the left of map if wide enough
            var rightWidth = parseInt(width.substring(0, width.length - 2));

            if (rightWidth > 557) {
                location.wideView(rightWidth);
            } else {
                location.narrowView();
            }
        }
    };

    //Client widget
    var clientChanged = function () {
        var client = clientSelector.select2("data");
        vm.get("selectedService").set("Client", client);
        vm.get("selectedService").set("ClientId", client.Id);

        //get the first location for this client
        dbServices.locations.read({params: {clientId: client.Id}}).done(function (locations) {
            if (locations.length > 0) {
                if (locations[0]) {
                    //update the location widget with this new location
                    locationSelector.data("location").options.data = [locations[0]];
                    locationSelector.data("location").showList();

                    //wait until the service has been saved then
                    saveHistory.save(true, function () {
                        //trigger change to save the destination
                        locationSelector.data("location").options.change(locations[0]);
                    });
                }
            }
        });
    };
    var setupClientWidget = function () {
        var formatClientName = function (client) {
            return client.Name;
        };

        //Add the Client selector w auto-complete and infinite scrolling
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
        }).on("change", clientChanged);
    };

    //Service types drop down
    var setupServiceSelector = function () {
        //load the current business account's service types
        dbServices.serviceTemplates.read().done(function (serviceTypes) {
            services.serviceTypes = serviceTypes;

            //Setup selectBox
            $("#serviceTypes").selectBox({
                data: serviceTypes,
                dataTextField: "Name",
                onSelect: function (selectedOption) {
                    vm.set("serviceType", selectedOption.data);
                }
            });

            //now that the service types are loaded,
            //setup the grid by re-parsing the hash
            parameters.parse();
        });
        $("#serviceDetails").kendoServiceDetails({signatureIsReadOnly: true});
    };

    //Grid

    //Used while setting up the grid
    var clearScreen = function () {
        //TODO call is loading

        //disable the add, delete and options buttons
        servicesPage.find(".k-grid-add,.k-grid-delete,.k-grid-edit.optionsMenu").attr("style", "display:none");

        //hide the service details
        $("#serviceSelectorsWrapper").attr("style", "display:none");
    };
    var setupGrid = function (serviceType, fields) {
        servicesGrid = $("#services").find("#grid").servicesGrid({
            serviceType: serviceType,
            serviceFields: fields,
            initialized: function () {
                //enable the options menu now that the grid is setup
                servicesPage.find(".k-grid-edit.optionsMenu").attr("style", "");

                resizeGrid();
            },
            serviceSelected: function (service) {
                vm.set("selectedService", service);

                saveHistory.close();
                saveHistory.resetHistory();

                resizeGrid();

                if (service) {
                    //show service details
                    $("#serviceSelectorsWrapper").attr("style", "display:block");

                    setupClientWidget(service);

                    if (service.Client) {
                        //set the initial selection
                        clientSelector.select2("data", service.Client);
                    }

                    setupLocationWidget(service);
                }
            },
            addEnabledChange: function (addIsEnabled) {
                servicesPage.find(".k-grid-add").attr("style", addIsEnabled
                    ? "display:inline-block" : "display:none");
            }
        }).data("servicesGrid");

        servicesGrid.kendoGrid.bind("columnShow", function () {
            var kendoGrid = servicesGrid.kendoGrid;
            //get the width of the table
            var maxWidth = kendoGrid.table[0].clientWidth + 59;
            //change the max width of the left splitter pane
            servicesPage.find(".km-content").data("kendoSplitter").max("#left-pane", maxWidth + "px");
        });
        servicesGrid.kendoGrid.bind("columnHide", function () {
            var kendoGrid = servicesGrid.kendoGrid;

            //if the table is less wide than the grid
            if (kendoGrid.table[0].clientWidth < kendoGrid.element[0].clientWidth) {
                //get the width of the table
                var maxWidth = kendoGrid.table[0].clientWidth + 59;
                //change the width of the left splitter pane
                servicesPage.find(".km-content").data("kendoSplitter").size("#left-pane", maxWidth + "px");
                servicesPage.find(".km-content").data("kendoSplitter").max("#left-pane", maxWidth + "px");
            }
        });
    };
    //resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 158;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $('#grid').css("max-height", contentHeight + 19 + 'px');
        $('#grid .k-grid-content').css("max-height", contentHeight - 15 + 'px');
        $("#serviceSelectorsScroller").css("max-height", contentHeight + 63 + 'px');
    };

    //Splitter
    var setupSplitter = function () {
        servicesPage.find(".km-content").kendoSplitter({
            orientation: "horizontal",
            panes: [
                { collapsible: false, min: "390px"},
                { collapsible: false, size: "325px", min: "325px" }
            ],
            resize: function () {
                //adjusts the map to fill the new space
                var locWidget = $("#locationSelector").data("location");
                if (locWidget) {
                    locWidget.invalidateMap(200);
                }
                setLocationView();
            }
        });
    };

    //endregion

    //region Public

    services.vm = vm = kendo.observable({
        /**
         * The selected service type
         */
        serviceType: null
    });

    /**
     * Save the selected service
     * @param skipValidation Skip validation
     * @param callback Called on complete
     */
    services.save = function (skipValidation, callback) {
        var service = vm.get("selectedService");

        if (skipValidation || (vm.get("selectedService.Client") && services.validator.validate())) {
            dbServices.services.update({body: service}).done(function () {
                servicesGrid.invalidateSelectedService();

                if (callback) {
                    callback();
                }
                analytics.track("Update Field");
            });
        } else {
            //force validate clients and locations
            var clientInput = $("#serviceDetails").find(".client input:not(.select2-input)");
            var locationInput = $("#serviceDetails").find(".location input:not(.select2-input)");
            services.validator.validateInput(clientInput);
            services.validator.validateInput(locationInput);
        }
    };

    services.exportToCSV = function () {
        var form = $("#csvForm");

        form.find("input[name=roleId]").val(session.get("role.id"));
        form.find("input[name=serviceType]").val(vm.get("serviceType.Name"));

        form.find("input[name=startDate]").val(dateTools.stripDate(vm.get("startDate")));
        form.find("input[name=endDate]").val(dateTools.stripDate(vm.get("endDate")));

        form[0].action = dbServices.ROOT_API_URL + "serviceHolders/GetCsv";
        form.submit();
        analytics.track("Export CSV");
    };

    services.showOptions = function () {
        $("#serviceOptions").attr("style", "display:block");

        $('html').on('click touchend', function (e) {
            if (e.target.type !== "submit") {
                $("#serviceOptions").attr("style", "display:none");
                $('html').off('click');
            }
        });
    };

    //endregion

    /**
     * Handle parameter changes:
     * whenever the url parameters change:
     * 1) update the service type (if it changed)
     * 2) update the grid's filters (if they changed)
     */
    var parametersChanged = function (section, query) {
        if (!section || section.name !== "services" || !services.serviceTypes) {
            return;
        }

        if (!query) {
            query = {};
        }

        var serviceType = vm.get("serviceType");

        //1) update the service type (if it changed)

        //if there is none, choose the vm's selected service
        if (!query.service) {
            //if it is not chosen choose the first one
            if (!serviceType) {
                serviceType = services.serviceTypes[0];
            }

            query.service = serviceType.Name;

            //update the query parameters
            parameters.set({params: query, replace: true});
        }
        //if it changed, update it
        else if (!serviceType || query.service !== serviceType.Name) {
            serviceType = _.find(services.serviceTypes, function (st) {
                return st.Name === query.service;
            });
            vm.set("serviceType", serviceType);

            //update the service selector
        }
    };

    /**
     * Handle all view model changes:
     * 1) Save changes whenever the selected service fields has a change
     * 2) Re-setup the data source/grid whenever the service type changes
     * @param e
     */
    var vmChanged = function (e) {
        //save changes whenever the selected service's Fields change (except DestinationField)
        if (e.field.indexOf("selectedService.Fields") > -1) {
            saveHistory.save();
        }
        //re-setup the grid whenever the service type changes
        else if (e.field === "serviceType") {
            //clear the screen while setting up the grid
            clearScreen();

            var serviceType = vm.get("serviceType");

            //update the service name in the parameters
            var currentParams = parameters.get();
            if (currentParams.service !== serviceType.Name) {
                currentParams.service = serviceType.Name;
                parameters.set({params: currentParams, replace: true});
            }

            //destroy grid if it exists
            if (servicesGrid) {
                servicesGrid.destroy();
            }

            //TODO set is loading on navigator = true
            //load the field types
            dbServices.serviceHolders.read({params: {
                single: true,
                serviceType: serviceType.Name
            }}).done(function (data) {
                    setupGrid(serviceType, _.first(data));
                    //TODO set is loading on navigator = false
                    //(although eventually new data manager should manage is loading)
                });

            //TODO move into ServiceSelector .select
            //make sure the service type selector has the right one selected
            var i, options = $("#serviceTypes > .selectBox").children("*");
            for (i = 0; i < options.length; i++) {
                if (options[i].value === serviceType.Name) {
                    options[i].selected = true;
                }
            }
        }
    };

    //region Constructor

    services.initialize = function () {
        //add validation to the service details
        services.validator = $("#serviceDetails").kendoValidator({
            messages: {
                required: "Required"
            }
        }).data("kendoValidator");

        vm.bind("change", _.debounce(vmChanged, 200));

        setupServiceSelector();
        setupSplitter();

        parameters.changed.add(parametersChanged);

        $(window).resize(resizeGrid);

        //hookup the add & delete buttons
        servicesPage.find(".k-grid-add").on("click", function () {
            if (servicesGrid) {
                servicesGrid.addService();
            }
        });
        servicesPage.find(".k-grid-delete").on("click", function () {
            if (servicesGrid) {
                servicesGrid.deleteService();
            }
        });
    };

    services.show = function () {
        parameters.parse();
        saveHistory.setCurrentSection({
            page: "Services",
            save: services.save
        });

        //reload in case changes were made
        if (servicesGrid) {
            servicesGrid.reloadServices();
        }
    };

    //endregion

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;
});