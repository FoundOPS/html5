// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services", "widgets/settingsMenu"], function (developer, services) {
    var usersSettings = {};

    //region Methods
    usersSettings.setDefaultValue = function (){
        if ($("#Role")[0].value == "Mobile"){
            //if the role is mobile, set the default linked employee to "none"
            $("#Employee")[0].kendoBindingTarget.target.select(0);
        }else{
            //if the role is admin or regular, set the default linked employee to "Create New"
            $("#Employee")[0].kendoBindingTarget.target.select(1);
        }
    };

    //on add and edit, select a linked employee if the name matches the name in the form
    usersSettings.matchEmployee = function (first, last, employee) {
        //get the items in the dropdownlist
        var employees = this.dropDownDataSource._data;
        //get the user's name from the form fields
        var name = $("#" + first)[0].value + " " + $("#" + last)[0].value;
        for(var emp in employees){
            //check if the names match
            if(name == employees[emp].EmployeeName){
                //select the corresponding name from the dropdownlist
                $("#" + employee)[0].kendoBindingTarget.target.select(parseInt(emp));
            }
        }
    };

    //after the data is loaded, add tooltips to the edit and delete buttons
    var onDataBound = function () {
        $(".k-grid-edit").each(function(){
            $(this).attr("title", "Edit");
        });
        $(".k-grid-delete").each(function(){
            $(this).attr("title", "Delete");
        });
    };
    //endregion

    usersSettings.initialize = function () {
        //setup menu
        kendo.bind($("#settingsMenu"));
        $("#settingsMenu").kendoSettingsMenu({selectedItem: "Users"});

        //region Setup Grid
        var fields = {
            FirstName: {
                type: "string",
                validation: { required: true },
                defaultValue: ""
            },
            LastName: {
                type: "string",
                validation: { required: true },
                defaultValue: ""
            },
            EmailAddress: {
                type: "string",
                validation: { required: true },
                defaultValue: ""
            },
            Role: {
                type: "string",
                validation: { required: true },
                defaultValue: ""
            },
            Employee: {
                type: "string",
                defaultValue: ""
            }}
        var dataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: services.API_URL + "settings/GetAllUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "GET",
                    dataType: "jsonp",
                    contentType: "application/json; charset=utf-8"
                },
                update: {
                    url: services.API_URL + "settings/UpdateUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST"
                },
                destroy: {
                    url: services.API_URL + "settings/DeleteUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST"
                },
                create: {
                    url: services.API_URL + "settings/InsertUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST"
                }
            },
            schema: {
                model: {
                    // Necessary for inline editing to work
                    id: "Id",
                    fields: fields
                }
            }
        });
        var dataSource2 = [
            {FirstName: "Oren", LastName: "Shatken", EmailAddress: "oshatken@foundops.com", Role: "Administrator", Employee: { EmployeeName: "Oren Shatken", EmployeeId: 1 }},
            {FirstName: "Jon", LastName: "Perl", EmailAddress: "jperl@foundops.com", Role: "Mobile", Employee: { EmployeeName: "Jon Perl", EmployeeId: 2 }},
            {FirstName: "Zach", LastName: "Bright", EmailAddress: "zbright@foundops.com", Role: "Administrator", Employee: { EmployeeName: "Zach Bright", EmployeeId: 3 }}
        ];
        var employees = [
            { EmployeeName: "none", EmployeeId: 1 },
            { EmployeeName: "Oren Shatken", EmployeeId: 2 },
            { EmployeeName: "Jon Perl", EmployeeId: 3 },
            { EmployeeName: "Zach Bright", EmployeeId: 4 }
        ];

        usersSettings.dropDownDataSource = new kendo.data.DataSource({
            //TODO: get api datasource
            data: employees,
            schema: {
                model: {
                    fields: fields
                }
            }
        });

        //add a grid to the #usersGrid div element
        $("#usersGrid").kendoGrid({
            dataSource: dataSource2,
            dataBound: onDataBound,
            editable: {
                mode: "popup",
                template: $("#editTemplate").html(),
                confirmation: "Are you sure you want to delete this user?"
            },
            edit: function(e) {
                $(e.container)
                    .find("input[name='Employee']")
                    .data("kendoDropDownList")
                    .bind("change", function() {
                        console.log("drop down changed");
                    });
                //TODO: sdd this add check if it works to re-get the list from the API
                //usersSettings.dropDownDataSource.read();
            },
            scrollable:false,
            sortable: true,
            columns: [{
                    field: "FirstName",
                    title: "First Name"
                },
                {
                    field: "LastName",
                    title: "Last Name"
                },
                {
                    field: "EmailAddress",
                    title: "Email"
                },
                {
                    field: "Role"
                },
                {
                    field: "Employee",
                    title: "Employee Record",
                    //TODO:get correct link
                    template: '<a href="http://www.google.com">#=Employee.EmployeeName#</a>'
                },
                {
                    command: ["edit", "destroy"],
                    width: "80px"
                }
            ]
        });
        //endregion

        $("#addUser").on("click", function() {
            //TODO: sdd this add check if it works to re-get the list from the API
            //usersSettings.dropDownDataSource.read();
            var dataSrc = $("#usersGrid").data("kendoGrid").dataSource;

            var object = $("<div id='popupEditor'>")
                .appendTo($("body"))
                .kendoWindow({
                    title: "Add New User",
                    modal: true,
                    content: {
                        //sets window template
                        template: kendo.template($("#createTemplate").html())
                    }
                })
                .data("kendoWindow")
                .center();

            //determines at what position to insert the record (needed for pageable grids)
            var index = dataSrc.indexOf((dataSrc.view() || [])[0]);

            if (index < 0) {
                index = 0;
            }
            //insets a new model in the dataSource
            var model = dataSrc.insert(index, {});
            //binds the editing window to the form
            kendo.bind(object.element, model);
            //set the default role
            model.Role = "Administrator";
            //initialize the validator
            var validator = $(object.element).kendoValidator().data("kendoValidator");

            var createNew = [{ EmployeeName: "Create New", EmployeeId: 1 }];
            usersSettings.dropDownDataSource.data(createNew.concat(usersSettings.dropDownDataSource.options.data));

            usersSettings.setDefaultValue();

            $("#btnAdd").on("click", function() {
                if (validator.validate()) {
                    dataSrc.sync(); //sync changes
                    object.close();
                    object.element.remove();
                    usersSettings.dropDownDataSource.remove(usersSettings.dropDownDataSource.at(0));
                }
            });

            $("#btnAdd")[0].innerText = ("Send Invite Email");

            $("#btnCancel").on("click", function() {
                dataSrc.cancelChanges(model); //cancel changes
                object.close();
                object.element.remove();
                usersSettings.dropDownDataSource.remove(usersSettings.dropDownDataSource.at(0));
            });
        });
    };

    window.usersSettings = usersSettings;
});