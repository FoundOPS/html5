// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to create password.
 */

"use strict";

define(["db/services", "ui/notifications", "widgets/settingsMenu"], function (services, notifications) {
    var createPassword = {};

    createPassword.save = function (){
        var newPass = $("#createNew")[0].value;
        var confirmPass = $("#createConfirm")[0].value;
        if(createPassword.validator.validate){
            services.createPassword(newPass, confirmPass)
                .success(function (data, textStatus, jqXHR) {
                    notifications.success(jqXHR);
                }).error(function (data, textStatus, jqXHR) {
                    notifications.error(jqXHR);
                });
            $("#createNew")[0].value = "";
            $("#createConfirm")[0].value = "";
        }
    };

    createPassword.initialize = function () {
        //setup menu
        var menu = $("#createPass .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu();

        createPassword.validator = $("#createPassForm").kendoValidator({
            rules: {
                custom: function(input){
                    return (input.is("[name=createConfirm]") && input.val() === $("#createNew")[0].value) || !(input.is("[name=createConfirm]"))
                }
            },
            messages: {
                custom: "The passwords do not match."
            }
        }).data("kendoValidator");
    };

    window.createPassword = createPassword;

    return createPassword;
});