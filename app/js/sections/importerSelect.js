'use strict';

define(["jquery", "sections/importerUpload", "db/services", "underscore"], function ($, importerUpload, dbServices, _) {
    var importerSelect = {}

    var formatDataForValidation = function (data) {
        var headersIncluded = $("#importerSelect").find("#headersIncluded")[0].checked;
        var selectedFields = [];
        //create an array of the fields to be used(based on the dropdowns)
        $("#importerSelect").find(".selectBox").each(function () {
            if (this.value !== "Do not Import") {
                selectedFields.push({name: this.value, selected: true});
            } else {
                selectedFields.push(false);
            }
        });

        var dataToValidate = [], row;
        //iterate through each row of the data
        for (var r in data) {
            row = data[r];
            var newArray = [];
            //iterate through each column of the current row
            for (var c in row) {
                //if the field is to be imported(if "Do not Import" wasn't selected for this row)
                if (selectedFields[c]) {
                    newArray.push(row[c]);
                }
            }

            dataToValidate.push(newArray);
        }
        return dataToValidate;
    };

    var onDropdownSelect = function () {

    };

    importerSelect.initialize = function () {
        //make sure there is a selected service type
        if (!importerUpload.selectedService) {
            window.viewImporterUpload();
            return;
        }
    };

    importerSelect.show = function () {
        //setup the default fields
        var fieldList = [
            {Name: "Do not Import"},
            {Name: 'Client Name'},
            {Name: 'Address Line One'},
            {Name: 'Address Line Two'},
            {Name: 'City'},
            {Name: 'State'},
            {Name: 'Zipcode'},
            {Name: 'Region Name'},
            {Name: 'Frequency'},
            {Name: 'Frequency Detail'},
            {Name: 'Repeat Every'},
            {Name: 'Start Date'},
            {Name: 'End Date'}
        ];

        $("#listView").kendoListView({
            //setup the template to only include the header and the first row of data
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><div class='styled-select'></div></li>",
            dataSource: importerUpload.data
        });

        $("#importerSelect").find(".saveBtn").on("click", function () {
            var dataToValidate = formatDataForValidation(importerUpload.oldData);

//            dbServices.suggestions.update({body: {rowsWithHeaders: dataToValidate}}).done(function (suggestions) {
//                importerSelect.gridData = suggestions;
//                window.viewImporterReview();
//            });
            var data = {
                RowSuggestions : [
                    ["25892e17", "80f6", "395632", "7395632f0223"], ["a53e98e4", "0197", "06aaa", "49836e406aaa"]
                ],
                Suggestions: {
                    Clients: [
                        {Id: "25892e17", Name: "BK",
                            ContactInfo: [{Id: "395632", Label: "Jimbo", Data: "http://www.jimbosblog.biz", Type: "Website"}]},
                        {Id: "a53e98e4", Name: "Subway"}
                    ],
                    Locations: [
                        {Id: "80f6", AddressLineOne: "1305 Cumberland Ave", AddressLineTwo: "Suite 205", City: "West Lafayette", State: "IN", Zipcode: "47906",
                            ContactInfo: [{Id: "06aaa", Label: "Secretary", Data: "765-494-4509", Type: "Phone Number"}]},
                        {Id: "0197", AddressLineOne: "508 S 4th St", AddressLineTwo: "", City: "Lafayette", State: "IN", Zipcode: "47901"}
                    ],
                    Repeats: [
                        {Id: "7395632f0223", Name: "11/05/2012"},
                        {Id: "49836e406aaa", Name: "Weekly on Tue"}
                    ]
                }
            };

            importerSelect.gridData = data;
            window.viewImporterReview();
            //});
        });

        //get the list of fields for the selected service(for the dropdowns)
        if (importerUpload.selectedService) {
            dbServices.services.read({params: {serviceTemplateId: importerUpload.selectedService.Id}}).done(function (service) {
                var newFields = [], name;
                var fields = service[0].Fields;
                //iterate throught the list of fields
                for (var i in fields) {
                    name = fields[i].Name;
                    //don't add if type is guid or if name is ClientName or OccurDate
                    if (name !== "ClientName" && name !== "OccurDate") {
                        //add field to list
                        newFields.push({Name: name.replace(/_/g, ' ')}); //replace "_" with " "
                    }
                }

                //combine the fields in fieldList with newFields
                var allFields = fieldList.concat(newFields);
                $("#importerSelect").find(".styled-select").selectBox({data: allFields, dataTextField: "Name", onSelect: onDropdownSelect});

                //automatically select fields if there is a matching header
                var dropdown, headers = importerUpload.oldData[0];
                for (var h in headers) {
                    dropdown = $("#importerSelect .selectBox:eq(" + h + ")");
                    //try to select a matching item
                    dropdown.val(headers[h]);
                }
            });
        }
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});