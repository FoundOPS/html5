// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold business settings logic.
 */

"use strict";

define(["db/services", "developer", "ui/saveHistory, "ui/notifications", "session", "tools", "widgets/imageUpload", "widgets/settingsMenu"], function (dbServices, developer, saveHistory, notifications, session, tools, upload) {
    var businessSettings = {}, imageUpload;

    businessSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (businessSettings.validator.validate()) {
                dbServices.updateBusinessSettings(businessSettings.viewModel.get("settings"));
            }
            imageUpload.submitForm();
       },
        cancelChanges: function (e) {
            businessSettings.viewModel.set("settings", businessSettings.settings);
            imageUpload.setImageUrl(businessSettings.viewModel.get("settings.ImageUrl"));
            imageUpload.cancel();
        }
    });

    //add these so save and cancel can be called from the SaveCancel widget
    businessSettings.save = function () {
        businessSettings.viewModel.saveChanges();
    };
    businessSettings.cancel = function () {
        businessSettings.viewModel.cancelChanges();
    };

    businessSettings.initialize = function () {
        businessSettings.validator = $("#businessForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#business .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Business"});
   
        saveHistory.observeInput("#business");

        //retrieve the settings and bind them to the form
        dbServices.getBusinessSettings(function (settings) { 
            //set this so cancelChanges has a reference to the original settings
            businessSettings.settings = settings;
            businessSettings.viewModel.set("settings", settings);
            kendo.bind($("#business"), businessSettings.viewModel);
        });

        //setup image upload
        imageUpload = $("#businessImageUpload").kendoImageUpload({
            uploadUrl: dbServices.API_URL + "settings/UpdateBusinessImage",
            imageWidth: 200,
            containerWidth: 500
        }).data("kendoImageUpload");

        businessSettings.viewModel.bind("change", function (e) {
            if (e.field === "settings") {
                //update the image url after it has been set
                imageUpload.setImageUrl(businessSettings.viewModel.get("settings.ImageUrl"));
//saveHistory.error("File Type");
//saveHistory.error("File Size");
            }
        });

        //update the imageUploadUrl after the role has been set
        session.bind("change", function (e) {
            if (e.field === "role") {
                var roleId = session.get("role.id");
                if (!roleId) {
                    return;
                }
                imageUpload.setUploadUrl(dbServices.API_URL + "settings/UpdateBusinessImage?roleId=" + roleId);
            }

            saveHistory.setCurrentSection({
                page:"Business Settings",
                onSave: businessSettings.viewModel.saveChanges,
                onCancel: businessSettings.viewModel.cancelChanges,
                section: businessSettings,
                state: businessSettings.viewModel.get("settings")
            });v
        });
    };

    //set businessSettings to a global function, so the functions are accessible from the HTML element
    window.businessSettings = businessSettings;
});