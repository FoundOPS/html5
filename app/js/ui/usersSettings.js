// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold users settings logic.
 */

"use strict";

define(["developer", "db/services", "session", "ui/notifications", "widgets/settingsMenu"], function (developer, dbServices, session, notifications) {
    var usersSettings = {};

    //region Methods
    usersSettings.setDefaultValue = function () {
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

    //on add and edit, select a linked employee if the name matches the name in the form
    usersSettings.matchEmployee = function () {
        var dropDownList = $("#Employee").data("kendoDropDownList");

        //get the items in the dropdownlist
        var employees = this.employees;
        //get the user's name from the form fields
        var name = $("#FirstName")[0].value + " " + $("#LastName")[0].value;
        //select it in the dropDownList
        dropDownList.select(function (dataItem) {
            return dataItem.DisplayName === name;
        });
    };

    //after the data is loaded, add tooltips to the edit and delete buttons
    var onDataBound = function (e) {
        usersSettings.linkedEmployees = {};
        var data = e.sender._data;
        //http://stackoverflow.com/questions/6715641/an-efficient-way-to-get-the-difference-between-two-arrays-of-objects
        data.forEach(function (obj) {
            if (obj.Employee) {
                usersSettings.linkedEmployees[obj.Employee.LinkedUserAccountId] = obj;
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
        dbServices.getAllEmployeesForBusiness(function (employees) {
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
                    type: "POST",
                    complete: function (jqXHR, textStatus) {
                        if (textStatus == "success") {
                            notifications.success(jqXHR.statusText)
                        } else {
                            dataSource.cancelChanges();
                            notifications.error(jqXHR.statusText)
                        }
                        dataSource.read();
                    }
                },
                destroy: {
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
                    type: "POST",
                    complete: function (jqXHR, textStatus) {
                        if (textStatus == "success") {
                            notifications.success(jqXHR.statusText)
                        } else {
                            dataSource.cancelChanges();
                            notifications.error(jqXHR.statusText)
                        }
                        dataSource.read();
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

        var setupDataSourceUrls = function () {
            var roleId = session.get("role.id");
            if (!roleId) {
                return;
            }
            dataSource.transport.options.read.url = dbServices.API_URL + "settings/GetAllUserSettings?roleId=" + roleId;
            dataSource.transport.options.update.url = dbServices.API_URL + "settings/UpdateUserSettings?roleId=" + roleId;
            dataSource.transport.options.destroy.url = dbServices.API_URL + "settings/DeleteUserSettings?roleId=" + roleId;
            dataSource.transport.options.create.url = dbServices.API_URL + "settings/InsertUserSettings?roleId=" + roleId;
            dataSource.read();
        };
        //set the dataSource urls initially, and when the role is changed
        setupDataSourceUrls();
        session.bind("change", function (e) {
            if (e.field == "role") {
                setupDataSourceUrls();
            }
        });

        usersSettings.availableEmployeesDataSource = new kendo.data.DataSource({});

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
                //set the available employees(filter out the linked employees from the list of all employees)
                var availableEmployees = usersSettings.employees.filter(function (employee) {
                    return !(employee.LinkedUserAccountId in usersSettings.linkedEmployees);
                });
                //if there is a linked employee, add it to the list
                if (e.model.Employee) {
                    availableEmployees.push(e.model.Employee);
                }
                //update the datsSource
                usersSettings.availableEmployeesDataSource.data(availableEmployees);

                var dropDownList = $("#linkedEmployee").data("kendoDropDownList");
                dropDownList.refresh();

                if (e.model.Employee) {
                    //set the default value of the dropdownlist to the employee's name
                    dropDownList.select(function (dataItem) {
                        return dataItem.Id === e.model.Employee.Id;
                    });
                } else {
                    //set the default value of the dropdownlist to "None"
                    dropDownList.select(function (dataItem) {
                        return dataItem.Id === "00000000-0000-0000-0000-000000000000";
                    });
                }

                //cancel the changes on cancel button click
                $(".k-grid-cancel").on("click", function () {
                    e.sender.cancelChanges();
                });
                //cancel the changes on 'X' button click
                $(".k-i-close").on("click", function () {
                    e.sender.cancelChanges();
                });
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

            //set the available employees
            var availableEmployees = usersSettings.employees.filter(function (employee) {
                return !(employee.Id in usersSettings.linkedEmployees);
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

            var dropDownList = $("#Employee").kendoDropDownList({
                dataSource: availableEmployees,
                dataTextField: "DisplayName",
                dataValueField: "DisplayName"
            });

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
                }
            });

            $("#btnCancel").on("click", function () {
                dataSrc.cancelChanges(model); //cancel changes
                object.close();
                object.element.remove();
            });

            $("#Role").on("change", function () {
                usersSettings.setDefaultValue();
            });
        });

        $(".k-grid-cancel").on("click", function () {
            dataSource.cancelChanges();
        });
    };

    window.usersSettings = usersSettings;
});