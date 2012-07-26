// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "ui/notifications", "widgets/imageUpload", "widgets/settingsMenu"], function (dbServices, notifications, upload) {
    var personalSettings = {};

    personalSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (personalSettings.validator.validate()) {
                dbServices.updatePersonalSettings(this.get("settings"));
            }
            //upload image if it has been changed
            upload.submitForm();
        },
        cancelChanges: function (e) {
            personalSettings.viewModel.set("settings", personalSettings.settings);
            upload.setImageUrl(personalSettings.viewModel.get("settings.ImageUrl"));
            upload.cancel();

            //if there is no image, hide the container
            if (!e.data.settings.ImageUrl) {
                upload.hideImage();
            }
        }
    });

    personalSettings.initialize = function () {
        personalSettings.validator = $("#personalForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#personal .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Personal"});

        //retrieve the settings and bind them to the form
        dbServices.getPersonalSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            personalSettings.settings = settings;
            personalSettings.viewModel.set("settings", settings);
            kendo.bind($("#personal"), personalSettings.viewModel);
            //if there is no image, hide the container
            if (!settings.ImageUrl) {
                upload.hideImage();
            }
        });

        //setup image upload
        var imageUpload = $("#personalImageUpload");
        kendo.bind(imageUpload);

        imageUpload.kendoImageUpload({
            uploadUrl: dbServices.API_URL + "settings/UpdateUserImage",
            imageWidth: 200,
            containerWidth: 500
        });

        personalSettings.viewModel.bind("change", function (e) {
            if (e.field == "settings") {
                //update the image url after it has been set
                upload.setImageUrl(personalSettings.viewModel.get("settings.ImageUrl"));
            }
        });
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;
});