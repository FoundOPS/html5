// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold quickbooks settings logic.
 */

"use strict";

define(["widgets/settingsMenu"], function () {
    var quickbooksSettings = {};

    quickbooksSettings.initialize = function () {
        //setup menu
        var menu = $("#quickbooks .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "QuickBooks"});

        $("#quickbooks .on").on("click", function () {
            $("#quickbooks .off").removeClass("active");
            $("#quickbooks .on").addClass("active");
        });

        $("#quickbooks .off").on("click", function () {
            $("#quickbooks .on").removeClass("active");
            $("#quickbooks .off").addClass("active");
        });

        $("#quickbooks .off, #quickbooks .on").on("click", function () {
            if($("#quickbooks .on-off .active")[0].text == "On"){
                $("#quickbooks #enabledContent").attr("style", "display:block");
            }else{
                $("#quickbooks #enabledContent").attr("style", "display:none");
            }
        });
    };

    //set businessSettings to a global function, so the functions are accessible from the HTML element
    window.quickbooksSettings = quickbooksSettings;
});