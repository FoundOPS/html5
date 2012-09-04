// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold tools for the grid. This will be split up as it grows and the divisions become obvious.
 */

"use strict";

define(['db/session', 'db/services', "hasher"], function (session, dbServices, hasher) {
    var kendoTools = {};

    //region Column Configuration

    /**
     * Follow any column reordering, resizing, showing, and hiding.
     * Then store the user's configuration to the database.
     * @param grid
     * @param id A unique Id for the column configuration
     */
    kendoTools.storeConfiguration = function (grid, id) {
        var saveConfiguration = function () {
            kendoTools._saveConfigurations(grid.columns, id);
        };

        //save the column configuration when it changes
        grid.bind("columnReorder", saveConfiguration);
        grid.bind("columnResize", saveConfiguration);
        grid.bind("columnShow", saveConfiguration);
        grid.bind("columnHide", saveConfiguration);
    };

    //save the configurations to the DB
    kendoTools._saveConfigurations = _.debounce(function (gridColumns, id) {
        var columnConfiguration = {Id: id, Columns: []};
        var order = 0;
        _.each(gridColumns, function (gridColumn) {
            var storedColumn = {};
            storedColumn.Name = gridColumn.field;
            storedColumn.Width = gridColumn.width;
            storedColumn.Order = order;
            order++;
            storedColumn.Hidden = gridColumn.hidden;
            columnConfiguration.Columns.push(storedColumn);
        });

        var newConfigurations = _.reject(kendoTools._columnConfigurations, function (config) {
            return config.Id === id;
        });
        newConfigurations.push(columnConfiguration);
        kendoTools._columnConfigurations = newConfigurations;

        dbServices.updateColumnConfigurations(newConfigurations);
    }, 300);

    /**
     * Configure the columns from the user's stored column configurations
     * @param gridColumns The grid columns to configure
     * @param id The Id for getting the column configuration
     * @returns The properly configured columns
     */
    kendoTools.configureColumns = function (gridColumns, id) {
        var configuration = _.find(kendoTools._columnConfigurations, function (configuration) {
            return configuration.Id === id;
        });

        var storedColumns = [];
        if (configuration) {
            storedColumns = configuration.Columns;
        }

        //go through each column and try to find a matching stored column
        //if there is one, use it's values
        _.each(gridColumns, function (column) {
            var storedColumn = _.find(storedColumns, function (col) {
                return col.Name === column.field;
            });

            if (storedColumn) {
                //check if "px" is missing. If so, put it back
                //check if "px" is missing. If so, put it back
                if (storedColumn.Width.indexOf("px") === -1) {
                    storedColumn.Width += "px";
                }
                column.width = storedColumn.Width;
                column.hidden = storedColumn.Hidden;
                column.order = storedColumn.Order;
            }
        });

        //check if there is any difference from the columns in config
        //if so, save the current config
        var storedCols = _.pluck(storedColumns, 'Name');
        var gridCols = _.pluck(gridColumns, 'field');
        if (_.difference(storedCols, gridCols).length > 0 || _.difference(gridCols, storedCols).length > 0) {
            kendoTools._saveConfigurations(gridColumns, id);
        }

        //reorder the columns
        gridColumns = _.sortBy(gridColumns, function (column) {
            if ("order" in column) {
                return parseInt(column.order);
            }
            return 100;
        });

        return gridColumns;
    };

    //load the users column configurations whenever the role changes
    session.followRole(function () {
        dbServices.getColumnConfigurations(function (configurations) {
            kendoTools._columnConfigurations = configurations;
        });
    });

    //endregion

    /**
     * Converts a datasource's view to CSV and saves it using data URI.
     * Uses moment.js for date parsing (you can change this if you would like)
     * @param {Array.<Object>} data The data to convert.
     * @param {boolean} humanize If true, it will humanize the column header names.
     * It will replace _ with a space and split CamelCase naming to have a space in between names -> Camel Case
     * @param {Array.<String>} ignore Columns to ignore.
     * @returns {string} The csv string.
     */
    kendoTools.toCSV = function (data, fileName, humanize, ignore) {
        var csv = '';
        if (!ignore) {
            ignore = [];
        }

        //ignore added datasource properties
        ignore = _.union(ignore, ["_events", "idField", "_defaultId", "constructor", "init", "get",
            "_set", "wrap", "bind", "one", "first", "trigger",
            "unbind", "uid", "dirty", "id", "parent" ]);

        //add the header row
        if (_.any(data)) {
            var firstRow = _.first(data);

            var firstValue = true;
            _.each(firstRow, function (value, key) {
                //exclude ignored properties
                if (_.include(ignore, key)) {
                    return;
                }

                if (humanize) {
                    key = key.split('_').join(' ').replace(/([A-Z])/g, ' $1');
                }

                key = key.replace(/"/g, '""');

                key = $.trim(key);

                if (!firstValue) {
                    csv += ",";
                }
                csv += '"' + key + '"';

                firstValue = false;
            });
            csv += "\n";
        }

        //add each row of data
        _.each(data, function (row) {
            firstValue = true;
            _.each(row, function (value, key) {
                //exclude ignored properties
                if (_.include(ignore, key)) {
                    return;
                }

                if (value === null) {
                    value = "";
                } else if (value instanceof Date) {
                    value = moment(value).format("MM/D/YYYY");
                } else if (value !== undefined) {
                    value = value.toString();
                } else {
                    value = "";
                }

                value = value.replace(/"/g, '""');

                if (!firstValue) {
                    csv += ",";
                }
                csv += '"' + value + '"';

                firstValue = false;
            });
            csv += "\n";
        });

        return csv;
    };

    /**
     * Adds a filtered event to the dataSource
     * @param dataSource
     */
    kendoTools.addFilterEvent = function (dataSource) {
        // Save the reference to the original filter function.
        dataSource.originalFilter = dataSource.filter;

        var filtered = _.debounce(function (args) {
            dataSource.trigger("filtered", args);
        }, 200);

        // Replace the original filter function.
        dataSource.filter = function () {
            // Call the original filter function.
            var filter = dataSource.originalFilter.apply(dataSource, arguments);

            // If a column is about to be filtered, then raise a new "filtered" event.
            if (arguments.length > 0) {
                filtered(arguments);
            }

            return filter;
        };
    };

    /*
     * Sync the url parameters and the dataSource's filters
     * @dataSource The dataSource to sync the filters with
     * @param parameters If this is set: adjust the filters to the url parameters
     *                   If it is null: adjust the url parameters to the filters
     * @processFilters (Optional) Process and adjust the filters after they are synced. This is for forcing validation
     */
    kendoTools.syncFilters = function (dataSource, parameters, processFilters) {
        if (!dataSource) {
            return;
        }

        if (dataSource._handleFilterSync) {
            dataSource._handleFilterSync = false;
            return;
        }

        var filterSet;
        if (parameters) {
            //set the filterSet to the url parameters
            filterSet = [];
            _.each(parameters, function (value, parameter) {
                //remove the number
                parameter = parameter.replace(/[0-9]/g, '');

                //add a filter for every possible parameter
                var filter = value.split("$");
                var formattedValue;
                if (filter[2] === "d") {
                    formattedValue = new Date(filter[1]);
                } else if (filter[2] === "n") {
                    formattedValue = parseFloat(filter[1]);
                } else {
                    formattedValue = filter[1];
                }

                filterSet.push({field: parameter, operator: filter[0], value: formattedValue});
            });
        } else {
            filterSet = dataSource.filter();
            if (filterSet) {
                filterSet = filterSet.filters;
            }
        }

        //process the filters
        if (processFilters) {
            var newFilterSet = processFilters(filterSet);
            if (newFilterSet) {
                dataSource.filter(newFilterSet);
                return;
            }
        }

        //adjust the filters accordingly
        if (parameters) {
            dataSource._handleFilterSync = true;
            dataSource.filter(filterSet);
        }
        //adjust the url parameters to the filters
        else {
            dataSource._handleFilterSync = true;
            var i = 0;
            parameters = _.map(filterSet, function (filter) {
                var type;
                var val = filter.value;
                if (val instanceof Date) {
                    type = "d";
                    val = val.toDateString();
                } else if (typeof val === "number") {
                    type = "n";
                } else {
                    type = "s";
                }
                i++; //add a new number to each parameter to avoid issues when there are duplicates
                return i + filter.field + "=" + filter.operator + "$" + val + "$" + type;
            });

            var query = parameters.join("&");
            hasher.setHash('#view/services.html?' + query);
        }
    };

    return kendoTools;
});