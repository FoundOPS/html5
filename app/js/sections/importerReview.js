'use strict';

define(["jquery", "underscore", "sections/importerUpload", "sections/importerSelect", "db/services", "tools/generalTools", "widgets/location", "widgets/contactInfo", "widgets/repeat",
    "ui/popup", "widgets/selectBox"], function ($, _, importerUpload, importerSelect, dbServices, generalTools) {
    var importerReview = {}, dataSource, grid, clients = {}, locations = {}, contactInfoSets = {}, columns = [
        "Client"//,
//            template: "<div class='Client'>#= Client #</div>",
//            editor: function (container, options) {
//                $('<div class="styled-select"></div>').appendTo(container)
//                    .selectBox({data: [{Name: "BK"}, {Name: "Subway"}], dataTextField: "Name"});
//            }
        ,
        {
            field: "Location",
            template: "<div class='Location'>#= Location #</div>"//,
//            editor: function (container, options) {
//                // create a KendoUI AutoComplete widget as column editor
//                $('<div class="locationWidget"></div>').appendTo(container).location();
//            }
        },
        {
            field: "ContactInfo",
            title: "Contact Info",
            template: "<div class='ContactInfo'>#= ContactInfo #</div>"
        },
        {
            field: "Repeat",
            template: "<div class='Repeat'>#= Repeat #</div>",
            attributes: {
                "class": "status#= RepeatStatus #"
            }
        }
    ];

    /**
     * @param data
     * @return {Array} newData
     */
    var formatDataForGrid = function (data) {
        var newData = [], newRow, row;

        //find the indexes of the repeat columns to reference for errors
        var startDateIndex = "", frequencyIndex = "", repeatEveryIndex = "", frequencyDetailIndex = "", endDateIndex = "", index = 0;
        _.find(importerSelect.dataToValidate[0], function(name){
            if (name === "Start Date") {
                startDateIndex = index;
            } else if (name === "Frequency") {
                frequencyIndex = index;
            } else if (name === "Repeat Every") {
                repeatEveryIndex = index;
            } else if (name === "Frequency Detail") {
                frequencyDetailIndex = index;
            } else if (name === "End Date") {
                endDateIndex = index;
            }
            index ++;
        });

        for (var i in data) {
            var location = {}, contactInfo = [];
            row = data[i];
            newRow = [];

            newRow["id"] = i;
            newRow["Client"] = clients[row.ClientSuggestions[0]]? clients[row.ClientSuggestions[0]].Name : "";

            location = locations[row.LocationSuggestions[0]];

            //create the list of contact info sets from the suggestions
            for (var j in row.ContactInfoSuggestions) {
                contactInfo.push(contactInfoSets[row.ContactInfoSuggestions[j]]);
            }

            newRow["LocationData"] = location;
            newRow["Location"] = generalTools.getLocationDisplayString(location);
            newRow["ContactInfoData"] = contactInfo;
            newRow["ContactInfo"] = generalTools.getContactInfoDisplayString(contactInfo);
            newRow["RepeatData"] = row.Repeats[0];
            var repeatString = generalTools.getRepeatString(row.Repeats[0]);
            if (repeatString !== "") {
                newRow["Repeat"] = repeatString;
            } else {
                var originalRow = importerSelect.dataToValidate[parseInt(i) + 1];
                newRow["Repeat"] = originalRow[frequencyIndex] + ", " + originalRow[frequencyDetailIndex] + ", " +
                    originalRow[repeatEveryIndex] + ", " + originalRow[startDateIndex] + ", " + originalRow[endDateIndex];
            }

            newRow["RepeatStatus"] = row.Repeats[0].StatusInt;

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
        //add popups to the location, contactInfo, and repeat cells
        var contactInfoPopup = reviewElement.find(".ContactInfo");
        contactInfoPopup.popup({contents: $("<div class='contactInfoWidget'></div>")});

        var locationPopup = reviewElement.find(".Location");
        locationPopup.popup({contents: $("<div class='locationWidget'></div>")});

        var repeatPopup = reviewElement.find(".Repeat");
        repeatPopup.popup({contents: $("<div class='repeatWidget'></div>")});

        //create the correct widget inside the popup
        contactInfoPopup.on("click", function (e) {
            importerReview.editIndex = e.currentTarget.parentElement.parentElement.rowIndex;
            importerReview.editedCell = e.currentTarget;
            var contacts = dataSource._view[importerReview.editIndex].ContactInfoData;
            var widget = $("#popupContent").find(".contactInfoWidget");
            widget.contactInfo({contacts: contacts});
            importerReview.contactInfoWidget = widget.data("contactInfo");
        });

        locationPopup.on("click", function (e) {
            var popupElement = $("#popupContent");
            importerReview.editIndex = e.currentTarget.parentElement.parentElement.rowIndex;
            var location = dataSource._view[importerReview.editIndex].LocationData;
            popupElement.find(".locationWidget").location();
            importerReview.locationWidget = popupElement.find(".locationWidget").data("location");
            if (location) {
                importerReview.locationWidget.renderMap(location, true);
            } else {
                importerReview.locationWidget.renderMap(location, false);
            }

        });

        repeatPopup.on("click", function (e) {
            importerReview.editIndex = e.currentTarget.parentElement.parentElement.rowIndex;
            var repeat = dataSource._view[importerReview.editIndex].RepeatData;
            $("#popupContent").find(".repeatWidget").repeat({repeat: repeat});
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
                        Location: {editable: false },
                        ContactInfo: {editable: false },
                        Repeat: {editable: false }
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

        //import on button click
        $("#importBtn").on("click", function () {
            submitData();
        });
    };

    importerReview.show = function () {
        //check if importerUpload exists
        //if not, then no data has been loaded
        //TODO:
        if (!importerUpload.uploadedData) {
            //redirect to last page
            window.viewImporterSelect();
            return;
        }

        //create arrays for clients, locations, and repeats that match the guid with the object
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

        if (grid) {
            removeGrid();
        }
        setupGrid();
        resizeGrid();

        //on popup close event
        $(document).on('popup.closing', function (e) {
            // get a reference to the grid widget
            var grid = $("#importerReview").find(".grid").data("kendoGrid");
            var row = grid.dataSource._data[importerReview.editIndex];
            if ($(e.target).find(".locationWidget").data("location")) {
                row.LocationData = importerReview.locationWidget.currentLocation;

                //remove the location widget
                $(e.target).find(".locationWidget").data("location").removeWidget();
            } else if ($(e.target).find(".repeatWidget").data("repeat")) {
                var repeat = $(e.target).find(".repeatWidget").data("repeat");
                row.RepeatData = repeat.options.repeat;
                //remove the repeat widget
                repeat.removeWidget();
            } else if ($(e.target).find(".contactInfoWidget").data("contactInfo")) {
                //save contactInfo widget data to the grid dataSource
                row.ContactInfoData = importerReview.contactInfoWidget.contacts;
                //update the grid display string
                //importerReview.editedCell.innerHtml = generalTools.getContactInfoDisplayString(importerReview.contactInfoWidget.contacts);
//                grid.dataSource = new kendo.data.DataSource({
//                    data: grid.dataSource._data
//                });
//                grid.dataSource.read();
//                grid.refresh();
                //remove the contactInfo widget
                $(e.target).find(".contactInfoWidget").data("contactInfo").removeWidget();
            }
        });
    };

    window.importerReview = importerReview;

    return importerReview;
});