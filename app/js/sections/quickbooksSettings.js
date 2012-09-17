// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold quickbooks settings logic.
 */

"use strict";

define(["db/services", "db/session", "widgets/settingsMenu"], function (dbServices, session) {
    var quickbooksSettings = {}, countdownNum;

    var getStatus = function () {
        dbServices.getQuickbooksStatus(function (status) {
            quickbooksSettings.enabled = status.IsEnabled;
            quickbooksSettings.connected = status.IsConnected;
            if (quickbooksSettings.enabled) {
                //switch to "On"
                $("#quickbooks .off").removeClass("active");
                $("#quickbooks .on").addClass("active");
                //show the status
                $("#quickbooks #status").attr("style", "display:block");

                if (quickbooksSettings.connected) {
                    //hide the connect to quickbooks button
                    $("#quickbooks #connect").attr("style", "display:none");
                    //make the status text green
                    $("#quickbooks #connect span").attr("style", "color:#00ff00");
                    //change the status to "Active"
                    $("#quickbooks #status span")[0].innerText = "Active";
                    //clear the status checking text
                    $("#checking").innerText = "";
                } else {
                    //show the connect to quickbooks button
                    $("#quickbooks #connect").attr("style", "display:block");
                    //reset the countdown
                    countdownNum = 5;
                    countdown();
                }
            }
        });
    };

    //counts down from 5, then calls getStatus
    var countdown = function () {
        setTimeout(function(){
            $("#checking")[0].innerText = "Checking in " + countdownNum;
            //if countdown hasn't reached 0, keep couunting down
            if (countdownNum > 0) {
                countdown();
                countdownNum--;
                //if countdown reached 0, call getStatus
            }else{
                $("#checking")[0].innerText = "Checking...";
                getStatus();
            }
        }, 1000);
    };

    quickbooksSettings.initialize = function () {
        //setup menu
        var menu = $("#quickbooks .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "QuickBooks"});

        getStatus();

        $("#quickbooks .on").on("click", function () {
            //check if on is already active
            if($("#quickbooks .off.active")[0]){
                //switch to "Off"
                $("#quickbooks .off").removeClass("active");
                $("#quickbooks .on").addClass("active");
                //show the status
                $("#quickbooks #status").attr("style", "display:block");
                //show the connect to quickbooks button
                $("#quickbooks #connect").attr("style", "display:block");
                //update the status
                dbServices.updateQuickBooksStatus(true);
                //show the countdown
                $("#quickbooks #checking").attr("style", "display:block");
                getStatus();
            }
        });

        $("#quickbooks .off").on("click", function () {
            //check if off is already active
            if($("#quickbooks .on.active")[0]){
                //stop the countdown
                countdownNum = 0;
                //switch to "On"
                $("#quickbooks .on").removeClass("active");
                $("#quickbooks .off").addClass("active");
                //hide the connect to quickbooks button, the status, and the "checking" text
                $("#quickbooks #status, #quickbooks #connect, #quickbooks #checking").attr("style", "display:none");

                dbServices.updateQuickBooksStatus(false);
            }
        });

        //load the intuit javascript (after the page loads)
        $.getScript("https://appcenter.intuit.com/Content/IA/intuit.ipp.anywhere.js", function () {
            //bind to role changed event
            session.followRole(function (role) {
                //setup quickbooks
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