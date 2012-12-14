// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to change password.
 */

"use strict";

define(["db/services", "tools/generalTools", "widgets/settingsMenu"], function (dbServices, generalTools) {
    var changePassword = {};

    changePassword.save = function () {
        var oldPass = $("#oldPass")[0];
        var newPass = $("#newPass")[0];
        var confirmPass = $("#confirmPass")[0];
        var oldVal = oldPass.value;
        var newVal = newPass.value;
        var confirmVal = confirmPass.value;
        if (changePassword.validator.validate) {
            dbServices.userAccounts.update({excludeRoleId: true, params: {oldPass: oldVal, newPass: newVal}});
            oldPass.value = "";
            newPass.value = "";
            confirmPass.value = "";
            generalTools.disableButtons("#changePassword");
            application.navigate("view/personalSettings.html");
        }
    };

    changePassword.cancel = function () {
        $("#oldPass")[0].value = "";
        $("#newPass")[0].value = "";
        $("#confirmPass")[0].value = "";
        generalTools.disableButtons("#changePassword");
        application.navigate("view/personalSettings.html");
    };

    changePassword.initialize = function () {
        //setup menu
        var passPage = $("#changePassword");
        var menu = passPage.find(".settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu();

        generalTools.observeInput(passPage.find("input"), function () {
            var newPass = $("#newPass")[0].value;
            var confirmPass = $("#confirmPass")[0].value;

            if (changePassword.validator.validate && $("#oldPass")[0].value !== "" && newPass !== "" && confirmPass !== ""
                 && newPass.length > 7 && confirmPass.length > 7 && newPass === confirmPass) {
                generalTools.enableButtons("#changePassword");
            }
        });

        changePassword.validator = $("#changePasswordForm").kendoValidator({
            rules: {
                oldExists: function (input) {
                    return (input.is("[name=oldPass]") && input.val() !== "") || !(input.is("[name=oldPass]"));
                },
                newExists: function (input) {
                    return (input.is("[name=newPass]") && input.val() !== "") || !(input.is("[name=newPass]"));
                },
                confirmExists: function (input) {
                    return (input.is("[name=confirmPass]") && input.val() !== "") || !(input.is("[name=confirmPass]"));
                },
                match: function (input) {
                    return (input.is("[name=confirmPass]") && input.val() === $("#newPass")[0].value) || !(input.is("[name=confirmPass]"));
                },
                newLength: function (input) {
                    return (input.is("[name=newPass]") && input[0].value.length >= 8) || !(input.is("[name=newPass]"));
                }
            },
            messages: {
                oldExists: "Old password is required.",
                newExists: "New password is required.",
                confirmExists: "Confirm password is required.",
                match: "The passwords do not match.",
                newLength: "Must be at least 8 characters long."
            }
        }).data("kendoValidator");
    };

    changePassword.show = function () {
        $(".k-invalid-msg").attr("style", "display:none");
    };

    window.changePassword = changePassword;

    return changePassword;
});