// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

require(["jquery", "db/services", "tools", "db/saveHistory", "widgets/serviceDetails", "lib/jquery.form"], function ($, dbServices, tools, saveHistory) {
    var services = {}, serviceHoldersDataSource, grid, handleChange, serviceTypesComboBox, selectedServiceHolder, vm;

    //region Public
    services.vm = vm = kendo.observable({
        selectedServiceType: function () {
            return serviceTypesComboBox.dataItem();
        }
    });

    services.undo = function (state) {
        //fixes a problem when the state is stored bc it is converted to json and back
        dbServices.convertServiceDates(state);
        vm.set("selectedService", state);
        services.save();
    };

    services.save = function () {
        dbServices.updateService(vm.get("selectedService")).success(function (e) {
            //Now that the service has been updated, change the current row's ServiceId
            //to match the Id in case this was a newly inserted service

            //store the selected row, to reselect it
            var selectedRowId = grid.select().attr("data-uid");

            var selectedService = vm.get("selectedService");
            if (!selectedServiceHolder || !grid) {
                return;
            }

            //update the service id, client name, TODO: and location (address line 1 + 2)
            selectedServiceHolder.set("ServiceId", selectedService.Id);
            selectedServiceHolder.set("ClientName", selectedService.get("Client.Name"));

            //update all the field columns
            var fields = selectedService.Fields;

            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var val = field.get("Value");
                if (field.Type === "OptionsField") {
                    val = "";
                    var options = field.get("Options");
                    for (var o = 0; o < options.length; o++) {
                        var option = field.get("Options[" + o + "]");
                        if (option.get("IsChecked")) {
                            val += option.get("Name") + ", ";
                        }
                    }
                    //remove the trailing comma and space
                    val = val.substr(0, val.length - 2);
                }
                //replace spaces with _
                var columnName = field.Name.split(' ').join('_');
                selectedServiceHolder.set(columnName, val);
            }

            //reselect the row, and prevent change from reloading the service
            handleChange = true;
            grid.select(grid.table.find('tr[data-uid="' + selectedRowId + '"]'));
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
    //endregion

    //region Grid
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

    //save the column configuration
    var saveGridConfig = function () {
        _.delay(function () {
            var columns = grid.columns;
            var serviceColumns = [];
            for (var c in columns) {
                var column = {};
                column.Name = columns[c].field;
                column.Width = columns[c].width;
                column.Order = c;
                if (columns[c].hidden) {
                    column.Hidden = true;
                } else {
                    column.Hidden = false;
                }
                serviceColumns.push(column);
            }

            var id = vm.selectedServiceType().Id;
            dbServices.updateServiceColumns(id, serviceColumns);
        }, 200);
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
            } else if (column.type === "date") {
                if (value.detail === "datetime") {
                    column.template = "#= (" + key + "== null) ? ' ' : moment(" + key + ").format('LLL') #";
                } else if (value.detail === "time") {
                    column.template = "#= (" + key + "== null) ? ' ' : moment(" + key + ").format('LT') #";
                } else if (value.detail === "date") {
                    column.template = "#= (" + key + "== null) ? ' ' : moment(" + key + ").format('LL') #";
                }
            }

            //calculate the width based on number off characters
            var titleLength = column.title.length * 7.5 + 35;
            column.width = titleLength + "px";

            var configColumn = _.find(services.serviceColumns, function (col) {
                return col.Name === column.field;
            });

            //if there is a matching column in configColumns, use it's values
            if (configColumn) {
                //check if "px" is missing. If so, put it back
                if (configColumn.Width.indexOf("px") === -1) {
                    configColumn.Width += "px";
                }
                column.width = configColumn.Width;
                column.hidden = configColumn.Hidden;
                column.order = configColumn.Order;
            }

            columns.push(column);
        });

        //check if there is any difference in the columns in config
        //if so, save the current config
        var storedCols = _.pluck(services.serviceColumns, 'Name');
        var gridCols = _.pluck(columns, 'field');
        if (_.difference(storedCols, gridCols).length > 0 || _.difference(gridCols, storedCols).length > 0) {
            saveGridConfig();
        }

        //reorder the columns
        columns = _.sortBy(columns, function (column) {
            return column.order;
        });

        grid = $("#grid").kendoGrid({
            autoBind: true,
            change: function () {
                //whenever a field is changed, the grid needs to be reselected. handleChange is set to prevent triggering a reload
                if (handleChange) {
                    handleChange = false;
                    return;
                }
                //enable delete button
                $('#services .k-grid-delete').removeAttr("disabled");

                selectedServiceHolder = this.dataItem(this.select());
                if (!selectedServiceHolder) {
                    return;
                }
                //Load the service details, and update the view model
                dbServices.getServiceDetails(selectedServiceHolder.get("ServiceId"), selectedServiceHolder.get("OccurDate"), selectedServiceHolder.get("RecurringServiceId"), function (service) {
                    services.vm.set("selectedService", service);

                    saveHistory.close();
                    saveHistory.resetHistory();
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
    //endregion

    services.initialize = function () {
        //save changes whenever the selected service has a change
        vm.bind("change", function (e) {
            if (e.field.indexOf("selectedService.") > -1) {
                console.log(e.field);
                saveHistory.save();
            }
        });

        dbServices.getServiceTypes(function (serviceTypes) {
            services.serviceTypes = serviceTypes;

            serviceTypesComboBox = $("#serviceTypes").kendoDropDownList({
                dataTextField: "Name",
                dataValueField: "Id",
                dataSource: services.serviceTypes,
                change: function () {
                    //disable the delete button
                    $('#services .k-grid-delete').attr("disabled", "disabled");

                    //reload the services whenever the service type changes
                    if (services.serviceColumns !== null) {
                        services.updateServices();
                    }
                }
            }).data("kendoDropDownList");

            //load the saved column configuration
            dbServices.getServiceColumns(function (columns) {
                var id = vm.selectedServiceType().Id;
                services.serviceColumns = columns[id];

                //load the services initially
                services.updateServices();
            });
        });

        var startDatePicker = $("#startDatePicker");
        var endDatePicker = $("#endDatePicker");

        startDatePicker.kendoDatePicker({
            value: moment().toDate(),
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

        $("#serviceDetails").kendoServiceDetails();

        services.updateServices = function () {
            var startDate = startDatePicker.data("kendoDatePicker").value();
            var endDate = endDatePicker.data("kendoDatePicker").value();
            var serviceTypeId = vm.selectedServiceType().Id;

            getDataSource(startDate, endDate, serviceTypeId, setupGrid);
        };

        $("#services .k-grid-delete").on("click", function () {
            var answer = confirm("Are you sure you want to delete the selected service?");
            if (answer) {
                grid.dataSource.remove(selectedServiceHolder);
                dbServices.deleteService(vm.get("selectedService"));
            }
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

    //set services to a global function, so the functions are accessible from the HTML element
    window.services = services;
});