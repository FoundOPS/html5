// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "db/saveHistory", "tools/dateTools", "widgets/imageUpload"], function (dbServices, saveHistory, dateTools) {
    var personalSettings = {}, imageUpload, vm = kendo.observable();

    personalSettings.vm = vm;

    personalSettings.undo = function (state) {
        vm.set("settings", state);
        personalSettings.save();
    };

    personalSettings.save = function () {
        if (personalSettings.validator.validate() && personalSettings.validator2.validate()) {
            dbServices.userAccounts.update(null, vm.get("settings"));
        }
    };

    personalSettings.initialize = function () {
        personalSettings.validator = $("#personalForm").kendoValidator().data("kendoValidator");
        personalSettings.validator2 = $("#timeZoneForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#personal .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Personal"});

        saveHistory.saveInputChanges("#personal");

        //retrieve the settings and bind them to the form
        dbServices.userAccounts.read({onlyCurrentUser: true}).done(function (userAccounts) {
            if (!userAccounts || !userAccounts[0])
                return;

            var currentUserAccount = userAccounts[0];

            vm.set("settings", currentUserAccount);
            kendo.bind($("#personal"), vm);

            //set the image url after it was initially loaded
            imageUpload.setImageUrl(vm.get("settings.ImageUrl"));

            //get the list of timezones
            dbServices.timeZones.read().done(function (timeZones) {
                $("#TimeZone").kendoDropDownList({
                    dataSource: timeZones,
                    dataTextField: "DisplayName",
                    dataValueField: "TimeZoneId"
                });

                if (!vm.get("settings.TimeZoneInfo")) {
                    var timezone = dateTools.getLocalTimeZone();

                    var dropDownList = $("#TimeZone").data("kendoDropDownList");
                    dropDownList.select(function (dataItem) {
                        return dataItem.DisplayName === timezone.DisplayName;
                    });
                }

                saveHistory.resetHistory();
            });
        });

        //setup image upload
        imageUpload = $("#personalImageUpload").kendoImageUpload({
            uploadUrl: dbServices.API_URL + "settings/UpdateUserImage",
            imageWidth: 200,
            containerWidth: 500
        }).data("kendoImageUpload");
    };

    personalSettings.show = function () {
        saveHistory.setCurrentSection({
            page: "Personal Settings",
            save: personalSettings.save,
            undo: personalSettings.undo,
            state: function () {
                return vm.get("settings");
            }
        });
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;
});