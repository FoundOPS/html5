// Copyright 2012 FoundOPS LLC. All Rights Reserved.

"use strict";

define(["db/services", "db/session", "db/saveHistory", "tools/parameters", "tools/dateTools", "widgets/settingsMenu"], function (dbServices, session, saveHistory, parameters, dateTools) {
    var usersSettings = {}, usersDataSource, availableEmployees, grid;

    //on add and edit, select a linked employee if the name matches the name in the form
    usersSettings.matchEmployee = function () {
        return;
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
            return dbServices.API_URL + "userAccounts?roleId=" + session.get("role.id");
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
                    contentType: "application/json; charset=utf-8",
                    url: getBaseUrl
                },
                update: {
                    type: "PUT",
                    contentType: "application/json; charset=utf-8",
                    url: getBaseUrl
                },
                destroy: {
                    type: "DELETE",
                    data: function () {
                        return {};
                    },
                    url: function (userAccount) {
                        return getBaseUrl() + "&id=" + userAccount.Id;
                    }
                },
                parameterMap: function (options) {
                    if (_.any(_.keys(options))) {
                        return JSON.stringify(options);
                    }
                    return "";
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
    };

    var setupUsersGrid = function () {
        //add a grid to the #usersGrid div element
        grid = $("#usersGrid").kendoGrid({
            autoBind: false,
            dataSource: usersDataSource,
            dataBound: function () {
                //after the data is loaded, add tooltips to the edit and delete buttons
                $(".k-grid-edit").each(function () {
                    $(this).attr("title", "Edit");
                });
                $(".k-grid-delete").each(function () {
                    $(this).attr("title", "Delete");
                });
                $('.k-grid-edit').on('click', function () {
                    usersSettings.editorType = 'edit';
                });
            },
            editable: {
                mode: "popup",
                template: $("#userPopupTemplate").html(),
                confirmation: "Are you sure you want to delete this user?"
            },
            edit: function (e) {
                var win = $('.k-window');
                if (usersSettings.editorType === 'add') {
                    //remove extra add/cancel buttons
                    win.find('.k-button').not('#btnAdd, #btnCancel').remove();
                    win.find('.k-window-title').html("Add New User");
                }
                else {
                    win.find('.k-window-title').html("Edit User");
                }

                //TODO setup employee link

                $("#linkedEmployee").kendoDropDownList({
                    dataSource: availableEmployees,
                    dataTextField: "DisplayName",
                    select: function () {
                        var employee = this.dataItem();
                        //clear other UserAccounts with this EmployeeId
                        _.each(usersDataSource.data(), function (ua) {
                            if (ua.EmployeeId === employee.Id) {
                                ua.set("EmployeeId", null);
                            }
                        });

                        //update the employee id to the selected one
                        //model.EmployeeId = employee.Id;
                        //ua.set("EmployeeId", null);
                    }
                });

//                choose the non-linked employees
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
                    field: "EmployeeId",
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
        }).data("kendoGrid");
    };

    usersSettings.initialize = function () {
        //setup menu
        var menu = $("#users .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Users"});

        setupDataSource();
        setupUsersGrid();
        //setup add button
        $("#addUser").on("click", function () {
            //workaround for lacking add/edit templates
            usersSettings.editorType = 'add';

            //open add new user popup
            grid.addRow();
        });
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