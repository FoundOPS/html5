// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "db/saveHistory", "tools/dateTools", "tools/parameters", "widgets/imageUpload", "widgets/selectBox"], function (dbServices, saveHistory, dateTools, parameters) {
    var personalSettings = {}, imageUpload, vm = kendo.observable();

    personalSettings.vm = vm;

    personalSettings.undo = function (state) {
        vm.set("userAccount", state);
        personalSettings.save();
    };

    personalSettings.save = function () {
        if (personalSettings.validator.validate() && personalSettings.validator2.validate()) {
            //need to exclude the roleId to update the current user account
            dbServices.userAccounts.update({excludeRoleId: true, body: vm.get("userAccount")});
        }
    };

    personalSettings.initialize = function () {
        //need to reset every time for when the role is changed, and the view is reloaded
        initializeTimeZones = true;

        personalSettings.validator = $("#personalForm").kendoValidator().data("kendoValidator");
        personalSettings.validator2 = $("#timeZoneForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#personal").find(".settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Personal"});

        saveHistory.saveInputChanges("#personal");

        //setup image upload
        imageUpload = $("#personalImageUpload").kendoImageUpload({
            imageWidth: 200
        }).data("kendoImageUpload");
    };

    var initializeTimeZones = true;

    personalSettings.show = function () {
        saveHistory.setCurrentSection({
            page: "Personal Settings",
            save: personalSettings.save,
            undo: personalSettings.undo,
            state: function () {
                return vm.get("userAccount");
            }
        });

        //retrieve the settings and bind them to the form
        dbServices.userAccounts.read({excludeRoleId: true}).done(function (userAccounts) {
            if (!userAccounts || !userAccounts[0])
                return;

            var currentUserAccount = userAccounts[0];

            vm.set("userAccount", currentUserAccount);
            kendo.bind($("#personal"), vm);

            //set the image url after it was initially loaded
            imageUpload.setImageUrl(vm.get("userAccount.ImageUrl"));

            imageUpload.setUploadUrl(dbServices.API_URL + "partyImage?roleId=" + parameters.get().roleId + "&id=" + currentUserAccount.Id);

            saveHistory.resetHistory();

            if (vm.get("userAccount.TimeZone")) {
                _.delay(function () {
                    //set the correct timezone
                    $("#TimeZone > .selectBox").children("*").each(function(index, element) {
                        element.removeAttribute("selected");
                    });
                    $("#TimeZone > .selectBox").children("[data-value='"+vm.get("userAccount.TimeZone.Id")+"']").attr("selected", true);
                }, 100);
            }
        });

        var formatTimeZoneName = function (timeZone) {
            return timeZone.DisplayName;
        };

        if (initializeTimeZones) {
            //get the list of timezones
            dbServices.timeZones.read().done(function (timeZones) {
                initializeTimeZones = false;

                var save = function (selectedOption) {
                    vm.set("userAccount.TimeZone", {DisplayName: selectedOption.name, Id: selectedOption.value});
                    personalSettings.save();
                }

                //Setup the timezone dropdown
                $("#TimeZone").selectBox({
                    data: timeZones,
                    dataTextField: "DisplayName",
                    onSelect: save});

                if (!vm.get("userAccount.TimeZone")) {
                    var timezone = dateTools.getLocalTimeZone().Id;
                    //set the correct timezone
                    $("#TimeZone > .selectBox").children("*").each(function(index, element) {
                        element.removeAttribute("selected");
                    });
                    $("#TimeZone > .selectBox").children("[data-value='"+timezone+"']").attr("selected", true);
                };
            });
        }
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;
});