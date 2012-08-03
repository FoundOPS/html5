// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "ui/saveHistory", "tools", "widgets/imageUpload"], function (dbServices, saveHistory, tools) {
    var personalSettings = {}, imageUpload, vm = kendo.observable();

    personalSettings.vm = vm;

    personalSettings.undo = function (state) {
        vm.set("settings", state);
        imageUpload.setImageFields(state.imageData, state.imageFileName);
        imageUpload.submitForm();
        personalSettings.save();
    };

    personalSettings.save = function () {
        if (personalSettings.validator.validate() && personalSettings.validator2.validate()) {
            dbServices.updatePersonalSettings(vm.get("settings"));
        }
        imageUpload.submitForm();
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
        dbServices.getPersonalSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            personalSettings.settings = settings;
            vm.set("settings", settings);
            kendo.bind($("#personal"), vm);

            //get the list of timezones
            dbServices.getTimeZones(function (timeZones) {
                personalSettings.timeZones = timeZones;

                $("#TimeZone").kendoDropDownList({
                    dataSource: personalSettings.timeZones,
                    dataTextField: "DisplayName",
                    dataValueField: "TimeZoneId"
                });

                if (!vm.get("settings.TimeZoneInfo")) {
                    var timezone = tools.getLocalTimeZone();

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

        imageUpload.bind("uploaded", function (e) {
            vm.set("settings.imageData", e.data);
            vm.set("settings.imageFileName", e.fileName);
        });

        var img = imageUpload.cropBox.get(0);
        imageUpload.cropBox.on("load", function () {
            //if the image data was not set on the settings (on the first load), create it from the image
            //http://stackoverflow.com/questions/934012/get-image-data-in-javascript
            if (vm.get("settings.imageData") == null) {
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                var data = canvas.toDataURL("image/png");
                data = data.replace(/^data:image\/(png|jpg|gif);base64,/, "");

                vm.set("settings.imageData", data);
                vm.set("settings.imageFileName", "newImage.png");
                saveHistory.resetHistory();
            }
        });

        vm.bind("change", function (e) {
            if (e.field === "settings") {
                //update the image url after it has been set
                imageUpload.setImageUrl(vm.get("settings.ImageUrl"));
            }
        });
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