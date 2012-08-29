'use strict';

define(["sections/importerReview"], function (importerReview) {
    var importerSelect = {};
    importerSelect.data = [];

    importerSelect.initialize = function () {
        var list = [
            {Name: "Do not Import"},
            {Name: 'Client Name'},
            {Name: 'Location Name'},
            {Name: 'Address Line 1'},
            {Name: 'Service'},
            {Name: 'Frequency'},
            {Name: 'Repeat On'},
            {Name: 'Repeat Every'},
            {Name: 'Repeat Start Date'}
        ];

        importerSelect.listView = $("#listView").kendoListView({
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><input class='fields' /></li>",
            dataSource: importerSelect.data
        }).data("kendoListView");

        $(".fields").kendoDropDownList({
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: list
        });

        //when a dropdown is changed, update the columns
        //TODO: find out why this gets hit twice for every change
        $("#importerSelect .fields").on("change", function () {
            var i = 0;
            //iterate through all the dropdowns
            $("#importerSelect input.fields").each(function () {
                //check if the dropdown is not "Do not Import"
                var value = this.value;
                //remove whitespaces
                var trimmedValue = value.replace(/\s+/g,'');
                if(value != "Do not Import") {
                    //setup the column
                    var column = {
                        field: trimmedValue,
                        title: value
                    };
                    var field = {
                        id: tools.newGuid,
                        type: "string"
                    };
                    //add it to the list of columns
                    //TODO: replace if statement with "importerReview.columns.push(column);" and remove "i" once the above TODO is solved
                    if(i == 0){
                        importerReview.columns = [];
                        importerReview.fields = [];
                        importerReview.columns.push(column);
                        importerReview.fields[trimmedValue] = field;
                    }else{
                        importerReview.columns.push(column);
                        importerReview.fields[trimmedValue] = field;
                    }
                    i++;
                }
            });

//            importerReview.columns = [
//                {
//                    field: "Client Name"
//                },
//                {
//                    field: "Location Name"
//                },
//                {
//                    field: "Address Line 1"
//                },
//                {
//                    field: "Service"
//                },
//                {
//                    field: "Frequency"
//                },
//                {
//                    field: "Repeat On"
//                },
//                {
//                    field: "Repeat Every"
//                },
//                {
//                    field: "Repeat Start Date"
//                }
//            ];
        });
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});