'use strict';

define(function () {
    var select = {};
    select.data = [];

    select.initialize = function () {
        var data = [
            {header: "Client Name", value: "Abbott, Lori"},
            {header: "Phone", value: "123-456-7890"},
            {header: "Email", value: "labbit@yahoo.com"},
            {header: "Location Name", value: "52 Mobile Home Estates (Lafayette 1)"},
            {header: "Address Line 1", value: "2525 N 925 W"},
            {header: "Service", value: "Trash Pickup"},
            {header: "Frequency", value: "Weekly"}
        ]

        var list = [
            {Name: 'Client Name'},
            {Name: 'Location Name'},
            {Name: 'Email'},
            {Name: 'Phone'},
            {Name: 'Address Line 1'},
            {Name: 'Service'},
            {Name: 'Frequency'}
        ]

        $("#listView").kendoListView({
            template: "<li><div class='header'>#=data[0]#</div><div class='value'>#=data[1]#</div><input class='fields' /></li>",
            dataSource: select.data
        });

        $(".fields").kendoDropDownList({
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: list
        });
    }

    window.select = select;

    return select;
});