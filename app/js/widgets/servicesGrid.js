// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["db/services", "ui/ui", "tools/dateTools", "tools/generalTools", "tools/kendoTools", "tools/parameters"], function (dbServices, ui, dateTools, generalTools, kendoTools, parameters) {
    $.widget("ui.servicesGrid", {
        options: {
            //the service type
            serviceType: null,

            //the service template fields to create the datasource from
            serviceFields: null,

            //(Optional) Callback when a service is selected. Parameters: selectedService (ObservableObject)
            serviceSelected: null,

            //(Optional) Called when the grid is initialized
            initialized: null,

            //(Optional) Callback when adding is enabled / disabled. Parameters: isAddEnabled
            addEnabledChange: null,

            //(Optional) Callback after a service is added
            add: null
        },

        _init: function () {
            var widget = this, options = widget.options;

            if (!options.serviceType || !options.serviceFields || !options.serviceSelected) {
                throw new Exception("")
            }

            //set the initial start date to the first of the month and end date to the last of the month
            var firstMonth = session.today().date(1).toDate();
            var lastMonth = session.today().date(1).add('months', 1).subtract('days', 1).toDate();
            widget._firstDataSourceLoad = true;
            widget._setDateRange(firstMonth, lastMonth);

            //for loading set of service holders
            var setParams = {
                roleId: parameters.get().roleId,
                startDate: dateTools.stripDate(options.startDate),
                endDate: dateTools.stripDate(options.endDate),
                serviceType: options.serviceType.Name
            };

            //TODO? decouple data source from widget
            var fields = widget._getFields(options.serviceFields);
            widget.dataSource = new kendo.data.DataSource({
                schema: {
                    model: {
                        id: "ServiceId",
                        fields: fields
                    },
                    parse: function (response) {
                        return widget._formatData(response);
                    }
                },
                sort: { field: "OccurDate", dir: "asc" },
                transport: {
                    read: {
                        url: dbServices.API_URL + "serviceHolders/Get",
                        data: setParams
                    }
                },
                pageSize: 50,
                serverFiltering: false
            });

            widget._watchFiltersAndParameters();

            //create the grid
            widget._initializeGrid(fields);

            //load a template for generating new services
            dbServices.services.read({
                params: {
                    serviceTemplateId: options.serviceType.Id,
                    serviceDate: dateTools.stripDate(options.startDate)
                }}).done(function (services) {
                    widget._serviceTemplate = services[0];
                    widget.options.addEnabledChange(true);
                });
        },

        /**
         * Watch filter and parameter changes:
         * 1) correct and missing start/end date, service type parameters,
         * 2) update filters accordingly
         * @private
         */
        _watchFiltersAndParameters: function () {
            var widget = this;

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

                var startDate = widget.options.startDate;
                var endDate = widget.options.endDate;

                //if there are neither start date or end date filters, set them to the startDate and endDate
                if (!startDateFilter && !endDateFilter) {
                    startDateFilter = {field: "OccurDate", operator: "gte", value: startDate};
                    endDateFilter = {field: "OccurDate", operator: "lte", value: endDate};
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

                var dateChanged = startDate.toDateString() !== startDateFilter.value.toDateString() ||
                    endDate.toDateString() !== endDateFilter.value.toDateString();
                if (dateChanged) {
                    widget._setDateRange(startDateFilter.value, endDateFilter.value);
                    filtersChanged = true;
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

            //TODO? decouple data-source from parameters
            //whenever the grid is filtered, update the URL parameters
            kendoTools.addFilterEvent(widget.dataSource);

            widget.dataSource.bind("filtered", function () {
                kendoTools.updateHashToFilters({name: "services"}, widget.dataSource);
            });

            parameters.changed.add(function (section, query) {
                //if the services section is not loaded ignore parameter changes
                if (!section || section.name !== "services") {
                    return;
                }

                //update the filters based on the hash
                kendoTools.updateFiltersToHash(widget.dataSource, query, processFilters);
            });

            //force re-parse, to fix start/end date filters
            _.delay(parameters.parse, 200);
        },

        _initializeGrid: function (fields) {
            var widget = this, element = $(widget.element), options = widget.options;

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
                    column.template = "# if (data." + key + "== null) { # #= '' # # } else { # "
                        + "<a href='#=" + key + "#' target='_blank'><img src='img/JohnHancock.png' width='80%' style='margin-left: 10%'></a># } #";
                }

                //calculate the width based on number off characters
                var titleLength = Math.round(column.title.length * 7.5) + 45;
                column.width = titleLength + "px";

                columns.push(column);
            });

            //put the OccurDate, Client Name, and Destination first
            //this will be overridden next if a column configuration is already saved
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
            columns = kendoTools.configureColumns(columns, options.serviceType.Id);

            widget.kendoGrid = element.kendoGrid({
                autoBind: false,
                dataBound: function () {
                    //choose the first item when the services are reloaded
                    if (widget._newLoad) {
                        widget.kendoGrid.select(widget.kendoGrid.table.find('tr:first'));
                        widget._newLoad = false;
                    }
                },
                change: function () {
                    var selected = this.select();
                    if (!selected[0]) {
                        widget._selectedServiceHolder = null;
                        widget._selectedService = null;
                        widget.options.serviceSelected(null);
                        return;
                    }

                    var serviceHolder = widget._selectedServiceHolder = this.dataItem(selected[0]);

                    //skip load is used when the service is already loaded
                    if (widget._skipLoad) {
                        widget._skipLoad = false;
                        widget.options.serviceSelected(widget._selectedService);
                    } else {
                        //load the service details then trigger that it has been selected
                        dbServices.services.read({params: {
                            serviceId: serviceHolder.get("ServiceId"),
                            serviceDate: dateTools.stripDate(serviceHolder.get("OccurDate")),
                            recurringServiceId: serviceHolder.get("RecurringServiceId")
                        }}).done(function (services) {
                                widget._selectedService = kendo.observable(services[0]);
                                widget.options.serviceSelected(widget._selectedService);
                            });
                    }
                },
                columns: columns,
                columnMenu: true,
                dataSource: widget.dataSource,
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

            //find the Occur Date column index and limit it
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
            kendoTools.storeConfiguration(widget.kendoGrid, options.serviceType.Id);

            if (options.initialized) {
                options.initialized();
            }
        },

        //reload the services whenever the start or end date changes
        _setDateRange: function (startDate, endDate) {
            var widget = this;
            widget.options.startDate = startDate;
            widget.options.endDate = endDate;

            if (widget.dataSource) {
                widget.dataSource.options.transport.read.data.startDate = dateTools.stripDate(widget.options.startDate);
                widget.dataSource.options.transport.read.data.endDate = dateTools.stripDate(widget.options.endDate);
            }

            widget.reloadServices();
        },

        //clear the grids selection
        _clearSelection: function () {
            this.kendoGrid.clearSelection();
        },

        //Select and scroll to the associated service holder in the grid
        _selectServiceHolder: function (serviceHolder, reloadDetails) {
            var widget = this;
            widget._selectedServiceHolder = serviceHolder;

            if (!reloadDetails) {
                widget._skipLoad = true;
            }
        },

        destroy: function () {
            var widget = this;
            widget.kendoGrid.destroy();
            $(widget.element).empty();
        },

        /**
         * Add a new service
         */
        addService: function () {
            var widget = this;
            //add a new service holder
            var service = kendo.observable(generalTools.deepClone(widget._serviceTemplate));
            service.Id = generalTools.newGuid();
            widget._selectedService = service;

            var serviceHolder = widget.dataSource.add();
            widget._selectServiceHolder(serviceHolder);

            if (widget.options.add) {
                widget.options.add(service);
            }

            //scroll to the new service
            var content = widget.element.find(".k-grid-content");

            //get the number of pages
            var numPages = Math.floor(widget.dataSource.total() / widget.dataSource.pageSize()) + 1;

            //check each page for the row with the UID of the new service
            for (var i = 0; i < numPages; i++) {
                //move to the next page
                widget.dataSource.page(i + 1);

                //get the row that corresponds to the new item
                var row = widget.kendoGrid.tbody.find('tr[data-uid="' + widget._selectedServiceHolder.uid + '"]');

                //check for the row on thepage
                if (row[0]) {
                    //select the service holder in the grid
                    widget.kendoGrid.select(row);
                    //scroll to that row
                    content.scrollTop(row.offset().top - 200);
                    break;
                }
            }
        },

        /**
         * Prompts the user to delete the selected service
         */
        deleteService: function () {
            var widget = this;
            var answer = confirm("Are you sure you want to delete the selected service?");
            if (answer) {
                widget.dataSource.remove(widget._selectedServiceHolder);
                dbServices.services.destroy({body: widget._selectedService});
                //hide the serviceSelectorsWrapper
                $("#serviceSelectorsWrapper").attr("style", "display:none");

                analytics.track("Delete Service");
            }
        },

        /**
         * Update the service holder to the selected Service's info
         */
        invalidateSelectedService: function () {
            var widget = this, service = widget._selectedService, serviceHolder = widget._selectedServiceHolder;

            //change the current row's ServiceId to match the Id in case this was a newly inserted service
            serviceHolder.set("ServiceId", service.Id);

            //update the client name
            if (service.Client) {
                serviceHolder.set("ClientName", service.Client.Name);
            }

            //update all the field columns
            var fields = service.get("Fields");

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
                    val = field.Value.Name + ", " + field.Value.AddressLineOne + " " + field.Value.AddressLineTwo;
                }
                //replace spaces with _
                var columnName = field.Name.split(' ').join('_');
                serviceHolder.set(columnName, val);
            }

            //reselect the row since the grid has been altered
            widget._selectServiceHolder(serviceHolder);
        },

        /**
         * Reload the services
         */
        reloadServices: _.debounce(function () {
            var widget = this;
            if (!widget.dataSource) {
                return;
            }

            //clear selected service
            widget._clearSelection();

            //setting a filter automatically loads the dataSource if no data is available
            //so ignore the first load
            if (widget._firstDataSourceLoad) {
                widget._firstDataSourceLoad = false;
            } else {
                widget.dataSource.read();
            }

            widget._newLoad = true;
        }, 250),

        /**
         * Converts the types returned in the first row of the data returned from
         * GetServicesHoldersWithFields to DataSource fields
         * @param data
         */
        _getFields: function (data) {
            var types = data;

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
        },

        /**
         * Formats the data returned by GetServicesHoldersWithFields
         * to a readable type for kendo's datasource
         * @param data
         */
        _formatData: function (data) {
            var widget = this;
            if (_.isString(data)) {
                data = JSON.parse(data);
            }

            var fields = widget._getFields(_.first(data));

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
        }

        //endregion
    });
});