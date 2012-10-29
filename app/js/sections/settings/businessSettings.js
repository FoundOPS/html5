// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold business settings logic.
 */

"use strict";

define(["db/services", "db/saveHistory", "tools/parameters", "widgets/imageUpload", "widgets/settingsMenu"], function (dbServices, saveHistory, parameters) {
    var businessSettings = {}, imageUpload, vm = kendo.observable();

    businessSettings.vm = vm;

    businessSettings.undo = function (state) {
        vm.set("settings", state);
        businessSettings.save();
    };

    businessSettings.save = function () {
        if (businessSettings.validator.validate()) {
            dbServices.businessAccounts.update({body: vm.get("settings")});
        }
    };

    businessSettings.initialize = function () {
        businessSettings.validator = $("#businessForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#business").find(".settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Business"});

        saveHistory.saveInputChanges("#business");

        //retrieve the settings and bind them to the form
        dbServices.businessAccounts.read().done(function (settings) {
            settings = settings[0];
            //set this so cancelChanges has a reference to the original settings
            businessSettings.settings = settings;
            vm.set("settings", settings);
            kendo.bind($("#business"), vm);

            //set the image url after it was initially loaded
            imageUpload.setImageUrl(vm.get("settings.ImageUrl"));
            imageUpload.setUploadUrl(dbServices.API_URL + "partyImage?roleId=" + parameters.get().roleId + "&id=" + settings.Id);

            saveHistory.resetHistory();
        });

        //setup image upload
        imageUpload = $("#businessImageUpload").kendoImageUpload({
            uploadUrl: dbServices.API_URL + "settings/UpdateBusinessImage",
            imageWidth: 200,
            containerWidth: 500
        }).data("kendoImageUpload");
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