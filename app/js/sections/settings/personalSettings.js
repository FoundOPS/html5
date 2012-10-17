// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "db/saveHistory", "tools/dateTools", "underscore", "tools/parameters", "widgets/imageUpload"], function (dbServices, saveHistory, dateTools, _, parameters) {
    var personalSettings = {}, imageUpload, vm = kendo.observable();

    personalSettings.vm = vm;

    personalSettings.undo = function (state) {
        vm.set("userAccount", state);
        //set the correct timezone
        $("#TimeZone").select2("data", {Id: vm.get("userAccount.TimeZone").Id, DisplayName: vm.get("userAccount.TimeZone").DisplayName});
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
        var menu = $("#personal .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Personal"});

        saveHistory.saveInputChanges("#personal");

        //setup image upload
        imageUpload = $("#personalImageUpload").kendoImageUpload({
            imageWidth: 200,
            containerWidth: 500
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

            if (vm.get("userAccount.TimeZone")) {
                _.delay(function () {
                    //set the correct timezone
                    $("#TimeZone").select2("data", {Id: vm.get("userAccount.TimeZone").Id, DisplayName: vm.get("userAccount.TimeZone").DisplayName});
                }, 200);
            }
        });

        var formatTimeZoneName = function (timeZone) {
            return timeZone.DisplayName;
        };

        if (initializeTimeZones) {
            //get the list of timezones
            dbServices.timeZones.read().done(function (timeZones) {
                initializeTimeZones = false;

                //setup the timezone dropdown
                $("#TimeZone").select2({
                    width: "310px",
                    placeholder: "Select a timezone",
                    id: function (timeZone) {
                        return timeZone.Id;
                    },
                    query: function (query) {
                        if (!timeZones) {
                            timeZones = [];
                        }
                        var data = {results: timeZones};
                        query.callback(data);
                    },
                    formatSelection: formatTimeZoneName,
                    formatResult: formatTimeZoneName,
                    dropdownCssClass: "bigdrop",
                    minimumResultsForSearch: 15
                }).on("change", function () {
                        //set the vm with the new timezone
                        vm.set("userAccount.TimeZone", $("#TimeZone").select2("data"));
                    });

                if (!vm.get("userAccount.TimeZone")) {
                    var timezone = dateTools.getLocalTimeZone();
                    //set the correct timezone
                    $("#TimeZone").select2("data", {Id: timezone.Id, DisplayName: timezone.DisplayName});
                }
            });
        }
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;
});