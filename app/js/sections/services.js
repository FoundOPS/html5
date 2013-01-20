// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

require(["db/session", "db/services", "tools/parameters", "tools/dateTools", "db/saveHistory", "tools/kendoTools", "tools/analytics", "db/models", "widgets/serviceDetails",
    "widgets/selectBox", "widgets/servicesGrid"], function (session, dbServices, parameters, dateTools, saveHistory, kendoTools, analytics, models) {
    var services = {}, vm,
        servicesPage = $("#services"), clientSelector = $("#clientSelector"), locationSelector = $("#locationSelector"),
        locationWidget, servicesGrid, serviceTypeSelectBox;

    //region UI initialization

    //region show / hide
    var showAdd = function (show) {
        servicesPage.find(".k-grid-add").attr("style", show ? "display:inline-block" : "display:none");
    };
    var showDelete = function (show) {
        servicesPage.find(".k-grid-delete").attr("style", show ? "display:inline-block" : "display:none");
    };
    var showOptions = function (show) {
        servicesPage.find(".k-grid-edit.optionsMenu").attr("style", show ? "" : "display:none");
    };
    var showServiceDetails = function (show) {
        $("#serviceSelectorsWrapper").attr("style", show ? "display:block" : "display:none");
    };
    //endregion

    //Location widget
    /**
     * Update and save the destination field
     * @param location
     */
    var updateDestinationField = function (location) {
        var destinationField = models.getDestinationField(vm.get("selectedService"));
        destinationField.Value = location;

        services.save(true, function () {
            servicesGrid.invalidateSelectedService();
        });
    };

    var setupLocationWidget = function (service) {
        //remove the location widget if it exists
        if (locationWidget) {
            locationWidget.removeWidget();
        }

        var destinationField = models.getDestinationField(service);
        //initialize the location widget with the destination
        var destination = destinationField.Value ? destinationField.Value : {};

        var client = clientSelector.select2("data"), clientId;
        if (client) {
            clientId = client.Id;
        }

        /**
         * @param location The location to add or change
         * @param action - create or update
         */
        var addChangeLocation = function (location, action) {
            //add the location then
            //save the service (which will update destination field)
            dbServices.locations[action]({body: location}).done(function () {
                updateDestinationField(location);
            });
        };

        locationSelector.location({
            data: [destination],
            clientId: clientId,
            add: function (loc) {
                addChangeLocation(loc, "create");
            },
            change: function (loc) {
                addChangeLocation(loc, "update");
            }
        });

        locationWidget = locationSelector.data("location");
        setLocationView();
    };
    var setLocationView = function () {
        //determine what location widget view should be set
        if (locationWidget) {
            var width = servicesPage.find(".km-content").data("kendoSplitter").options.panes[1].size;

            //move the location list to the left of map if wide enough
            var rightWidth = parseInt(width.substring(0, width.length - 2));

            if (rightWidth > 557) {
                locationWidget.wideView(rightWidth);
            } else {
                locationWidget.narrowView();
            }
        }
    };

    //Client widget
    var clientChanged = _.debounce(function () {
        var client = clientSelector.select2("data");

        vm.get("selectedService").set("Client", client);
        vm.get("selectedService").set("ClientId", client.Id);

        locationWidget.options.clientId = client.Id;

        //get the first location for this client
        dbServices.locations.read({params: {clientId: client.Id}}).done(function (locations) {
            if (locations.length > 0) {
                //update the location widget with this new location
                locationWidget.options.data = [locations[0]];
                locationWidget.showList();
                updateDestinationField(locations[0]);
            } else {
                //show the edit screen
                locationWidget.options.data = [
                    {}
                ];
                locationWidget.showList();
                locationWidget.edit(0, true);
            }
        });
    }, 250);

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
            serviceTypeSelectBox = $("#serviceTypes").selectBox({
                data: serviceTypes,
                dataTextField: "Name",
                isEqual: function (a, b) {
                    return a.Name === b.Name;
                },
                onSelect: function (selectedOption) {
                    vm.set("serviceType", selectedOption);
                }
            }).data("selectBox");

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

        //destroy grid if it exists
        if (servicesGrid) {
            servicesGrid.destroy();
        }

        //disable the add, delete and options buttons
        showAdd(false);
        showDelete(false);
        showOptions(false);
        showServiceDetails(false);
    };
    var setupGrid = function (serviceType, fields) {
        servicesGrid = $("#services").find("#grid").servicesGrid({
            serviceType: serviceType,
            serviceFields: fields,
            initialized: function () {
                //enable the options menu now that the grid is setup
                showOptions(true);
                resizeGrid();
            },
            serviceSelected: function (service) {
                vm.set("selectedService", service);

                saveHistory.close();
                resizeGrid();

                if (service) {

                    setupClientWidget(service);

                    if (service.Client) {
                        //set the initial selection
                        clientSelector.select2("data", service.Client);
                    }

                    setupLocationWidget(service);
                }

                //enable the delete button and show service details if a service is selected
                showDelete(service);
                showServiceDetails(service);
            },
            add: function (service) {
                //this will trigger validation
                saveHistory.save();

                analytics.track("Add Service");
            },
            addEnabledChange: function (addIsEnabled) {
                showAdd(addIsEnabled);
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
                if (locationWidget) {
                    locationWidget.invalidateMap(200);
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
        if (!servicesGrid) {
            return;
        }

        var form = $("#csvForm");

        form.find("input[name=roleId]").val(session.get("role.id"));
        form.find("input[name=serviceType]").val(vm.get("serviceType.Name"));

        form.find("input[name=startDate]").val(dateTools.stripDate(servicesGrid.options.startDate));
        form.find("input[name=endDate]").val(dateTools.stripDate(servicesGrid.options.endDate));

        form[0].action = dbServices.ROOT_API_URL + "serviceHolders/GetCsv";
        form.submit();
        analytics.track("Export CSV");
    };

    var optionMenuListening = false;
    services.showOptions = function () {
        //prevent double listeners
        if (optionMenuListening) {
            optionMenuListening = false;
        } else {
            //listen to any clicks
            $('html').on('click touchend', function () {
                //if the menu is open: close it
                if ($("#serviceOptions")[0].style.display === "block") {
                    $("#serviceOptions")[0].style.display = "none";
                    $(".optionsMenu").attr("style", "");
                    $('html').off('click');
                    optionMenuListening = false;
                }
                //otherwise open the menu
                else {
                    $("#serviceOptions")[0].style.display = "block";
                    $(".optionsMenu").attr("style", "border: 2px solid #c0c0c0; border-bottom: none; background-color: #fff;");
                }
            });
            optionMenuListening = true;
        }
    };

    //endregion

    /**
     * Handle parameter changes:
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

        //if there is no parameter set it to the vm's
        if (!query.service) {
            //if it is not chosen choose the first one
            if (!serviceType) {
                serviceType = services.serviceTypes[0];
            }

            query.service = serviceType.Name;

            //update the query parameters
            parameters.set({params: query, replace: true});
        }
        //if the service type parameter is different than the vm's, update the vm
        else if (!serviceType || query.service !== serviceType.Name) {
            serviceType = _.find(services.serviceTypes, function (st) {
                return st.Name === query.service;
            });
            vm.set("serviceType", serviceType);
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
            var serviceType = vm.get("serviceType");
            if (!serviceType) {
                return;
            }

            //clear the screen while setting up the grid
            clearScreen();

            //update the service name in the parameters
            var currentParams = parameters.get();
            if (currentParams.service !== serviceType.Name) {
                currentParams.service = serviceType.Name;
                parameters.set({params: currentParams, replace: true});
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

            serviceTypeSelectBox.select(serviceType);
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

        sectionChanged(parameters.getSection());
    };

    var sectionChanged = function (section) {
        if (!section || section.name !== "services") {
            return;
        }

        saveHistory.setCurrentSection({
            page: "Services",
            save: services.save
        });

        //reload all services in case changes have been made
        if (servicesGrid) {  //prevents double load initially
            servicesGrid.reloadServices();
        }
    };

    parameters.section.changed.add(sectionChanged);

    //endregion

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;
});