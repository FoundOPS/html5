// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold quickbooks settings logic.
 */

"use strict";

define(["db/services", "db/session", "widgets/settingsMenu"], function (dbServices, session) {
    var quickbooksSettings = {};

    quickbooksSettings.initialize = function () {
        //setup menu
        var menu = $("#quickbooks .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "QuickBooks"});

        dbServices.getQuickbooksStatus(function (status) {
            quickbooksSettings.enabled = status.IsEnabled;
            quickbooksSettings.connected = status.IsConnected;
            if (quickbooksSettings.enabled) {
                $("#quickbooks .off").removeClass("active");
                $("#quickbooks .on").addClass("active");

                $("#quickbooks #status").attr("style", "display:block");

                if (quickbooksSettings.connected) {
                    $("#quickbooks #connect").attr("style", "display:none");
                    $("#quickbooks #connect span").attr("style", "color:#00ff00");

                    $("#quickbooks #status span")[0].innerText = "Active";
                } else {
                    $("#quickbooks #connect").attr("style", "display:block");
                }
            }
        });

        $("#quickbooks .on").on("click", function () {
            $("#quickbooks .off").removeClass("active");
            $("#quickbooks .on").addClass("active");

            $("#quickbooks #status").attr("style", "display:block");

            $("#quickbooks #connect").attr("style", "display:block");

            dbServices.updateQuickBooksStatus(true);
        });

        $("#quickbooks .off").on("click", function () {
            $("#quickbooks .on").removeClass("active");
            $("#quickbooks .off").addClass("active");

            $("#quickbooks #status, #quickbooks #connect").attr("style", "display:none");

            dbServices.updateQuickBooksStatus(false);
        });

        //load the intuit javascript (after the page loads)
        $.getScript("https://appcenter.intuit.com/Content/IA/intuit.ipp.anywhere.js", function () {
            session.followRole(function (role) {
                intuit.ipp.anywhere.setup({
                    //menuProxy: 'http://example.com/myapp/BlueDotMenu',
                    grantUrl: dbServices.ROOT_API_URL + "QuickBooks/OAuthGrantLogin?roleId=" + role.id
                });
            });
        });
    };

    //set businessSettings to a global function, so the functions are accessible from the HTML element
    window.quickbooksSettings = quickbooksSettings;
});