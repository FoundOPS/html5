// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

require(["jquery", "db/session", "db/services", "tools/parameters", "tools/dateTools", "db/saveHistory", "tools/kendoTools", "widgets/serviceDetails",
    "widgets/locationWidget", "jform"], function ($, session, dbServices, parameters, dateTools, saveHistory, kendoTools) {
    var services = {}, serviceHoldersDataSource, grid, handleChange, serviceTypesDropDown, selectedServiceHolder, vm, locationWidget;
    var location = null;//{AddressLineOne: "200 N Salisbury St", AddressLineTwo: null, AdminDistrictTwo: "West Lafayette", AdminDistrictOne: "IN", PostalCode: "47906", Latitude: 40.419034, Longitude: -86.894708};

    //region Public
    services.vm = vm = kendo.observable({
        /**
         * The selected service type
         */
        serviceType: null,
        addNewService: function () {
            dbServices.getServiceDetails(null, vm.get("startDate"), null, vm.get("serviceType.Id"), function (service) {
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
            });
        },
        setSelectedService: function (service) {
            vm.set("selectedService", service);

            saveHistory.close();
            saveHistory.resetHistory();

            if (service) {
                //show the service details
                $("#serviceDetails").attr("style", "display:block");
                if(locationWidget){
                    locationWidget.removeMap();
                }
                //show location widget
                $("#locationWidget").attr("style", "display:block");

                if(!location){
                    dbServices.getDepots(function (loadedDepots) {
                        if(loadedDepots.length >= 1){
                            locationWidget.renderMap(loadedDepots[0], false);
                        }
                    });
                }else{
                    locationWidget.renderMap(location, true);
                }
            }
        },
        deleteSelectedService: function () {
            var answer = confirm("Are you sure you want to delete the selected service?");
            if (answer) {
                grid.dataSource.remove(selectedServiceHolder);
                dbServices.deleteService(this.get("selectedService"));
                $("#serviceDetails").attr("style", "display:none");
                locationWidget.removeMap();
                $("#locationWidget").attr("style", "display:none");
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
        dbServices.convertServiceDates(state);
        vm.set("selectedService", state);
        services.save();
    };

    services.save = function () {
        var service = vm.get("selectedService");

        if (services.validator.validate()) {
            dbServices.updateService(service).success(function () {
                vm.syncServiceHolder();
            });
        } else {
            //force validate clients
            var clientInput = $("#serviceDetails .client input:not(.select2-input)");
            services.validator.validateInput(clientInput);
        }
    };

    services.exportToCSV = function () {
        var form = $("#csvForm");

        form.find("input[name=roleId]").val(session.get("role.id"));
        form.find("input[name=serviceType]").val(vm.get("serviceType.Name"));

        form.find("input[name=startDate]").val(dateTools.stripDate(vm.get("startDate")));
        form.find("input[name=endDate]").val(dateTools.stripDate(vm.get("endDate")));

        form[0].action = dbServices.ROOT_API_URL + "Service/GetServicesHoldersWithFieldsCsv";
        form.submit();
    };
//endregion

    //region DataSource

    /**
     * Converts the types returned in the first row of the data returned from
     * GetServicesHoldersWithFields to DataSource fields
     * @param data
     */
    var getFields = function (data) {
        var types = _.first(data);

        var fieldTypes = {
            "number": {type: "number"},
            "dateTime": {type: "date", detail: "datetime"},
            "time": {type: "string", detail: "time"},
            "date": {type: "date", detail: "date"},
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
                } else if (value.detail === "date" || value.detail === "datetime" || value.detail === "time") {
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

    /*
     * Create a data source and grid.
     * This is called whenever the service is changed because the data schema is dynamic
     * and kendo datasource does not allow you to change the schema.
     */
    var createDataSourceAndGrid = function () {
        var serviceType = vm.get("serviceType.Name");

        var readAction = "service/GetServicesHoldersWithFields";
        var params = {
            startDate: dateTools.stripDate(vm.get("startDate")),
            endDate: dateTools.stripDate(vm.get("endDate")),
            serviceType: serviceType
        };

        //load the fields types
        //then create the datasource
        //then create the grid
        dbServices._getHttp(readAction + "?single=true", params)(function (data) {
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
                        url: dbServices.API_URL + readAction,
                        data: params
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
//endregion

    //region Grid

//resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 85;
        var windowHeight = $(window).height();
        var topHeight = $('#top').outerHeight(true);
        var contentHeight = windowHeight - topHeight - extraMargin;
        $('#grid').css("height", contentHeight + 24 + 'px');
        $('#grid .k-grid-content').css("height", contentHeight - 41 + 'px');
        $("#serviceDetails").css("max-height", contentHeight + 5 - 345 + 'px');
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
            //TODO: Adjust below, show time zone
            else if (value.detail === "date") {
                column.template = "#= (" + key + "== null) ? ' ' : moment.utc(" + key + ").format('LL') #";
            } else if (value.detail === "datetime") {
                column.template = "#= (" + key + "== null) ? ' ' : moment.utc(" + key + ").format('LLL') #";
            } else if (value.detail === "time") {
                column.template = "#= (" + key + "== null) ? ' ' : moment.utc(" + key + ").format('LT') #";
            }

            //calculate the width based on number off characters
            var titleLength = column.title.length * 7.5 + 35;
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

        grid = $("#grid").data("kendoGrid");
        if (grid) {
            grid.destroy();
        }
        $("#grid").empty();

        grid = $("#grid").kendoGrid({
            autoBind: false,
            change: function () {
                //enable delete button
                $('#services .k-grid-delete').removeAttr("disabled");

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
                dbServices.getServiceDetails(selectedServiceHolder.get("ServiceId"), selectedServiceHolder.get("OccurDate"), selectedServiceHolder.get("RecurringServiceId"), null, function (service) {
                    vm.setSelectedService(service);
                });
            },
            columns: columns,
            columnMenu: true,
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

        //Keep track of any changes to the columns, and store the configuration
        kendoTools.storeConfiguration(grid, vm.get("serviceType.Id"));

        grid.refresh();
    };

//endregion

    var reloadServices = _.debounce(function () {
        serviceHoldersDataSource.options.transport.read.data.startDate = dateTools.stripDate(vm.get("startDate"));
        serviceHoldersDataSource.options.transport.read.data.endDate = dateTools.stripDate(vm.get("endDate"));
        serviceHoldersDataSource.read();
    }, 250);

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

            //make sure dropdownlist has service type selected
            if (serviceTypesDropDown.dataItem().Id !== serviceTypeId) {
                serviceTypesDropDown.value(serviceTypeId);
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

        //load the current business account's service types then
        //1) setup the service types drop down
        //2) choose the first service+ type
        dbServices.getServiceTypes(function (serviceTypes) {
            services.serviceTypes = serviceTypes;

            serviceTypesDropDown = $("#serviceTypes").kendoDropDownList({
                dataTextField: "Name",
                dataValueField: "Id",
                dataSource: services.serviceTypes,
                change: function (e) {
                    vm.set("serviceType", this.dataItem());

                    //disable the delete button and hide the service details
                    $('#services .k-grid-delete').attr("disabled", "disabled");
                    $("#serviceDetails").attr("style", "display:none");
                    $("#locationWidget").attr("style", "display:none");
                    locationWidget.removeMap();
                }
            }).data("kendoDropDownList");

            //now that the service types are loaded,
            //setup the grid by reparsing the hash
            parameters.parse();
        });

        $("#serviceDetails").kendoServiceDetails();
        $("#locationWidget").location();
        locationWidget = $("#locationWidget").data("location");

        //hookup the add & delete buttons
        $("#services .k-grid-add").on("click", function () {
            vm.addNewService();
        });
        $("#services .k-grid-delete").on("click", function () {
            vm.deleteSelectedService();
        });

        //setup resizing
        $(window).resize(function () {
            resizeGrid();
        });
        resizeGrid();

        //whenever the url parameters change:
        //1) update the service type (if it changed)
        //2) update the grid's filters (if they changed)
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
    };

//set services to a global function, so the functions are accessible from the HTML element
    window.services = services;
});