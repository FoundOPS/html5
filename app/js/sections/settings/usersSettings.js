// Copyright 2012 FoundOPS LLC. All Rights Reserved.

"use strict";

define(["db/services", "db/session", "db/saveHistory", "tools/parameters", "tools/dateTools", "widgets/settingsMenu"], function (dbServices, session, saveHistory, parameters, dateTools) {
    var usersSettings = {}, usersDataSource, availableEmployees;

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

    var setupDataSource = function () {
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
            EmployeeId: {
                defaultValue: ""
            }
//            TimeZone: {
//                defaultValue: ""
//            }
        };

        var getBaseUrl = function () {
            return  dbServices.API_URL + "userAccounts?roleId=" + session.get("role.id");
        };
        usersDataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    //TODO: set a timeout and notify if it is reached('complete' doesn't register a timeout error)
                    complete: function (jqXHR, textStatus) {
                        if (textStatus == "error") {
                            saveHistory.error("Get");
                        }
                    },
                    url: getBaseUrl
                },
                create: {
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    url: getBaseUrl
                },
                update: {
                    type: "PUT",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    url: getBaseUrl
                },
                destroy: {
                    type: "DELETE",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    url: function (userAccount) {
                        return getBaseUrl() + "&id=" + userAccount.Id;
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
        dbServices.hookupDefaultComplete(usersDataSource);

        //set the dataSource urls initially, and when the role is changed
        session.followRole(function (role) {
            var roleId = session.get("role.id");
            if (!roleId || role.type !== "Administrator") {
                return;
            }

            var section = parameters.getSection();
            if (section && section.name === "usersSettings") {
                usersDataSource.read();
            }
        });
    };

    //sets up the add new user popup
    var setupAddNewUser = function () {
        $("#addUser").on("click", function () {
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

            //add a new userAccount to the dataSource
            var model = usersDataSource.insert(0, {EmployeeId: null, Role: "Administrator"});
            //bind the editing window to the form
            kendo.bind(object.element, model);

            //initialize the validator
            var validator = $(object.element).kendoValidator().data("kendoValidator");
            $("#Employee").kendoDropDownList({
                dataSource: availableEmployees,
                dataTextField: "DisplayName",
                change: function () {
                    //clear other UserAccounts with this EmployeeId
                    _.each(usersDataSource.data(), function (ua) {
                        if (ua.EmployeeId === employee.Id) {
                            ua.EmployeeId = null;
                        }
                    });

                    //update the employee id to the selected one
                    var employee = this.dataItem();
                    model.EmployeeId = employee.Id;
                }
            });

            $("#btnAdd").on("click", function () {
                if (validator.validate()) {
                    //TODO

//                    var employee = $("#Employee")[0].value;
//                    if (employee === "None") {
//                        usersDataSource._data[0].Employee = {FirstName: "None", Id: " ", LastName: " ", LinkedUserAccountId: " "};
//                    } else if (employee === "Create New") {
//                        usersDataSource._data[0].Employee = {FirstName: "Create", Id: " ", LastName: " ", LinkedUserAccountId: " "};
//                    } else {
//                        var name = employee.split(" ");
//                        usersDataSource._data[0].EmployeeId = {FirstName: name[0], Id: " ", LastName: name[1], LinkedUserAccountId: " "};
//                    }
                    //add timezone to new user
//                    usersDataSource._data[0].TimeZoneInfo = dateTools.getLocalTimeZone();

                    usersDataSource.sync(); //sync changes

                    //TODO
//                    var grid = $("#usersGrid").data("kendoGrid");
//                    $("#usersGrid")[0].childNodes[0].childNodes[2].childNodes[0].childNodes[4].innerText = employee;
//                    grid._data[0].Employee.DisplayName = employee;
                    object.close();
                    object.element.remove();
                }
            });

            $("#btnCancel").on("click", function () {
                //cancel changes
                usersDataSource.cancelChanges(model);
                object.close();
                object.element.remove();
            });

            $(".k-i-close").on("click", function () {
                //cancel changes
                usersDataSource.cancelChanges(model);
            });
        });
    };

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
                //cancel the changes on cancel button click
                $(".k-grid-cancel").on("click", function () {
                    e.sender.cancelChanges();
                });
                //cancel the changes on 'X' button click
                $(".k-i-close").on("click", function () {
                    e.sender.cancelChanges();
                });

                //choose the non-linked employees
//                var availableEmployees = usersSettings.employees.filter(function (employee) {
//                    return !(employee.LinkedUserAccountId in linkedEmployees);
//                });
//                //if there is a linked employee, add it to the list
//                if (e.model.Employee) {
//                    availableEmployees.push(e.model.Employee);
//                }
//                //update the dataSource
//                usersSettings.availableEmployeesDataSource.data(availableEmployees);

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
                    template: "# if (EmployeeId) {#" +
                        "#= usersSettings.getEmployeeName(EmployeeId) #" +
                        "# } #"
                },
                {
                    command: ["edit", "destroy"],
                    width: "87px"
                }
            ]
        });
    };

    usersSettings.initialize = function () {
        //setup menu
        var menu = $("#users .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Users"});

        setupDataSource();
        setupAddNewUser();
        setupUsersGrid();
    };

    usersSettings.show = function () {
        usersSettings.setupSaveHistory();
        dbServices.employees.read().done(function (data) {
            availableEmployees = data;
            //add a create new option
            var createNew = {Id: "", DisplayName: "Create New", FirstName: "", LastName: "", LinkedUserAccountId: ""};
            availableEmployees.splice(0, 0, createNew);

            usersDataSource.read();
        });
    };

    usersSettings.getEmployeeName = function (employeeId) {
        return _.find(availableEmployees,function (e) {
            return e.Id === employeeId;
        }).DisplayName;
    };

    window.usersSettings = usersSettings;
});