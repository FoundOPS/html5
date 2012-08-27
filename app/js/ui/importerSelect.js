'use strict';

define(function () {
    var select = {};
    select.data = [];

    select.initialize = function () {
        var list = [
            {Name: "Do not Import"},
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