// Copyright 2012 FoundOPS LLC. All Rights Reserved.

"use strict";

define(["db/services", "db/session", "db/saveHistory", "tools/parameters", "tools/dateTools", "widgets/settingsMenu"], function (dbServices, session, saveHistory, parameters, dateTools) {
    var usersSettings = {}, usersDataSource, grid;

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
                defaultValue: "Administrator"
            },
            EmployeeId: {
                //for new entities, default to creating a new employee
                defaultValue: "10000000-0000-0000-0000-000000000000"
            }
//            TimeZone: {
//                defaultValue: ""
//            }
        };

        var getBaseUrl = function () {
            return dbServices.API_URL + "userAccounts?roleId=" + parameters.get().roleId;
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
                parameterMap: dbServices.parameterMap()
            },
            schema: {
                model: {
                    // Necessary for inline editing to work
                    id: "Id",
                    fields: fields
                }
            }
        });

        dbServices.hookupDefaultComplete(usersDataSource, {
            //after insert or update, reload employees and user accounts
            //delay to let popup close
            insert: {
                done: function () {
                    _.delay(load, 200);
                }
            },
            update: {
                done: function () {
                    _.delay(load, 200);
                }
            }
        });
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
                //set the editor type
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
                    win.find('.k-window-title').html("Add New User");
                    //change update to Send Invite Email
                    win.find('.k-grid-update').html("Send Invite Email")
                }
                else {
                    win.find('.k-window-title').html("Edit User");
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

    var load = function () {
        dbServices.employees.read().done(function (data) {
            var employees = data;

            //add a create new option
            var createNew = {Id: "10000000-0000-0000-0000-000000000000", DisplayName: "Create New", FirstName: "", LastName: "", LinkedUserAccountId: ""};
            employees.splice(0, 0, createNew);

            //add a none option above create new
            var none = {Id: "00000000-0000-0000-0000-000000000000", DisplayName: "None", FirstName: "", LastName: "", LinkedUserAccountId: ""};
            employees.splice(0, 0, none);

            usersSettings.availableEmployees = employees;
            usersDataSource.read();
        });
    };

    usersSettings.show = function () {
        usersSettings.setupSaveHistory();
        //ensures role id gets set
        _.delay(load, 250);
    };

    usersSettings.getEmployeeName = function (employeeId) {
        var employee = _.find(usersSettings.availableEmployees, function (e) {
            return e.Id === employeeId;
        });

        if (employee) {
            return employee.DisplayName;
        }

        return "";
    };

    window.usersSettings = usersSettings;
});