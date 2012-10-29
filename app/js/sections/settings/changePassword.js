// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to change password.
 */

"use strict";

define(["db/services", "tools/generalTools", "widgets/settingsMenu"], function (dbServices, generalTools) {
    var changePassword = {};

    changePassword.save = function () {
        var oldPass = $("#old")[0].value;
        var newPass = $("#new")[0].value;
        var confirmPass = $("#confirm")[0].value;
        if (changePassword.validator.validate) {
            dbServices.userAccounts.update({excludeRoleId: true, params: {oldPass: oldPass, newPass: newPass}});
            $("#old")[0].value = "";
            $("#new")[0].value = "";
            $("#confirm")[0].value = "";
            generalTools.disableButtons("#changePassword");
            application.navigate("view/personalSettings.html");
        }
    };

    changePassword.cancel = function () {
        $("#old")[0].value = "";
        $("#new")[0].value = "";
        $("#confirm")[0].value = "";
        generalTools.disableButtons("#changePassword");
        application.navigate("view/personalSettings.html");
    };

    changePassword.initialize = function () {
        //setup menu
        var menu = $("#changePassword").find(".settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu();

        generalTools.observeInput($("#changePassword").find("input"), function () {
            generalTools.enableButtons("#changePassword");
        });

        changePassword.validator = $("#changePasswordForm").kendoValidator({
            rules: {
                custom: function (input) {
                    return (input.is("[name=confirm]") && input.val() === $("#new")[0].value) || !(input.is("[name=confirm]"));
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