// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services", "session", "ui/saveHistory", "tools", "widgets/settingsMenu"], function (developer, dbServices, session, saveHistory, tools) {
    var usersSettings = {}, usersDataSource, linkedEmployees;

    //on add and edit, select a linked employee if the name matches the name in the form
    usersSettings.matchEmployee = function () {
        var dropDownList = $("#Employee").data("kendoDropDownList");

        //get the user's name from the form fields
        var name = $("#FirstName")[0].value + " " + $("#LastName")[0].value;
        //select it in the dropDownList
        dropDownList.select(function (dataItem) {
            return dataItem.DisplayName === name;
        });
    };

    usersSettings.setupSaveHistory = function () {
        saveHistory.setCurrentSection({
            page: "Users Settings",
            section: usersSettings
        });
    };

    //the datasource for the Linked Employee dropdown on the edit user popup
    usersSettings.availableEmployeesDataSource = new kendo.data.DataSource({});

    //region Setup users dataSource

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
        },
        TimeZoneInfo: {
            defaultValue: ""
        }
    };

    usersDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: "GET",
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8",
                //TODO: set a timeout and notify if it is reached('complete' doesn't register a timeout error)
                complete: function (jqXHR, textStatus) {
                    if (textStatus == "error") {
                        saveHistory.error("Get")
                    }
                }
            },
            create: {
                type: "POST"
            },
            update: {
                type: "POST"
            },
            destroy: {
                type: "POST"
            }
        },
        schema: {
            model: {
                // Necessary for inline editing to work
                id: "Id",
                fields: fields
            }
        },
        change: function (e) {
            linkedEmployees = {};

            _.each(e.items, function (obj) {
                if (obj.Employee) {
                    linkedEmployees[obj.Employee.LinkedUserAccountId] = obj;
                }
            });
        }
    });
    dbServices.hookupDefaultComplete(usersDataSource);

    //set the dataSource urls initially, and when the role is changed
    session.followRole(function (role) {
        var roleId = session.get("role.id");
        if (!roleId) {
            return;
        }
        usersDataSource.transport.options.read.url = dbServices.API_URL + "settings/GetAllUserSettings?roleId=" + roleId;
        usersDataSource.transport.options.update.url = dbServices.API_URL + "settings/UpdateUserSettings?roleId=" + roleId;
        usersDataSource.transport.options.destroy.url = dbServices.API_URL + "settings/DeleteUserSettings?roleId=" + roleId;
        usersDataSource.transport.options.create.url = dbServices.API_URL + "settings/InsertUserSettings?roleId=" + roleId;
        usersDataSource.read();
    });

    //endregion

    //sets up the add new user popup
    var setupAddNewUser = function () {
        $("#addUser").on("click", function () {
            //choose the non-linked employees
            var availableEmployees = usersSettings.employees.filter(function (employee) {
                return !(employee.Id in linkedEmployees);
            });

            var createNew = {DisplayName: "Create New", FirstName: "", Id: "1", LastName: "", LinkedUserAccountId: ""};
            availableEmployees.push(createNew);

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
            var index = usersDataSource.indexOf((usersDataSource.view() || [])[0]);

            if (index < 0) {
                index = 0;
            }
            //inserts a new model in the dataSource
            var model = usersDataSource.insert(index, {});
            //binds the editing window to the form
            kendo.bind(object.element, model);
            //set the default role
            model.Role = "Administrator";
            //initialize the validator
            var validator = $(object.element).kendoValidator().data("kendoValidator");
            $("#Employee").kendoDropDownList({
                dataSource: availableEmployees,
                dataTextField: "DisplayName",
                dataValueField: "DisplayName"
            });

            //whenever the Role Type changes, select the default employee
            var selectDefaultEmployee = function () {
                var dropDownList = $("#Employee").data("kendoDropDownList");

                if ($("#Role")[0].value === "Mobile") {
                    //if the role is mobile, set the default linked employee to "None"
                    dropDownList.select(function (dataItem) {
                        return dataItem.DisplayName === "None ";
                    });
                } else {
                    //if the role is admin or regular, set the default linked employee to "Create New"
                    dropDownList.select(function (dataItem) {
                        return dataItem.DisplayName === "Create New";
                    });
                }
            };
            selectDefaultEmployee();
            $("#Role").on("change", function () {
                selectDefaultEmployee();
            });

            $("#btnAdd").on("click", function () {
                if (validator.validate()) {
                    var employee = $("#Employee")[0].value;
                    if (employee === "None") {
                        usersDataSource._data[0].Employee = {FirstName: "None", Id: " ", LastName: " ", LinkedUserAccountId: " "};
                    } else if (employee === "Create New") {
                        usersDataSource._data[0].Employee = {FirstName: "Create", Id: " ", LastName: " ", LinkedUserAccountId: " "};
                    } else {
                        var name = employee.split(" ");
                        usersDataSource._data[0].Employee = {FirstName: name[0], Id: " ", LastName: name[1], LinkedUserAccountId: " "};
                    }
                    //add timezone to new user
                    usersDataSource._data[0].TimeZoneInfo = tools.getLocalTimeZone();
                    usersDataSource.sync(); //sync changes
                    var grid = $("#usersGrid").data("kendoGrid");
                    $("#usersGrid")[0].childNodes[0].childNodes[2].childNodes[0].childNodes[4].innerText = employee;
                    grid._data[0].Employee.DisplayName = employee;
                    object.close();
                    object.element.remove();
                }
            });

            $("#btnCancel").on("click", function () {
                usersDataSource.cancelChanges(model); //cancel changes
                object.close();
                object.element.remove();
            });

            $(".k-i-close").on("click", function () {
                usersDataSource.cancelChanges(model);
            });
        });
    };

    //region Users Grid

    var setupUsersGrid = function () {
        //add a grid to the #usersGrid div element
        $("#usersGrid").kendoGrid({
            dataSource: usersDataSource,
            dataBound: function () {
                //after the data is loaded, add tooltips to the edit and delete buttons
                $(".k-grid-edit").each(function () {
                    $(this).attr("title", "Edit");
                });
                $(".k-grid-delete").each(function () {
                    $(this).attr("title", "Delete");
                });
            },
            editable: {
                mode: "popup",
                template: $("#editTemplate").html(),
                confirmation: "Are you sure you want to delete this user?"
            },
            edit: function (e) {
                //choose the non-linked employees
                var availableEmployees = usersSettings.employees.filter(function (employee) {
                    return !(employee.LinkedUserAccountId in linkedEmployees);
                });
                //if there is a linked employee, add it to the list
                if (e.model.Employee) {
                    availableEmployees.push(e.model.Employee);
                }
                //update the dataSource
                usersSettings.availableEmployeesDataSource.data(availableEmployees);

                //cancel the changes on cancel button click
                $(".k-grid-cancel").on("click", function () {
                    e.sender.cancelChanges();
                });
                //cancel the changes on 'X' button click
                $(".k-i-close").on("click", function () {
                    e.sender.cancelChanges();
                });
            },
            saveChanges: function () {
                saveHistory.success();
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
    };

    //endregion

    usersSettings.initialize = function () {
        //get the list of employees
        dbServices.getAllEmployeesForBusiness(function (employees) {
            usersSettings.employees = employees;
        });

        //setup menu
        var menu = $("#users .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Users"});

        setupAddNewUser();
        setupUsersGrid();
    };

    usersSettings.show = function () {
        usersSettings.setupSaveHistory();
    };

    window.usersSettings = usersSettings;
});