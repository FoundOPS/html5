'use strict';

define(["sections/importerUpload", "db/services"], function (importerUpload, dbServices) {
    var importerSelect = {};
    importerSelect.columns = [];

    importerSelect.initialize = function () {
        var fieldList = [
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

        $("#listView").kendoListView({
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><input class='fields' /></li>",
            dataSource: importerUpload.data
        });

        var serviceType = importerUpload.selectedService;

        if(serviceType){
            dbServices.getFields(serviceType, function (fields) {
                var newFields = [];
                var newField = fields[0];
                for(var i in newField){
                    newFields.push({Name: i});
                }

                var allFields = fieldList.concat(newFields);

                $(".fields").kendoDropDownList({
                    dataTextField: "Name",
                    dataValueField: "Id",
                    dataSource: allFields
                });
            });
        }else{
            window.application.navigate("view/importerUpload.html");
        }


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
                    var field = "c" + i;
                    var template = "#=" + field + ".v#";
                    var column = {
                        field: field,
                        title: value,
                        template: template
                    };
                    //add it to the list of columns
                    //TODO: replace if statement with "importerReview.columns.push(column);" and remove "i" once the above TODO is solved
                    if(i == 0){
                        importerSelect.columns = [];
                        importerSelect.columns.push(column);
                    }else{
                        importerSelect.columns.push(column);
                    }
                    i++;
                }
            });
        });
    };

    window.importerSelect = importerSelect;

    return importerSelect;
});