// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "ui/saveHistory", "tools", "widgets/imageUpload"], function (dbServices, saveHistory, tools) {
    var personalSettings = {}, imageUpload;

    personalSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (personalSettings.validator.validate() && personalSettings.validator2.validate()) {
                dbServices.updatePersonalSettings(personalSettings.viewModel.get("settings"));
            }
            imageUpload.submitForm();
        },
        cancelChanges: function () {
            personalSettings.viewModel.set("settings", personalSettings.settings);
            imageUpload.setImageUrl(personalSettings.viewModel.get("settings.ImageUrl"));
            imageUpload.cancel();
        }
    });

    personalSettings.undo = function () {
        saveHistory.states.pop();
        if(saveHistory.states.length !== 0){
            personalSettings.viewModel.set("settings", saveHistory.states[saveHistory.states.length - 1]);
            if(saveHistory.states.length === 1){
                saveHistory.multiple = false;
                saveHistory.close();
                saveHistory.success();
            }
        }else{
            saveHistory.cancel();
        }
    };

    personalSettings.setupSaveHistory = function () {
        saveHistory.setCurrentSection({
            page: "Personal Settings",
            onSave: personalSettings.viewModel.saveChanges,
            onCancel: personalSettings.viewModel.cancelChanges,
            section: personalSettings,
            state: function () {
                return personalSettings.viewModel.get("settings");
            }
        });
    };

    personalSettings.initialize = function () {
        personalSettings.validator = $("#personalForm").kendoValidator().data("kendoValidator");
        personalSettings.validator2 = $("#timeZoneForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#personal .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Personal"});

        saveHistory.observeInput("#personal");

        //retrieve the settings and bind them to the form
        dbServices.getPersonalSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            personalSettings.settings = settings;
            personalSettings.viewModel.set("settings", settings);
            kendo.bind($("#personal"), personalSettings.viewModel);

            //get the list of timezones
            dbServices.getTimeZones(function (timeZones) {
                personalSettings.timeZones = timeZones;

                $("#TimeZone").kendoDropDownList({
                    dataSource: personalSettings.timeZones,
                    dataTextField: "DisplayName",
                    dataValueField: "TimeZoneId"
                });

                if (!personalSettings.viewModel.get("settings.TimeZoneInfo")) {
                    var timezone = tools.getLocalTimeZone();

                    var dropDownList = $("#TimeZone").data("kendoDropDownList");
                    dropDownList.select(function (dataItem) {
                        return dataItem.DisplayName === timezone.DisplayName;
                    });

                    saveHistory.save();
                }

                personalSettings.setupSaveHistory();
            });
        });

        //setup image upload
        imageUpload = $("#personalImageUpload").kendoImageUpload({
            uploadUrl: dbServices.API_URL + "settings/UpdateUserImage",
            imageWidth: 200,
            containerWidth: 500
        }).data("kendoImageUpload");

        personalSettings.viewModel.bind("change", function (e) {
            if (e.field === "settings") {
                //update the image url after it has been set
                imageUpload.setImageUrl(personalSettings.viewModel.get("settings.ImageUrl"));
            }
        });
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;
});