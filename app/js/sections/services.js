// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

require(["jquery", "db/services", "tools", "db/saveHistory", "lib/moment", "widgets/serviceDetails", "lib/jquery.form"], function ($, dbServices, tools, saveHistory) {
    var services = {}, serviceHoldersDataSource, vm = kendo.observable(), grid;

    services.vm = vm;

    services.undo = function (state) {
        vm.set("selectedService", state);
        services.save();
    };

    services.save = function () {
        dbServices.updateService(vm.get("selectedService")).success(function (e) {
            //Change the current row's ServiceId to match this Id in case this was a newly inserted service
            if (grid) {
                var selectedItem = grid.dataItem(grid.select());
                selectedItem.set("ServiceId", vm.get("selectedService.Id"));

                //TODO update all the columns
            }
        });
    };

    /**
     * A kendo data source for Services for the current business account.
     * It is initialized every time the data is loaded because the data schema is dynamic
     * and kendo datasource does not allow you to change the schema.
     * @param {Date} startDate The first date to load services for
     * @param {Date} endDate The last date to load services for
     * @param {!function(kendo.data.DataSource, Array.<Object>, Array.<Object>} callback When the data is loaded it will call
     * this function and pass 3 parameters: the datasource, the fields, and the formatted data
     */
    var getDataSource = function (startDate, endDate, serviceType, callback) {
        var formatResponse = function (data) {
            //The types will be returned in the first row
            var types = _.first(data);

            //Setup the data source fields info
            var fields = {};
            _.each(types, function (type, name) {
                //Example ShipCity: { type: "string" }
                var field = {};
                var jType; //the datasource type
                var detail; //details about the type
                if (type === "System.Decimal") {
                    jType = "number";
                } else if (type === "System.DateTime") {
                    jType = "date";
                    detail = "datetime";
                } else if (type === "Time") {
                    jType = "date";
                    detail = "time";
                } else if (type === "Date") {
                    jType = "date";
                    detail = "date";
                } else if (type === "System.String" || type === "System.Guid") {
                    jType = "string";
                } else {
                    return;
                }

                var fieldValues = {type: jType, defaultValue: "", detail: detail};

                if (type === "System.Guid") {
                    fieldValues.hidden = true;
                }

                //Add the type to fields
                fields[name] = fieldValues;
            });

            //format the data
            var formattedData = [];
            //exclude the type data in the first row
            _.each(_.rest(data), function (row) {
                var formattedRow = {};
                //go through each field type, and convert the data to the proper type
                _.each(fields, function (value, key) {
                    var originalValue = row[key];
                    var convertedValue;
                    if (originalValue === null) {
                        convertedValue = "";
                    } else if (value.type === "number") {
                        convertedValue = parseFloat(originalValue);
                    } else if (value.type === "date") {
                        convertedValue = new Date(originalValue);
                    } else if (value.type === "string") {
                        convertedValue = originalValue.toString();
                    } else {
                        return;
                    }

                    formattedRow[key] = convertedValue;
                });

                formattedData.push(formattedRow);
            });

            //Setup the datasource
            serviceHoldersDataSource = new kendo.data.DataSource({
                data: formattedData,
                schema: {
                    model: {
                        id: "ServiceId",
                        fields: fields
                    }
                }
            });

            serviceHoldersDataSource.sort({ field: "OccurDate", dir: "asc" });

            callback(fields, formattedData);
        };

        dbServices._getHttp("service/GetServicesHoldersWithFields", {startDate: tools.formatDate(startDate), endDate: tools.formatDate(endDate), serviceType: serviceType}, false)(formatResponse);
    };

    var setupServiceTypeDropdown = function () {
        $("#serviceTypes").kendoDropDownList({
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: services.serviceTypes,
            change: function() {
                //load the saved column configuration
                getColumnConfig();

                //reload the services
                services.updateServices();
            }
        });
    };

    var getColumnConfig = function () {
//        dbServices.getColumnConfig(function (columns) {
//            services.columnConfig = columns;
//        });
    };

    //save the column configuration
    var saveGridConfig = function () {
        _.delay(function () {
            var columns = services.grid.columns;
            var columnConfig = [];
            for(var c in columns){
                var column = {};
                column.name = columns[c].field;
                column.width = columns[c].width;
                if(columns[c].hidden){
                    column.hide = columns[c].hidden;
                }
                columnConfig.push(column);
            }
            //dbServices.updateGridConfig(columnConfig);
        }, 200);
    };

    services.initialize = function () {
        var resizeGrid = function (initialLoad) {
            var extraMargin;
            if (initialLoad) {
                extraMargin = 50;
            } else {
                extraMargin = 85;
            }
            var windowHeight = $(window).height();
            var topHeight = $('#top').outerHeight(true);
            var contentHeight = windowHeight - topHeight - extraMargin;
            $('#grid').css("height", contentHeight + 'px');
            $('#grid .k-grid-content').css("height", contentHeight + 'px');
        };

        var setupGrid = function (fields) {
            //Setup the columns based on the fields
            var columns = [];
            _.each(fields, function (value, key) {
                if(value.hidden){
                    return;
                }

                var column = {};

                //replace _ with spaces, and insert a space before each capital letter
                column.title = key.split('_').join(' ').replace(/([A-Z])/g, ' $1');

                column.field = key;
                column.type = value.type;
                if (column.type === "number") {
                    column.template = "#= (" + key + "== null) ? ' ' : " + key + " #";
                } else if (column.type === "date") {
                    if (value.detail === "datetime") {
                        column.template = "#= (" + key + "== null) ? ' ' : moment(" + key + ").format('LLL') #";
                    } else if (value.detail === "time") {
                        column.template = "#= (" + key + "== null) ? ' ' : moment(" + key + ").format('LT') #";
                    } else if (value.detail === "date") {
                        column.template = "#= (" + key + "== null) ? ' ' : moment(" + key + ").format('LL') #";
                    }
                }

                var titleLength = column.title.length * 7.5 + 35;
                column.width = titleLength + "px";

                columns.push(column);
            });

            grid = $("#grid").kendoGrid({
                autoBind: true,
                change: function () {
                    var selectedItem = this.dataItem(this.select());
                    //Load the service details, and update the view model
                    dbServices.getServiceDetails(selectedItem.ServiceId, selectedItem.OccurDate, selectedItem.RecurringServiceId, function (service) {
                        services.vm.set("selectedService", service);

                        saveHistory.close();
                        saveHistory.resetHistory();

                        //watch for input changes
                        saveHistory.saveInputChanges("#serviceDetails");
                    });
                },
                columns: columns,
                columnMenu: true,
                columnReorder: function () {
                    saveGridConfig();
                },
                columnResize: function () {
                    saveGridConfig();
                },
                columnShow: function () {
                    saveGridConfig();
                },
                columnHide: function () {
                    saveGridConfig();
                },
                dataSource: serviceHoldersDataSource,
                filterable: true,
                resizable: true,
                reorderable: true,
                sortable: {
                    mode: "multiple"
                },
                selectable: true,
                scrollable: true
            }).data("kendoGrid");
        };

        dbServices.getServiceTypes(function (serviceTypes) {
            services.serviceTypes = serviceTypes;

            setupServiceTypeDropdown();

            //load the saved column configuration
            getColumnConfig();

            //reload the services
            services.updateServices();
        });

        var startDatePicker = $("#startDatePicker");
        var endDatePicker = $("#endDatePicker");

        services.updateServices = function () {
            var startDate = startDatePicker.data("kendoDatePicker").value();
            var endDate = endDatePicker.data("kendoDatePicker").value();
            var serviceType = $("#serviceTypes").data("kendoDropDownList").value();

            getDataSource(startDate, endDate, serviceType, setupGrid);
        };

        startDatePicker.kendoDatePicker({
            value: moment().subtract('weeks', 2).toDate(),
            min: new Date(1950, 0, 1),
            max: new Date(2049, 11, 31),
            change: services.updateServices
        });
        endDatePicker.kendoDatePicker({
            value: moment().add('weeks', 2).toDate(),
            min: new Date(1950, 0, 1),
            max: new Date(2049, 11, 31),
            change: services.updateServices
        });

        $("#serviceDetails").kendoServiceDetails({
            source: vm.get("selectedService")
        });

        $(window).resize(function () {
            resizeGrid(false);
        });

        resizeGrid(true);
    };

    services.show = function () {
        saveHistory.setCurrentSection({
            page: "Services",
            save: services.save,
            undo: services.undo,
            state: function () {
                return vm.get("selectedService");
            }
        });
    };

    services.exportToCSV = function () {
        var content = tools.toCSV(serviceHoldersDataSource.view(), "Services", true, ['RecurringServiceId', 'ServiceId']);
        var form = $("#csvForm");
        form.find("input[name=content]").val(content);
        form.find("input[name=fileName]").val("services.csv");
        form[0].action = dbServices.ROOT_API_URL + "Helper/Download";
        form.submit();
    };

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;
});