// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to change password.
 */

"use strict";

define(["db/services", "tools", "ui/saveHistory", "widgets/settingsMenu"], function (services, tools, saveHistory) {
    var changePassword = {};

    changePassword.save = function () {
        var oldPass = $("#old")[0].value;
        var newPass = $("#new")[0].value;
        var confirmPass = $("#confirm")[0].value;
        if (changePassword.validator.validate) {
            services.updatePassword(oldPass, newPass, confirmPass);
            $("#old")[0].value = "";
            $("#new")[0].value = "";
            $("#confirm")[0].value = "";
            tools.disableButtons("#changePassword");
            window.navigateToPersonal();
        }
    };

    changePassword.cancel = function () {
        $("#old")[0].value = "";
        $("#new")[0].value = "";
        $("#confirm")[0].value = "";
        tools.disableButtons("#changePassword");
        window.navigateToPersonal();
    };

    changePassword.initialize = function () {
        //setup menu
        var menu = $("#changePassword .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu();

        tools.observeInput("#changePassword");

        changePassword.validator = $("#changePasswordForm").kendoValidator({
            rules: {
                custom: function (input) {
                    return (input.is("[name=confirm]") && input.val() === $("#new")[0].value) || !(input.is("[name=confirm]"))
                }
            },
            messages: {
                custom: "The passwords do not match."
            }
        }).data("kendoValidator");
    };

    window.changePassword = changePassword;

    return changePassword;
});