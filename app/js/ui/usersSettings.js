// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services", "widgets/settingsMenu"], function (developer, services) {
    var usersSettings = {};

    //region Methods
    usersSettings.setDefaultValue = function () {
        var index;
        //get the index of the empty employee
        for (var employee in this.employees) {
            if (this.employees[employee].FirstName === "None") {
                index = parseInt(employee);
            }
        }

        if ($("#Role")[0].value === "Mobile") {
            //if the role is mobile, set the default linked employee to "None"
            $("#Employee")[0].kendoBindingTarget.target.select(index);
        } else {
            //if the role is admin or regular, set the default linked employee to "Create New"
            $("#Employee")[0].kendoBindingTarget.target.select(this.employees.length - 1);
        }
    };

    //on add and edit, select a linked employee if the name matches the name in the form
    usersSettings.matchEmployee = function (first, last, employee) {
        //get the items in the dropdownlist
        var employees = this.employees;
        //get the user's name from the form fields
        var name = $("#" + first)[0].value + " " + $("#" + last)[0].value;
        for (var emp in employees) {
            //check if the names match
            if (name === employees[emp].DisplayName) {
                //select the corresponding name from the dropdownlist
                $("#" + employee)[0].kendoBindingTarget.target.select(parseInt(emp));
            }
        }
    };

    //after the data is loaded, add tooltips to the edit and delete buttons
    var onDataBound = function () {
        $(".k-grid-edit").each(function () {
            $(this).attr("title", "Edit");
        });
        $(".k-grid-delete").each(function () {
            $(this).attr("title", "Delete");
        });
    };
    //endregion

    usersSettings.initialize = function () {

        //get the list of employees without linked user accounts
        var getEmployees = function () {
            services.getAllEmployeesForBusiness(function (employees) {
                usersSettings.employees = employees;
            });
        };

        //setup menu
        var menu = $("#users .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Users"});

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
                defaultValue: ""
            }};

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

        //add a grid to the #usersGrid div element
        $("#usersGrid").kendoGrid({
            dataSource: dataSource,
            dataBound: onDataBound,
            editable: {
                mode: "popup",
                template: $("#editTemplate").html(),
                confirmation: "Are you sure you want to delete this user?"
            },
            edit: function (e) {
                $(e.container)
                    .find("input[name='Employee']")
                    .data("kendoDropDownList")
                    .bind("change", function () {
                        console.log("drop down changed");
                    });
                //TODO:
                getEmployees();
            },
            scrollable: false,
            sortable: true,
            columns: [
                {
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
                //TODO: V2 add an employee records link
                {
                    field: "Employee",
                    title: "Employee Record",
                    template: "# if (Employee && Employee.DisplayName) {#" +
                                "#= Employee.DisplayName #" +
                              "# } #"
                },
                {
                    command: ["edit", "destroy"],
                    width: "80px"
                }
            ]
        });
//endregion

        $("#addUser").on("click", function () {
            //TODO: see if this happens in time
            getEmployees();

            var dataSrc = $("#usersGrid").data("kendoGrid").dataSource;

            var createNew = {DisplayName: "Create New", FirstName: "", Id: "1", LastName: "", LinkedUserAccountId: ""};
            usersSettings.employees.push(createNew);

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

            usersSettings.setDefaultValue();

            $("#btnAdd").on("click", function () {
                if (validator.validate()) {
                    var employee = $("#Employee")[0].value;
                    if (employee === "None") {
                        dataSrc._data[0].Employee = {FirstName: "None", Id: " ", LastName: " ", LinkedUserAccountId: " "};
                    } else if (employee === "Create New") {
                        dataSrc._data[0].Employee = {FirstName: "Create", Id: " ", LastName: " ", LinkedUserAccountId: " "};
                    } else {
                        var name = employee.split(" ");
                        dataSrc._data[0].Employee = {FirstName: name[0], Id: " ", LastName: name[1], LinkedUserAccountId: " "};
                    }
                    dataSrc.sync(); //sync changes
                    object.close();
                    object.element.remove();
                    usersSettings.employees.splice(-1, 1);
                }
            });

            $("#btnAdd")[0].innerText = ("Send Invite Email");

            $("#btnCancel").on("click", function () {
                dataSrc.cancelChanges(model); //cancel changes
                object.close();
                object.element.remove();
                usersSettings.employees.splice(-1, 1);
            });
        });

        getEmployees();
    }
    ;

    window.usersSettings = usersSettings;
})
;