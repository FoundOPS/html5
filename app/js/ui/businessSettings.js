// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold business settings logic.
 */

"use strict";

define(["db/services", "developer", "ui/saveHistory", "session", "widgets/imageUpload", "widgets/settingsMenu"], function (dbServices, developer, saveHistory, session) {
    var businessSettings = {}, imageUpload, vm = kendo.observable();

    businessSettings.vm = vm;

    businessSettings.undo = function (state) {
        vm.set("settings", state);
        imageUpload.setImageFields(state.imageData, state.imageFileName);
        imageUpload.submitForm();
        businessSettings.save();
    };

    businessSettings.save = function () {
        if (businessSettings.validator.validate()) {
            dbServices.updateBusinessSettings(vm.get("settings"));
        }
        imageUpload.submitForm();
    };

    businessSettings.initialize = function () {
        businessSettings.validator = $("#businessForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#business .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Business"});

        saveHistory.saveInputChanges("#business");

        //retrieve the settings and bind them to the form
        dbServices.getBusinessSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            businessSettings.settings = settings;
            vm.set("settings", settings);
            kendo.bind($("#business"), vm);
            saveHistory.resetHistory();
        });

        //setup image upload
        imageUpload = $("#businessImageUpload").kendoImageUpload({
            uploadUrl: dbServices.API_URL + "settings/UpdateBusinessImage",
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
                vm.set("settings.imageFileName", "resetImage.png");
                saveHistory.resetHistory();
            }
        });

        vm.bind("change", function (e) {
            if (e.field === "settings") {
                //update the image url after it has been set
                imageUpload.setImageUrl(vm.get("settings.ImageUrl"));
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
        });
    };

    businessSettings.show = function () {
        saveHistory.setCurrentSection({
            page: "Business Settings",
            save: businessSettings.save,
            undo: businessSettings.undo,
            state: function () {
                return vm.get("settings");
            }
        });
    };

    //set businessSettings to a global function, so the functions are accessible from the HTML element
    window.businessSettings = businessSettings;
});