// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold tools for the grid. This will be split up as it grows and the divisions become obvious.
 */

"use strict";

define(['db/session', 'db/services'], function (session, dbServices) {
    var gridTools = {};

    //region Column Configuration

    /**
     * Follow any column reordering, resizing, showing, and hiding.
     * Then store the user's configuration to the database.
     * @param grid
     * @param id A unique Id for the column configuration
     */
    gridTools.storeConfiguration = function (grid, id) {
        var saveConfiguration = function () {
            gridTools._saveConfigurations(grid.columns, id);
        };

        //save the column configuration when it changes
        grid.bind("columnReorder", saveConfiguration);
        grid.bind("columnResize", saveConfiguration);
        grid.bind("columnShow", saveConfiguration);
        grid.bind("columnHide", saveConfiguration);
    };

    //save the configurations to the DB
    gridTools._saveConfigurations = _.debounce(function (gridColumns, id) {
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

        var newConfigurations = _.reject(gridTools._columnConfigurations, function (config) {
            return config.Id === id;
        });
        newConfigurations.push(columnConfiguration);
        gridTools._columnConfigurations = newConfigurations;

        dbServices.updateColumnConfigurations(newConfigurations);
    }, 300);

    /**
     * Configure the columns from the user's stored column configurations
     * @param gridColumns The grid columns to configure
     * @param id The Id for getting the column configuration
     * @returns The properly configured columns
     */
    gridTools.configureColumns = function (gridColumns, id) {
        var configuration = _.find(gridTools._columnConfigurations, function (configuration) {
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
            gridTools._saveConfigurations(gridColumns, id);
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
            gridTools._columnConfigurations = configurations;
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
    gridTools.toCSV = function (data, fileName, humanize, ignore) {
        var csv = '';
        if (!ignore) {
            ignore = [];
        }

        //ignore added datasource properties
        ignore = _.union(ignore, ["_events", "idField", "_defaultId", "constructor", "init", "get",
            "_set", "wrap", "bind", "one", "first", "trigger",
            "unbind", "uid", "dirty", "id", "parent" ]);

        //add the header row
        if (data.length > 0) {
            for (var col in data[0]) {
                //do not include inherited properties
                if (!data[0].hasOwnProperty(col) || _.include(ignore, col)) {
                    continue;
                }

                if (humanize) {
                    col = col.split('_').join(' ').replace(/([A-Z])/g, ' $1');
                }

                col = col.replace(/"/g, '""');
                csv += '"' + col + '"';
                if (col != data[0].length - 1) {
                    csv += ",";
                }
            }
            csv += "\n";
        }

        //add each row of data
        for (var row in data) {
            for (var col in data[row]) {
                //do not include inherited properties
                if (!data[row].hasOwnProperty(col) || _.include(ignore, col)) {
                    continue;
                }

                var value = data[row][col];
                if (value === null) {
                    value = "";
                } else if (value instanceof Date) {
                    value = moment(value).format("MM/D/YYYY");
                } else {
                    value = value.toString();
                }

                value = value.replace(/"/g, '""');
                csv += '"' + value + '"';
                if (col !== data[row].length - 1) {
                    csv += ",";
                }
            }
            csv += "\n";
        }

        return csv;
    };

    return gridTools;
});