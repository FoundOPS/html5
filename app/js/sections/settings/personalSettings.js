// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "db/saveHistory", "tools/dateTools", "tools/parameters", "widgets/imageUpload", "widgets/selectBox"], function (dbServices, saveHistory, dateTools, parameters) {
    var personalSettings = {}, imageUpload, vm = kendo.observable(), timeZoneSelectBox;

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

        //updates the select box to the right time zone
        var syncTimeZone = function () {
            if (!timeZoneSelectBox) {
                return;
            }

            var userAccount = vm.get("userAccount");
            if (userAccount) {
                var timeZone = userAccount.get("TimeZone");
                if (!timeZone) {
                    timeZone = dateTools.getLocalTimeZone();
                }
                timeZoneSelectBox.select(timeZone)
            }
        };

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

            syncTimeZone();
        });

        if (initializeTimeZones) {
            //get the list of timezones
            dbServices.timeZones.read().done(function (timeZones) {
                initializeTimeZones = false;

                //Setup the timezone dropdown
                timeZoneSelectBox = $("#TimeZone").selectBox({
                    data: timeZones,
                    dataTextField: "DisplayName",
                    isEqual: function (a, b) {
                        return a.Id === b.Id;
                    },
                    onSelect: function (timeZone) {
                        vm.set("userAccount.TimeZone", timeZone);
                        personalSettings.save();
                    }
                }).data("selectBox");

                syncTimeZone();
            });
        }
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;
});