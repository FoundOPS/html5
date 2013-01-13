// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold tools for the grid. This will be split up as it grows and the divisions become obvious.
 */

"use strict";

define(['db/session', 'db/services', 'tools/parameters'], function (session, dbServices, parameters) {
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

        dbServices.columnConfigurations.update({body: newConfigurations});
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
        dbServices.columnConfigurations.read().done(function (configurations) {
            kendoTools._columnConfigurations = configurations;
        });
    });

    //endregion

    //region Grid Tools

    /**
     * Gets the selected row
     * @return {object}
     */
    kendoTools.getSelectedRow = function (grid) {
        return grid.tbody.find(".k-state-selected");
    };

    /**
     * Converts a datasource's view to CSV and saves it using data URI.
     * Uses moment.js for date parsing (you can change this if you would like)
     * @param {Array.<Object>} data The data to convert.
     * @param {string} fileName
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

    //endregion

    //region Hash & Filters

    var filterMatchRegEx = /^f_(lt|lte|eq|neq|gt|gte|startswith|endswith|contains|doesnotcontain)_.*$/;
    //pass a query parameter and this will return the filter's name
    //or null if it is not a filter
    var filterName = function (parameter) {
        //match f_operator_name format
        var matches = parameter.match(filterMatchRegEx);
        if (matches === null) {
            return null;
        }
        return parameter.substring(3 + matches[1].length);
    };
    //pass a query parameter and this will return the filter operator
    //or null if it is not a filter
    var filterOperator = function (parameter) {
        var matches = parameter.match(filterMatchRegEx);
        if (matches === null) {
            return null;
        }
        return matches[1];
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
        }, 250); //prevents calls too often and gives enough time for filters to set on datasource

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
     * Set the url parameters based on the dataSource's filters
     * Filter url parameters will be in this format f_operator_name Ex: f_lte_OccurDate
     * @dataSource The dataSource to sync the filters with
     */
    kendoTools.updateHashToFilters = function (section, dataSource) {
        var filter = dataSource.filter();
        if (!filter || !filter.filters) {
            return;
        }

        var filterSet = filter.filters;

        var currentParams = parameters.get();

        //add the parameters that are not filter parameters to the query
        var otherKeys = _.filter(_.keys(currentParams), function (name) {
            return filterName(name) === null;
        });
        var query = _.pick(currentParams, otherKeys);

        //add the filter parameters to the query
        _.each(filterSet, function (filter) {
            //normalize
            if (filter.filters) {
                filter = filter.filters;
            }
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

            //prefix the parameter key with f_ to identify this as a filter parameter
            //prefix it with the operator to avoid issues when there are duplicates
            var key = 'f_' + filter.operator + '_' + filter.field;
            query[key] = val + "$" + type;
        });

        parameters.set({params: query, replace: true, section: section});
    };

    /*
     * Set the dataSource's filters to the url parameters (if they are different)
     * @param dataSource The dataSource to adjust
     * @param parameters The parameters to build filters from
     * @param [processFilters] (Optional) Process and adjust the filters before setting them. This is for forcing validation
     */
    kendoTools.updateFiltersToHash = function (dataSource, parameters, processFilters) {
        if (!dataSource) {
            return;
        }

        var filterSet = [];
        //set the filterSet to the url parameters
        _.each(parameters, function (value, parameter) {
            var name = filterName(parameter);

            //if it is not a filter parameter. ignore it
            if (name === null) {
                return;
            }

            //add a filter for every possible parameter
            var filter = value.split("$");
            var formattedValue;
            if (filter[1] === "d") {
                formattedValue = new Date(filter[0]);
            } else if (filter[1] === "n") {
                formattedValue = parseFloat(filter[0]);
            } else {
                formattedValue = filter[0];
            }

            var operator = filterOperator(parameter);
            filterSet.push({field: name, operator: operator, value: formattedValue});
        });

        //process the filters
        if (processFilters) {
            var newFilterSet = processFilters(filterSet);
            if (newFilterSet) {
                dataSource.filter(newFilterSet);
                return;
            }
        }

        //check if they are different
        var existing = dataSource.filter();
        if (!existing) {
            existing = {};
        }
        if (existing.filters) {
            existing = existing.filters;
        }

        //order the fields the same so isEqual works properly
        var orderFields = function (val) {
            return val.field + val.operator + val.value;
        };
        filterSet = _.sortBy(filterSet, orderFields);
        existing = _.sortBy(existing, orderFields);

        var same = _.isEqual(filterSet, existing);

        //then adjust the filters accordingly
        if (!same) {
            dataSource.filter(filterSet);
        }
    };
    kendoTools.disableScroll = function (view) {
        $(view + " .km-scroll-container").children("*").unwrap();
        $(view + " .km-scroll-header").remove();
        $(view + " .km-scroll-container").remove();
        $(view + " .km-touch-scrollbar").remove();
    };
    kendoTools.re_enableScroll = function (view) {
        $(view).data("kendoMobileView").content.kendoMobileScroller();
    };

    //endregion

    return kendoTools;
});