// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services", "ui/notifications", "widgets/settingsMenu"], function (developer, services, notifications) {
    var usersSettings = {};

    //region Methods
    usersSettings.setDefaultValue = function () {
        var index;
        //get the index of the empty employee
        for (var i in this.employees) {
            if (this.employees[i].FirstName === "None") {
                index = parseInt(i);
            }
        }

        if ($("#Role")[0].value === "Mobile") {
            //if the role is mobile, set the default linked employee to "None"
            if ($("#Employee")[0].kendoBindingTarget) {
                $("#Employee")[0].kendoBindingTarget.target.select(index);
            }
        } else {
            //if the role is admin or regular, set the default linked employee to "Create New"
            if ($("#Employee")[0].kendoBindingTarget) {
                $("#Employee")[0].kendoBindingTarget.target.select(this.employees.length - 1);
            }
        }
    };

    //on add and edit, select a linked employee if the name matches the name in the form
    usersSettings.matchEmployee = function () {
        //get the items in the dropdownlist
        var employees = this.employees;
        //get the user's name from the form fields
        var name = $("#FirstName")[0].value + " " + $("#LastName")[0].value;
        for (var emp in employees) {
            //check if the names match
            if (name === employees[emp].DisplayName) {
                //select the corresponding name from the dropdownlist
                if ($("#Employee")[0].kendoBindingTarget) {
                    $("#Employee")[0].kendoBindingTarget.target.select(parseInt(emp));
                }
            }
        }
    };

    //after the data is loaded, add tooltips to the edit and delete buttons
    var onDataBound = function (e) {
        usersSettings.linkedEmployees = {};
        var data = e.sender._data;
        //http://stackoverflow.com/questions/6715641/an-efficient-way-to-get-the-difference-between-two-arrays-of-objects
        data.forEach(function(obj){
            if(obj.Employee){
                usersSettings.linkedEmployees[obj.Employee.Id] = obj;
            }
        });

        $(".k-grid-edit").each(function () {
            $(this).attr("title", "Edit");
        });
        $(".k-grid-delete").each(function () {
            $(this).attr("title", "Delete");
        });
    };
    //endregion

    usersSettings.initialize = function () {

        //get the list of employees
        services.getAllEmployeesForBusiness(function (employees) {
            usersSettings.employees = employees;
        });

        //setup menu
        var menu = $("#users .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Users"});

        //region Setup Grid
        var fields = {
            Id: {
                type: "hidden",
                defaultValue: ""
            },
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
                    contentType: "application/json; charset=utf-8",
                    //TODO: set a timeout and notify if it is reached('complete' doesn't regester a timeout error)
                    complete: function (jqXHR, textStatus) {
                        if (textStatus == "error") {
                            notifications.error("Get")
                        }
                    }
                },
                update: {
                    url: services.API_URL + "settings/UpdateUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST",
                    complete: function (jqXHR, textStatus) {
                        if (textStatus == "success") {
                            notifications.success(jqXHR.statusText)
                        } else {
                            dataSource.cancelChanges();
                            notifications.error(jqXHR.statusText)
                        }
                    }
                },
                destroy: {
                    url: services.API_URL + "settings/DeleteUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST",
                    complete: function (jqXHR, textStatus) {
                        if (textStatus == "success") {
                            notifications.success(jqXHR.statusText)
                        } else {
                            dataSource.cancelChanges();
                            notifications.error(jqXHR.statusText)
                        }
                    }
                },
                create: {
                    url: services.API_URL + "settings/InsertUserSettings?roleId=" + developer.GOTGREASE_ROLE_ID,
                    type: "POST",
                    complete: function (jqXHR, textStatus) {
                        if (textStatus == "success") {
                            notifications.success(jqXHR.statusText)
                        } else {
                            dataSource.cancelChanges();
                            notifications.error(jqXHR.statusText)
                        }
                    }
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
                //set the available employees
                var availableEmployees = usersSettings.employees.filter(function (employee){
                    return !(employee.Id in usersSettings.linkedEmployees);
                });
                if (e.model.Employee) {
                    availableEmployees.push(e.model.Employee);
                }

                var dropdownlist = $("#linkedEmployee").kendoDropDownList({
                    dataSource: availableEmployees,
                    dataTextField: "DisplayName",
                    dataValueField: "DisplayName"
                });

                if (e.model.Employee) {
                    //set the default linked employee to the employee's name
                    dropdownlist.select(function (dataItem) {
                        return dataItem.text === e.model.Employee.DisplayName;
                    });
                } else {
                    //set the linked employee to "None"
                    dropdownlist.select(function (dataItem) {
                        return dataItem.text === "None";
                    });
                }
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
                    width: "81px"
                }
            ]
        });
//endregion

        $("#addUser").on("click", function () {
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
                    var grid = $("#usersGrid").data("kendoGrid");
                    $("#usersGrid")[0].childNodes[0].childNodes[2].childNodes[0].childNodes[4].innerText = employee;
                    grid._data[0].Employee.DisplayName = employee;
                    object.close();
                    object.element.remove();
                    usersSettings.employees.splice(usersSettings.employees.length - 1, 1);
                }
            });

            $("#btnCancel").on("click", function () {
                dataSrc.cancelChanges(model); //cancel changes
                object.close();
                object.element.remove();
                usersSettings.employees.splice(usersSettings.employees.length - 1, 1);
            });
        });

        $(".k-grid-cancel").on("click", function () {
            dataSource.cancelChanges();
        });
    };

    window.usersSettings = usersSettings;
});