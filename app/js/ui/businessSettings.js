// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold business settings logic.
 */

"use strict";

define(["db/services", "developer", "ui/notifications", "session", "tools", "widgets/imageUpload", "widgets/settingsMenu"], function (dbServices, developer, notifications, session, tools, upload) {
    var businessSettings = {};

    businessSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (businessSettings.validator.validate()) {
                dbServices.updateBusinessSettings(this.get("settings"));
            }
            //upload image if it has been changed
            upload.submitForm();
        },
        cancelChanges: function (e) {
            businessSettings.viewModel.set("settings", businessSettings.settings);
            upload.setImageUrl(businessSettings.viewModel.get("settings.ImageUrl"));
            upload.cancel();

            //if there is no image, hide the container
            if (!e.data.settings.ImageUrl) {
                upload.hideImage();
            }
        }
    });

    businessSettings.initialize = function () {
        businessSettings.validator = $("#businessForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#business .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Business"});

        //retrieve the settings and bind them to the form
        dbServices.getBusinessSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            businessSettings.settings = settings;
            businessSettings.viewModel.set("settings", settings);
            kendo.bind($("#business"), businessSettings.viewModel);
            //if there is no image, hide the container
            if (!settings.ImageUrl) {
                upload.hideImage();
            }
        });

        //setup image upload
        var imageUpload = $("#businessImageUpload");
        kendo.bind(imageUpload);

        imageUpload.kendoImageUpload({
            uploadUrl: dbServices.API_URL + "settings/UpdateBusinessImage",
            imageWidth: 200,
            containerWidth: 500
        });

        businessSettings.viewModel.bind("change", function (e) {
            if(e.field == "settings"){
                //update the image url after it has been set
                upload.setImageUrl(businessSettings.viewModel.get("settings.ImageUrl"));
            }
        });

        var setupDataSourceUrls = function () {
            var roleId = session.get("role.id");
            if (!roleId) {
                return;
            }
            //set the roleId in the form action
            upload.setUploadUrl(dbServices.API_URL + "settings/UpdateBusinessImage?roleId=" + roleId);
        };
        //update the form url after the role has been set
        session.bind("change", function (e) {
            if (e.field == "role") {
                setupDataSourceUrls();
            }
        });
    };

    //set businessSettings to a global function, so the functions are accessible from the HTML element
    window.businessSettings = businessSettings;
});