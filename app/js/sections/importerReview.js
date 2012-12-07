'use strict';

define(["jquery", "underscore", "sections/importerUpload", "sections/importerSelect", "db/services", "tools/generalTools", "tools/dateTools", "widgets/location", "widgets/contactInfo", "widgets/repeat",
    "ui/popup", "widgets/selectBox"], function ($, _, importerUpload, importerSelect, dbServices, generalTools, dateTools) {
    var importerReview = {}, dataSource, grid, clients = {}, locations = {}, contactInfoSets = {}, columns = [
        {   field: "Client",
//            template: "<div class='Client'>#= Client #</div>",
            editor: function (container, options) {
                $('<div class="styled-select"></div>').appendTo(container)
                    .selectBox({data: [
                        {Name: "BK"},
                        {Name: "Subway"}
                    ], dataTextField: "Name"});
            }
        },
        {
            field: "Location",
            template: "<div class='Location'>#= generalTools.getLocationDisplayString(Location) #</div>"//,
//            editor: function (container, options) {
//                // create a KendoUI AutoComplete widget as column editor
//                $('<div class="locationWidget"></div>').appendTo(container).location();
//            }
        },
        {
            field: "ContactInfo",
            title: "Contact Info",
            template: "<div class='ContactInfo'>#= generalTools.getContactInfoDisplayString(ContactInfo) #</div>"
        },
        {
            field: "Repeat",
            template: "<div class='Repeat'>#= importerReview.getRepeatString(Repeat, id) #</div>",
            //set the status as the class name so it can be colored red if there's an error
            attributes: {
                "class": "status#= RepeatStatus #"
            }
        }
    ];

    var getImportedRepeatData = function (headerIndex) {
        var indexes = [], index = 0, repeatString;
        //find the indexes of the repeat columns to reference for displaying error text
        _.find(importerSelect.dataToValidate[0], function (name) {
            if (name === "Start Date" || name === "Frequency" || name === "Repeat Every" || name === "Frequency Detail" || name === "End Date") {
                indexes.push(index);
            }
            index++;
        });

        //get a reference to the original uploaded data
        var originalRow = importerSelect.dataToValidate[parseInt(headerIndex) + 1];
        //sort indexes in ascending order
        indexes = indexes.sort(function (a, b) {
            return a - b;
        });

        repeatString = "";

        //iterate through each repeat column that was selected and the values(comma separated) that were passed
        for (var k in indexes) {
            var string = originalRow[indexes[k]];
            repeatString += string ? string + ", " : "";
        }
        //remove the trailing ", "
        return repeatString.substring(0, repeatString.length - 2);
    };

    //create a display string from a repeat object
    importerReview.getRepeatString = function (repeat, index) {
        //check if there is a repeat
        if (!repeat) {
            return getImportedRepeatData(index);
        }
        //use the frequency int to get the frequency name(ex. 2 -> "Day")
        var frequencyName = generalTools.repeatFrequencies[repeat.Frequency];

        //check if frequency if singular
        if (repeat.Frequency >= 2 && repeat.RepeatEveryTimes === 1) {
            //ex. "weekly"
            if (repeat.Frequency === 2) {
                frequencyName = "Daily";
            } else {
                frequencyName = frequencyName + "ly";
            }
            //if frequency is multiple
        } else if (repeat.Frequency > 1 && repeat.RepeatEveryTimes > 1) {
            //ex. "Every 3 months"
            frequencyName = "Every " + repeat.RepeatEveryTimes.toString() + " " + frequencyName.charAt(0).toLowerCase() + frequencyName.slice(1) + "s ";
        } else {
            return getImportedRepeatData(index);
        }

        var frequencyDetail = "";
        var weeklyDetail = repeat.FrequencyDetailAsWeeklyFrequencyDetail;
        var startDate = dateTools.parseDate(repeat.StartDate);

        //if monthly
        if (repeat.FrequencyDetailAsMonthlyFrequencyDetail) {
            frequencyDetail = generalTools.getFrequencyDetailString(repeat.FrequencyDetailInt, startDate, false);
            //if weekly
        } else if (weeklyDetail && weeklyDetail[0]) {
            //get the list of day abbreviation strings, separated by commas
            for (var d in weeklyDetail) {
                if (parseInt(d) || d === "0") {
                    frequencyDetail = frequencyDetail += dateTools.days[weeklyDetail[d]].substring(0, 3) + ", ";
                }
            }
            //remove trailing ", "
            var stringToRemove = /,\s$/;
            frequencyDetail = "on " + frequencyDetail.replace(stringToRemove, "");
        }

        return frequencyName + " " + frequencyDetail;
    };

    /**
     * @param data
     * @return {Array} newData
     */
    var formatDataForGrid = function (data) {
        var newData = [], newRow, row;

        for (var i in data) {
            var location = {}, contactInfo = [];
            row = data[i];
            newRow = {};

            //id to use for editing
            newRow["id"] = i;
            //client name string
            newRow["Client"] = clients[row.ClientSuggestions[0]] ? clients[row.ClientSuggestions[0]].Name : "";

            //location object
            location = locations[row.LocationSuggestions[0]];

            //create the list of contact info sets from the suggestions
            for (var j in row.ContactInfoSuggestions) {
                contactInfo.push(contactInfoSets[row.ContactInfoSuggestions[j]]);
            }

            newRow["Location"] = location;
            newRow["ContactInfo"] = contactInfo;
            newRow["Repeat"] = row.Repeats[0];

            //repeat status
            if (row.Repeats[0]) {
                newRow["RepeatStatus"] = row.Repeats[0].StatusInt;
            } else {
                newRow["RepeatStatus"] = "";
            }

            newData.push(newRow);
        }
        return newData;
    };

    /**
     * @param data
     * @return {Array} newData
     */
    var formatGridDataForSubmission = function (data) {
    };

    var submitData = function (data) {
        var dataToSubmit = formatGridDataForSubmission(data);

        //dbServices.submitData(dataToSubmit, importerSelect.headers, importerUpload.selectedService);
    };

//    var createColumns = function (data) {
//        for (var i in data) {
//            var column, template;
//            if (name === "Location") {
//                template = "# #";
//            } else {
//                template = "# #";
//            }
//            //calculate the width of the title
//            var width = name.length * 6.5 + 35;
//            //set the width to 100 if it's less than 100
//            if (width < 100) {
//                width = 100;
//            }
//            column = {
//                field: name.replace(/s+/g,''), //ex. "ClientName"
//                title: name, //ex. "Client Name"
//                template: template,
//                width: width + "px"
//            };
//            //add the column to the list of columns
//            columns.push(column);
//        }
//    };

    //region Grid Methods
    //(called on show and on sort)
    var dataBound = function () {
        var reviewElement = $("#importerReview");

        var contactInfoWidget = reviewElement.find(".ContactInfo");
        var locationWidget = reviewElement.find(".Location");
        var repeatWidget = reviewElement.find(".Repeat");

        contactInfoWidget.popup({contents: $("<div class='contactInfoWidget'></div>")});
        locationWidget.popup({contents: $("<div class='locationWidget'></div>")});
        repeatWidget.popup({contents: $("<div class='repeatWidget'></div>")});

        /**
         * Updates the row/cell index that was clicked on
         * @param e
         * @return Selected data row
         */
        var updateEditIndexes = function (e) {
            //get the row/cell index that was clicked on
            importerReview.editRowIndex = e.currentTarget.parentElement.parentElement.rowIndex;
            importerReview.editCellIndex = e.currentTarget.parentElement.cellIndex;

            return dataSource.view()[importerReview.editRowIndex];
        };

        //create the correct widget inside each popup
        contactInfoWidget.on("click", function (e) {
            //initialize the contact info widget with the data from the grid dataSource
            var data = updateEditIndexes(e).ContactInfo;
            $("#popupContent").find(".contactInfoWidget").contactInfo({contacts: data});
        });

        locationWidget.on("click", function (e) {
            //initialize the location widget with the data from the grid dataSource
            var data = updateEditIndexes(e).Location;
            $("#popupContent").find(".locationWidget").location({location: data});
        });

        repeatWidget.on("click", function (e) {
            //initialize the repeat widget with the data from the grid dataSource
            var data = updateEditIndexes(e).Repeat;
            $("#popupContent").find(".repeatWidget").repeat({repeat: data});
        });
    };

    var setupGrid = function () {
        var data = formatDataForGrid(importerSelect.gridData.RowSuggestions);

        dataSource = new kendo.data.DataSource({
            data: data,
            batch: true,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: { editable: false, nullable: true },
                        Client: {validation: { required: true }},
                        Location: { editable: false },
                        ContactInfo: { editable: false },
                        Repeat: { editable: false }
                    }
                }
            }
        });

        grid = $("#importerReview").find(".grid").kendoGrid({
            columns: columns,
            editable: true,
            dataBound: dataBound,
            dataSource: dataSource,
            resizable: true,
            scrollable: true,
            sortable: true
        }).data("kendoGrid");
    };

    var removeGrid = function () {
        //clear the grid element and the dataSource
        $("#importerReview").find(".grid").empty();
        dataSource = "";
    };

    //resize the grid based on the current window's height
    var resizeGrid = function () {
        var extraMargin = 240;
        var windowHeight = $(window).height();
        var contentHeight = windowHeight - extraMargin;
        $("#importerReview").find('.k-grid-content').css("maxHeight", contentHeight + 'px');
    };
    //endregion

    importerReview.initialize = function () {
        $(window).resize(function () {
            resizeGrid();
        });

        //import button click
        $("#importBtn").on("click", function () {
            submitData();
        });
    };

    importerReview.show = function () {
        //check if importerUpload exists
        //if not, then no data has been loaded
        //TODO: ask if sure to reload page?
        if (!importerUpload.uploadedData) {
            //redirect to last page
            window.viewImporterSelect();
            return;
        }

        //create arrays for clients, locations, and contact info that match each id to the object
        var entity;
        for (var i in importerSelect.gridData.Clients) {
            entity = importerSelect.gridData.Clients[i];
            clients[entity.Id] = entity;
        }
        for (var j in importerSelect.gridData.Locations) {
            entity = importerSelect.gridData.Locations[j];
            locations[entity.Id] = entity;
        }
        for (var k in importerSelect.gridData.ContactInfoSet) {
            entity = importerSelect.gridData.ContactInfoSet[k];
            contactInfoSets[entity.Id] = entity;
        }

        //remove and re-create the grid
        if (grid) {
            removeGrid();
        }
        setupGrid();
        resizeGrid();

        //on popup close event
        $(document).on('popup.closing', function (e) {
            // get a reference to the grid
            var grid = $("#importerReview").find(".grid").data("kendoGrid");
            var dataItem = grid.dataSource.get(importerReview.editRowIndex);

            var locationWidget = $(e.target).find(".locationWidget").data("location");
            var repeatWidget = $(e.target).find(".repeatWidget").data("repeat");
            var contactInfoWidget = $(e.target).find(".contactInfoWidget").data("contactInfo");

            //check which widget is active
            //update the dataSource with the new data
            //remove the widget
            if (locationWidget) {
                dataItem.set("Location", locationWidget.options.location);
                locationWidget.removeWidget();
            } else if (repeatWidget) {
                dataItem.set("Repeat", repeatWidget.options.repeat);
                repeatWidget.removeWidget();
            } else if (contactInfoWidget) {
                dataItem.set("ContactInfo", contactInfoWidget.options.contacts);
                contactInfoWidget.removeWidget();
            }

            //force refresh cell text
            var selectedCell = grid.tbody.find('tr:eq(' + importerReview.editRowIndex + ') td:eq(' + importerReview.editCellIndex + ')');
            var column = grid.columns[importerReview.editCellIndex];
            grid._displayCell(selectedCell, column, dataItem);

            //TODO add back popup listener, displayCell removes it (waiting on code cleanup)
        });
    };

    window.importerReview = importerReview;

    return importerReview;
});