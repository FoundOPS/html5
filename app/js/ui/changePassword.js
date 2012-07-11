// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to change password.
 */

"use strict";

define(["developer", "db/services"], function (developer, services) {
    var changePassword = {};

    changePassword.initialize = function () {
        changePassword.save = function (){
            $("#passForm").submit();
        };
    };

    window.changePassword = changePassword;

    return changePassword;
});