// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

require(["db/session", "db/services", "tools/parameters", "tools/dateTools", "db/saveHistory", "tools/kendoTools", "tools/analytics", "widgets/serviceDetails",
    "widgets/selectBox"], function (session, dbServices, parameters, dateTools, saveHistory, kendoTools, analytics) {
    var services = {}, serviceHoldersDataSource, grid, handleChange, selectedServiceHolder, vm;

    //region Public
    services.vm = vm = kendo.observable({
        /**
         * The selected service type
         */
        serviceType: null,
        addNewService: function () {
            dbServices.services.read({
                params: {
                    serviceTemplateId: vm.get("serviceType.Id"),
                    serviceDate: dateTools.stripDate(vm.get("startDate"))
                }}).done(function (services) {
                    //disable undo for new entities
                    saveHistory.setUndoEnabled(false);

                    var service = services[0];
                    //add a new service holder
                    selectedServiceHolder = serviceHoldersDataSource.add();
                    handleChange = true;  //prevent loading service details after the row is selected (this is a new service)
                    //select the new service holder it in the grid
                    grid.select(grid.table.find('tr[data-uid="' + selectedServiceHolder.uid + '"]'));

                    //update the selected service
                    vm.setSelectedService(service);
                    vm.syncServiceHolder();

                    //this will trigger validation
                    saveHistory.save();

                    analytics.track("Add Service");
                });
        },
        setSelectedService: function (service) {
            vm.set("selectedService", service);

            saveHistory.close();
            saveHistory.resetHistory();

            if (service) {
                //show the serviceDetailsWrapper
                $("#serviceDetailsWrapper").attr("style", "display:block");
            }
        },
        deleteSelectedService: function () {
            var answer = confirm("Are you sure you want to delete the selected service?");
            if (answer) {
                grid.dataSource.remove(selectedServiceHolder);
                dbServices.services.destroy({body: this.get("selectedService")});
                //hide the serviceDetailsWrapper
                $("#serviceDetailsWrapper").attr("style", "display:none");

                analytics.track("Delete Service");
            }
        },
        /**
         * Update the service holder to the selected Service's info
         */
        syncServiceHolder: function () {
            //store the selected row, to reselect it
            var selectedService = vm.get("selectedService");
            if (!selectedServiceHolder || !grid) {
                return;
            }

            //change the current row's ServiceId to match the Id in case this was a newly inserted service
            selectedServiceHolder.set("ServiceId", selectedService.Id);

            //update the client name
            selectedServiceHolder.set("ClientName", selectedService.get("Client.Name"));

            //update all the field columns
            var fields = selectedService.Fields;

            var i;
            for (i = 0; i < fields.length; i++) {
                var field = fields[i];
                var val = field.get("Value");
                if (field.Type === "OptionsField") {
                    val = "";
                    var options = field.get("Options");
                    var o;
                    for (o = 0; o < options.length; o++) {
                        var option = field.get("Options[" + o + "]");
                        if (option.get("IsChecked")) {
                            val += option.get("Name") + ", ";
                        }
                    }
                    //remove the trailing comma and space
                    val = val.substr(0, val.length - 2);
                } else if (field.Type === "LocationField" && field.Value) {
                    val = field.Value.AddressLineOne + " " + field.Value.AddressLineTwo;
                }
                //replace spaces with _
                var columnName = field.Name.split(' ').join('_');
                selectedServiceHolder.set(columnName, val);
            }

            //reselect the row, and prevent change from reloading the service
            handleChange = true;
            grid.select(grid.table.find('tr[data-uid="' + selectedServiceHolder.uid + '"]'));
        }
    });

    services.undo = function (state) {
        //fixes a problem when the state is stored bc it is converted to json and back
        dbServices.services.parse(state);
        vm.set("selectedService", state);
        //skip validation because the location combobox will be null initially, not validate, and not save
        services.save(true);
    };

    /**
     * Save the selected service
     * @param skipValidation Skip validation
     */
    services.save = function (skipValidation) {
        var service = vm.get("selectedService");

        if (skipValidation || services.validator.validate()) {
            dbServices.services.update({body: service}).done(function () {
                vm.syncServiceHolder();
                //re-enable undo after a service is saved (in case it was disabled for a new service)
                saveHistory.setUndoEnabled(true);

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

    //region Data/DataSource

    /**
     * Converts the types returned in the first row of the data returned from
     * GetServicesHoldersWithFields to DataSource fields
     * @param data
     */
    var getFields = function (data) {
        var types = _.first(data);

        var fieldTypes = {
            "number": {type: "number"},
            "date": {type: "date", detail: "date"},
            "signature": {type: "signature"},
            "string": {type: "string"},
            "guid": {type: "guid"}
        };

        //Setup the data source fields info
        var fields = {};
        _.each(types, function (type, name) {
            //deep copy the proper field type
            var fieldInfo = JSON.parse(JSON.stringify(fieldTypes[type]));
            if (type === "guid") {
                fieldInfo.hidden = true;
            }

            fieldInfo.key = name;

            //replace spaces with underscores to make it friendly to kendo grid
            var adjustedName = name.replace(/ /g, "_");

            //Add the type to fields
            //Example ShipCity: { type: "string" }
            fields[adjustedName] = fieldInfo;
        });

        return fields;
    };

    /**
     * Formats the data returned by GetServicesHoldersWithFields
     * to a readable type for kendo's datasource
     * @param data
     */
    var formatData = function (data) {
        if (_.isString(data)) {
            data = JSON.parse(data);
        }

        var fields = getFields(data);

        //format the data
        var formattedData = [];
        //exclude the type data in the first row
        _.each(_.rest(data), function (row) {
            var formattedRow = {};
            //go through each field type, and convert the data to the proper type
            _.each(fields, function (value, name) {
                var originalValue = row[value.key];
                var convertedValue;
                if (originalValue === null) {
                    convertedValue = "";
                } else if (value.type === "number") {
                    convertedValue = parseFloat(originalValue);
                } else if (value.detail === "date") {
                    convertedValue = moment(originalValue).toDate();
                } else if (value.type === "string") {
                    if (originalValue) {
                        convertedValue = originalValue.toString();
                    }
                    else {
                        convertedValue = "";
                    }
                } else {
                    convertedValue = originalValue;
                }

                formattedRow[name] = convertedValue;
            });

            formattedData.push(formattedRow);
        });

        return formattedData;
    };

    /**
     * 1) Correct missing start or end date filters
     * 2) Correct missing service type filters
     * @param filterSet
     */
    var processFilters = function (filterSet) {
        var filtersChanged = false;

        var normalized = [];
        _.each(filterSet, function (filter) {
            if (filter.filters) {
                normalized.push(filter.filters);
            } else {
                normalized.push(filter);
            }
        });

        //1) correct missing start or end date filters
        var startDateFilter = _.find(normalized, function (f) {
            return f.field === "OccurDate" && f.operator === "gte";
        });
        var endDateFilter = _.find(normalized, function (f) {
            return f.field === "OccurDate" && f.operator === "lte";
        });

        var vmStartDate = vm.get("startDate");
        var vmEndDate = vm.get("endDate");

        //if there are neither start date or end date filters, set them to the vm's startDate and endDate
        if (!startDateFilter && !endDateFilter) {
            startDateFilter = {field: "OccurDate", operator: "gte", value: vmStartDate};
            endDateFilter = {field: "OccurDate", operator: "lte", value: vmEndDate};
            filtersChanged = true;
        }
        //if there is a startDateFilter but not a endDateFilter: set it to 2 weeks later
        else if (!endDateFilter) {
            endDateFilter = {field: "OccurDate", operator: "lte", value: moment(startDateFilter.value).add('weeks', 2).toDate()};
            filtersChanged = true;
        }
        //if there is a endDateFilter but not a startDateFilter: set it to 2 weeks prior
        else if (!startDateFilter) {
            startDateFilter = {field: "OccurDate", operator: "gte", value: moment(endDateFilter.value).subtract('weeks', 2).toDate()};
            filtersChanged = true;
        }

        var dateChanged = vmStartDate.toDateString() !== startDateFilter.value.toDateString() ||
            vmEndDate.toDateString() !== endDateFilter.value.toDateString();
        if (dateChanged) {
            vm.set("startDate", startDateFilter.value);
            vm.set("endDate", endDateFilter.value);
        }

        //if the filtersChanged, return the new filters
        if (filtersChanged) {
            var otherFilters = _.filter(filterSet, function (f) {
                return f.field !== "OccurDate";
            });

            otherFilters.push(startDateFilter);
            otherFilters.push(endDateFilter);

            return otherFilters;
        }
    };

    /**
     * Reload the services
     */
    var reloadServices = _.debounce(function () {
        if (!serviceHoldersDataSource) {
            return;
        }

        serviceHoldersDataSource.options.transport.read.data.startDate = dateTools.stripDate(vm.get("startDate"));
        serviceHoldersDataSource.options.transport.read.data.endDate = dateTools.stripDate(vm.get("endDate"));
        serviceHoldersDataSource.read();
    }, 250);

    //endregion

    //region Grid

    /**
     * Disable the filter's: and/or, before/after/equal to... drop downs, and clear button
     * @param columnIndex Index of the column
     */
    var limitFilter = function (columnIndex) {
        //find the parent div of the filter window
        var filterWindow = $($('select[data-bind^="value: filters"]').closest('div')[columnIndex]);

        //disable the drop drowns
        filterWindow.find("select").each(function () {
            $(this).data("kendoDropDownList").enable(false);
        });

        //disabled the Clear filter button
        filterWindow.find("button[type='reset']")
            .attr("disabled", "disabled").addClass('k-state-disabled');
    };

    //resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 158;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $('#grid').css("max-height", contentHeight + 19 + 'px');
        $('#grid .k-grid-content').css("max-height", contentHeight - 15 + 'px');
        $("#serviceDetails").css("max-height", contentHeight + 63 + 'px');
    };

    var setupGrid = function (fields) {
        //Setup the columns based on the fields
        var columns = [];
        _.each(fields, function (value, key) {
            if (value.hidden) {
                return;
            }

            var column = {};

            //replace _ with spaces, and insert a space before each capital letter
            column.title = key.split('_').join(' ').replace(/([A-Z])/g, ' $1');

            column.field = key;
            column.type = value.type;
            if (column.type === "number") {
                column.template = "#= (" + key + "== null) ? ' ' : " + key + " #";
            }
            else if (value.detail === "date") {
                column.template = "#= (" + key + "== null) ? ' ' : moment.utc(" + key + ").format('LL') #";
            }
            else if (column.type === "signature") {
                column.template = "# if (!" + key + ") { # #= '' # # } else { # "
                    + "<a href='#=" + key + "#' target='_blank'><img src='img/JohnHancock.png' width='90'></a># } #";
            }

            //calculate the width based on number off characters
            var titleLength = Math.round(column.title.length * 7.5) + 45;
            column.width = titleLength + "px";

            columns.push(column);
        });

        //put the OccurDate, Client Name, and Destination first
        //dont worry, this will be overridden next if a column configuration is already saved
        var prioritize = ['OccurDate', 'ClientName', 'Destination'];
        //find the columns
        var priorityColumns = _.map(prioritize, function (colName) {
            return _.find(columns, function (c) {
                return colName === c.field;
            });
        });
        //put them first
        var order = 0;
        _.each(priorityColumns, function (pcol) {
            if (pcol) {
                pcol.order = order;
                order++;
            }
        });

        //then order the other columns alphabetically
        var alphabetically = _.sortBy(_.difference(columns, priorityColumns), "field");
        _.each(alphabetically, function (c) {
            c.order = order;
            order++;
        });

        //configure the columns based on the user's stored configuration
        columns = kendoTools.configureColumns(columns, vm.get("serviceType.Id"));

        var servicesSection = $("#services");

        grid = servicesSection.find("#grid").data("kendoGrid");
        if (grid) {
            grid.destroy();
        }
        servicesSection.find("#grid").empty();

        grid = servicesSection.find("#grid").kendoGrid({
            autoBind: false,
            change: function () {
                //show the delete button only if a row is selected
                var servicesSection = $("#services");
                if (servicesSection.find("tr.k-state-selected")[0]) {
                    servicesSection.find(".k-grid-delete").attr("style", "display:inline-block");
                } else {
                    servicesSection.find(".k-grid-delete").attr("style", "display:none");
                }

                //whenever a field is changed, the grid needs to be reselected. handleChange is set to prevent triggering a reload
                if (handleChange) {
                    handleChange = false;
                    return;
                }

                selectedServiceHolder = this.dataItem(this.select());
                if (!selectedServiceHolder) {
                    return;
                }
                //load the service details, then update the selected service
                dbServices.services.read({params: {
                    serviceId: selectedServiceHolder.get("ServiceId"),
                    serviceDate: dateTools.stripDate(selectedServiceHolder.get("OccurDate")),
                    recurringServiceId: selectedServiceHolder.get("RecurringServiceId")
                }}).done(function (services) {
                        vm.setSelectedService(services[0]);
                        resizeGrid();
                    });
            },
            columns: columns,
            columnMenu: true,
            dataBound: resizeGrid,
            dataSource: serviceHoldersDataSource,
            filterable: true,
            pageable: true,
            resizable: true,
            reorderable: true,
            scrollable: true,
            sortable: {
                mode: "multiple"
            },
            selectable: true
        }).data("kendoGrid");

        //find the Occur Date column index
        var visibleIndex = 0;
        for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
            var column = columns[columnIndex];

            //only consider visible columns
            if (column.hidden) {
                continue;
            }

            if (column.field === "OccurDate") {
                //limit the available filters on OccurDate
                limitFilter(visibleIndex);
                break;
            }

            visibleIndex++;
        }

        //Keep track of any changes to the columns, and store the configuration
        kendoTools.storeConfiguration(grid, vm.get("serviceType.Id"));

        grid.refresh();
    };

    //endregion

    //region Constructor

    /*
     * Create a data source and grid.
     * This is called whenever the service is changed because the data schema is dynamic
     * and kendo datasource does not allow you to change the schema.
     */
    var createDataSourceAndGrid = function () {
        var serviceType = vm.get("serviceType.Name");

        var baseParams = {
            startDate: dateTools.stripDate(vm.get("startDate")),
            endDate: dateTools.stripDate(vm.get("endDate")),
            serviceType: serviceType
        };

        //for loading the field types
        var singleParams = _.extend({single: true}, baseParams);

        //for loading set of service holders
        var setParams = _.extend({roleId: parameters.get().roleId}, baseParams);

        //load the fields types
        //then create the datasource
        //then create the grid
        dbServices.serviceHolders.read({params: singleParams}).done(function (data) {
            var fields = getFields(data);
            serviceHoldersDataSource = new kendo.data.DataSource({
                schema: {
                    model: {
                        id: "ServiceId",
                        fields: fields
                    },
                    parse: function (response) {
                        return formatData(response);
                    }
                },
                sort: { field: "OccurDate", dir: "asc" },
                transport: {
                    read: {
                        url: dbServices.API_URL + "serviceHolders/Get",
                        data: setParams
                    }
                },
                pageSize: 50
            });

            //create the grid
            setupGrid(fields);

            //whenever the grid is filtered, update the URL parameters
            kendoTools.addFilterEvent(serviceHoldersDataSource);
            serviceHoldersDataSource.bind("filtered", function () {
                kendoTools.updateHashToFilters({name: "services"}, serviceHoldersDataSource);
            });

            //force reparse, to fix start/end date filters
            parameters.parse();
        });
    };

    /**
     * Handle parameter changes:
     * whenever the url parameters change:
     * 1) update the service type (if it changed)
     * 2) update the grid's filters (if they changed)
     */
    var handleParameterChanges = function () {
        parameters.changed.add(function (section, query) {
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
                return;
            }
            //if it changed, update it
            else if (!serviceType || query.service !== serviceType.Name) {
                serviceType = _.find(services.serviceTypes, function (st) {
                    return st.Name === query.service;
                });
                vm.set("serviceType", serviceType);
            }

            //update the filters based on the hash
            kendoTools.updateFiltersToHash(serviceHoldersDataSource, query, processFilters);
        });
    };

    /**
     * Setup the service types drop down
     */
    var setupServiceSelector = function () {
        //load the current business account's service types
        dbServices.serviceTemplates.read().done(function (serviceTypes) {
            services.serviceTypes = serviceTypes;

            //Setup selectBox
            $("#serviceTypes").selectBox({
                data: serviceTypes,
                dataTextField: "Name",
                onSelect: function (selectedOption) {
                    vm.set("serviceType", {Id: selectedOption.value, Name: selectedOption.name});

                    //disable the delete button and hide the service details
                    $("#services").find(".k-grid-delete").attr("style", "display:none");

                    //hide the serviceDetailsWrapper
                    $("#serviceDetailsWrapper").attr("style", "display:none");
                }
            });

            //now that the service types are loaded,
            //setup the grid by reparsing the hash
            parameters.parse();
        });
        $("#serviceDetails").kendoServiceDetails({signatureIsReadOnly: true});
    };

    /**
     * Handle all view model changes:
     * 1) Save changes whenever the selected service has a change
     * 2) Re-setup the data source/grid whenever the service type changes
     * 3) Reload the services whenever the start or end date changes
     * @param e
     */
    var vmChanged = function (e) {
        //save changes whenever the selected service has a change
        if (e.field.indexOf("selectedService.") > -1) {
            saveHistory.save();
        }
        //re-setup the data source/grid whenever the service type changes
        else if (e.field === "serviceType") {
            var serviceName = vm.get("serviceType.Name");

            var currentParams = parameters.get();
            if (currentParams.service !== serviceName) {
                currentParams.service = serviceName;
                parameters.set({params: currentParams, replace: true});
            }

            createDataSourceAndGrid();

            var serviceTypeId = vm.get("serviceType.Id");
            var serviceTypeName = vm.get("serviceType.Name");

            //make sure dropdownlist has service type selected
            var i, options = $("#serviceTypes > .selectBox").children("*");
            for (i = 0; i < options.length; i++) {
                if (options[i].value === serviceTypeId) {
                    options[i].selected = true;
                }
            }
        }
        //reload the services whenever the start or end date changes
        else if (e.field === "startDate" || e.field === "endDate") {
            reloadServices();
        }
    };

    services.initialize = function () {
        //add validation to the service details
        services.validator = $("#serviceDetails").kendoValidator({
            messages: {
                required: "Required"
            }
        }).data("kendoValidator");

        var today = session.today().toDate();
        var twoWeeks = session.today().add('weeks', 2).toDate();

        //set the initial start date to today and end date in two weeks
        vm.set("startDate", today);
        vm.set("endDate", twoWeeks);

        vm.bind("change", _.debounce(vmChanged, 200));

        setupServiceSelector();

        //hookup the add & delete buttons
        $("#services").find(".k-grid-add").on("click", function () {
            vm.addNewService();
        });
        $("#services").find(".k-grid-delete").on("click", function () {
            vm.deleteSelectedService();
        });

        //setup resizing
        $(window).resize(function () {
            resizeGrid();
        });

        handleParameterChanges();
    };

    services.show = function () {
        parameters.parse();
        saveHistory.setCurrentSection({
            page: "Services",
            save: services.save,
            undo: services.undo,
            state: function () {
                return vm.get("selectedService");
            }
        });

        //needed in case changes are made
        reloadServices();
    };

    //endregion

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;
});