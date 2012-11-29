'use strict';

define(["jquery", "underscore", "sections/importerUpload", "sections/importerSelect", "db/services", "tools/generalTools", "widgets/location", "widgets/contactInfo", "widgets/repeat",
    "ui/popup", "widgets/selectBox"], function ($, _, importerUpload, importerSelect, dbServices, generalTools) {
    var importerReview = {}, dataSource, grid, clients = {}, locations = {}, contactInfoSets = {}, columns = [
        {
            field: "Client",
            template: "<div class='Client'>#= Client #</div>"//,
//            editor: function (container, options) {
//                $('<div class="styled-select"></div>').appendTo(container)
//                    .selectBox({data: [{Name: "BK"}, {Name: "Subway"}], dataTextField: "Name"});
//            }
        },
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
            template: "<div class='Repeat'>#= Repeat #</div>"
        }
    ];

    /**
     * @param data
     * @return {Array} newData
     */
    var formatDataForGrid = function (data) {
        var newData = [], newRow, row;
        for (var i in data) {
            var location = {}, contactInfo = [];
            row = data[i];
            newRow = [];

            //newRow["ClientId"] = row.ClientSuggestions[0];
            newRow["Client"] = clients[row.ClientSuggestions[0]].Name;

            location = locations[row.LocationSuggestions[0]];

            //create the list of contact info sets from the suggestions
            for (var j in row.ContactInfoSuggestions) {
                contactInfo.push(contactInfoSets[row.ContactInfoSuggestions[j]]);
            }

            newRow["LocationId"] = row.LocationSuggestions[0];
            newRow["Location"] = generalTools.getLocationDisplayString(location);
            newRow["ContactInfoData"] = contactInfo;
            newRow["ContactInfo"] = generalTools.getContactInfoDisplayString(contactInfo);
            newRow["RepeatData"] = row.Repeats[0];
            newRow["Repeat"] = generalTools.getRepeatString(row.Repeats[0]);

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
            $("#popupContent").find(".contactInfoWidget").contactInfo({contacts: contacts});
            importerReview.contactInfoWidget = $("#popupContent").find(".contactInfoWidget").data("contactInfo");
        });

        locationPopup.on("click", function (e) {
            var popupElement = $("#popupContent");
            importerReview.editIndex = e.currentTarget.parentElement.parentElement.rowIndex;
            var location = locations[dataSource._view[importerReview.editIndex].LocationId];
            popupElement.find(".locationWidget").location();
            var locationWidget = popupElement.find(".locationWidget").data("location");
            locationWidget.renderMap(location, true);
        });

        repeatPopup.on("click", function (e) {
            importerReview.editIndex = e.currentTarget.parentElement.parentElement.rowIndex;
            var repeat = dataSource._view[importerReview.editIndex].RepeatData;
            $("#popupContent").find(".repeatWidget").repeat({repeat: repeat});
        });

        //on popup close event
        $(document).on('popup.closing', function (e) {
            // get a reference to the grid widget
            var grid = $("#importerReview .grid").data("kendoGrid");
            // returns the data item for first row
            //grid.dataItem(grid.tbody.find(">tr:first"));
            //remove the location widget, if it exists
            if ($(e.target).find(".locationWidget").data("location")) {
                $(e.target).find(".locationWidget").data("location").removeWidget();
                //remove the repeat widget, if it exists
            } else if ($(e.target).find(".repeatWidget").data("repeat")) {
                $(e.target).find(".repeatWidget").data("repeat").removeWidget();
                //remove the contactInfo widget, if it exists
            } else if ($(e.target).find(".contactInfoWidget").data("contactInfo")) {
                //save contactInfo widget data to the grid dataSource
                grid.dataSource._data[importerReview.editIndex].ContactInfoData = importerReview.contactInfoWidget.contacts;
                //update the grid display string
                //importerReview.editedCell.innerHtml = generalTools.getContactInfoDisplayString(importerReview.contactInfoWidget.contacts);
                //grid.refresh();
                $(e.target).find(".contactInfoWidget").data("contactInfo").removeWidget();
            }
        });
    };

    var setupGrid = function () {
        var data = formatDataForGrid(importerSelect.gridData.RowSuggestions);

        dataSource = new kendo.data.DataSource({
            data: data,
            batch: true,
            schema: {
                model: {
                    //id: "ClientId",
                    fields: {
                        //ClientId: { editable: false, nullable: true },
                        Client: { type: "string", editable: true },
                        Location: { type: "string" },
                        ContactInfo: { type: "string" },
                        Repeat: { type: "string" }
                    }
                }
            }
        });

        grid = $("#importerReview").find(".grid").kendoGrid({
            columns: columns,
            dataSource: dataSource,
            editable: true,
            resizable: true,
            scrollable: true,
            sortable: true,
            dataBound: dataBound
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
    };

    window.importerReview = importerReview;

    return importerReview;
});