// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "ui/saveHistory", "widgets/imageUpload"], function (dbServices, saveHistory) {
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

    personalSettings.initialize = function () {
        personalSettings.validator = $("#personalForm").kendoValidator().data("kendoValidator");
        personalSettings.validator2 = $("#timeZoneForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#personal .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Personal"});

        saveHistory.observeInput("#personal");

//            saveHistory.save();
        //retrieve the settings and bind them to the form
        dbServices.getPersonalSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            personalSettings.settings = settings;
            personalSettings.viewModel.set("settings", settings);
            kendo.bind($("#personal"), personalSettings.viewModel);
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

            //get the list of timezones
            dbServices.getTimeZones(function (timeZones) {
                personalSettings.timeZones = timeZones;

                $("#TimeZone").kendoDropDownList({
                    dataSource: personalSettings.timeZones,
                    dataTextField: "DisplayName",
                    dataValueField: "TimeZoneId"
                });

                if (!personalSettings.viewModel.get("settings.TimeZoneInfo")) {
                    var today = new Date().toString();

                    var timezone;
                    if (today.match(/Eastern/)) {
                        timezone = "(UTC-05:00) Eastern Time (US & Canada)";
                    } else if (today.match(/Central/)) {
                        timezone = "(UTC-06:00) Central Time (US & Canada)";
                    } else if (today.match(/Mountain/)) {
                        timezone = "(UTC-07:00) Mountain Time (US & Canada)";
                    } else if (today.match(/Pacific/)) {
                        timezone = "(UTC-08:00) Pacific Time (US & Canada)";
                    } else if (today.match(/Alaska/)) {
                        timezone = "(UTC-09:00) Alaska";
                    } else if (today.match(/Hawaii/)) {
                        timezone = "(UTC-10:00) Hawaii";
                    }

                    var dropDownList = $("#TimeZone").data("kendoDropDownList");
                    dropDownList.select(function (dataItem) {
                        return dataItem.DisplayName === timezone;
                    });

                    saveHistory.save();
                }

                saveHistory.setCurrentSection({
                    page: "Personal Settings",
                    onSave: personalSettings.viewModel.saveChanges,
                    onCancel: personalSettings.viewModel.cancelChanges,
                    section: personalSettings,
                    state: function () {
                        return personalSettings.viewModel.get("settings");
                    }
                });
            });
        });
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;
});