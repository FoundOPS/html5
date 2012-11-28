'use strict';

define(["jquery", "underscore", "sections/importerUpload", "sections/importerSelect", "db/services", "tools/generalTools", "widgets/location", "widgets/contactInfo", "widgets/repeat",
    "ui/popup", "widgets/selectBox"], function ($, _, importerUpload, importerSelect, dbServices, generalTools) {
    var importerReview = {}, dataSource, grid, clients = {}, locations = {}, contactInfoSets = {}, columns = [
        {
            field: "Client",
            template: "<div class='Client'>#= Client #</div>",
            editor: function (container, options) {
                $('<div class="styled-select"></div>').appendTo(container)
                    .selectBox({data: [{Name: "BK"}, {Name: "Subway"}], dataTextField: "Name"});
            }
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

            newRow["Client"] = clients[row.ClientSuggestions[0]].Name;

            location = locations[row.LocationSuggestions[0]];

            //create the list of contact info sets from the suggestions
            for (var j in row.ContactInfoSuggestions) {
                contactInfo.push(contactInfoSets[row.ContactInfoSuggestions[j]]);
            }

            newRow["Location"] = generalTools.getLocationDisplayString(location);
            newRow["ContactInfo"] = generalTools.getContactInfoDisplayString(contactInfo);
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
    var setupGrid = function () {
        var data = formatDataForGrid(importerSelect.gridData.RowSuggestions);

        dataSource = new kendo.data.DataSource({
            data: data,
            batch: true,
            schema: {
                model: {
                    fields: {
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
            scrollable: true
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
        $("#importerReview").find('.k-grid-content').css("height", contentHeight + 'px');
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
            $("#popupContent").find(".contactInfoWidget").contactInfo();
        });

        locationPopup.on("click", function (e) {
            var popupElement = $("#popupContent");
            var location = importerSelect.gridData.Locations[e.currentTarget.parentElement.parentElement.rowIndex];
            popupElement.find(".locationWidget").location();
            var locationWidget = popupElement.find(".locationWidget").data("location");
            locationWidget.renderMap(location, true);
        });

        repeatPopup.on("click", function (e) {
            $("#popupContent").find(".repeatWidget").repeat();
        });

        //on popup close event
        $(document).on('popup.closing', function (e) {
            //remove the location widget, if it exists
            if ($(e.target).find(".locationWidget").data("location")) {
                $(e.target).find(".locationWidget").data("location").removeWidget();
                //remove the repeat widget, if it exists
            } else if ($(e.target).find(".repeatWidget").data("repeat")) {
                $(e.target).find(".repeatWidget").data("repeat").removeWidget();
                //remove the contactInfo widget, if it exists
            } else if ($(e.target).find(".contactInfoWidget").data("contactInfo")) {
                $(e.target).find(".contactInfoWidget").data("contactInfo").removeWidget();
            }
        });
    };

    window.importerReview = importerReview;

    return importerReview;
});