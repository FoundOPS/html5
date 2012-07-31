// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "tools", "ui/saveHistory", "widgets/settingsMenu", "lib/jquery-ui-1.8.21.core.min",
    "lib/jquery.FileReader", "lib/swfobject", "lib/jquery.form"], function (dbServices, tools, saveHistory) {
    var personalSettings = {};

    //keep track of if a new image has been selected
    var newImage = false;

    personalSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (personalSettings.validator.validate() && personalSettings.validator2.validate()) {
                dbServices.updatePersonalSettings(personalSettings.viewModel.get("settings"));
            }
            //check if image has been changed and changes have not been canceled
            if (newImage && $("#imageData")[0].value != "") {
                $("#personalImageUploadForm").submit();
            }
        },
        cancelChanges: function () {
            personalSettings.viewModel.set("settings", personalSettings.settings);
            //clear the new image data
            $("#imageData")[0].value = "";
            $("#personalCropbox").css("width", personalSettings.imageWidth);
            $("#personalCropbox").css("height", personalSettings.imageHeight);
            tools.resizeImage("#personalCropbox");
            //if there is no image, hide the container
            if (!personalSettings.settings.ImageUrl) {
                $("#personalCropbox").css("visibility", "hidden").css("width", "0px").css("height", "0px")
                    .css("margin-left", "0px");
            }
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

    personalSettings.onImageLoad = function () {
        tools.resizeImage("#personalCropbox", 200, 500);
        if (!newImage) {
            personalSettings.imageWidth = $("#personalCropbox")[0].width;
            personalSettings.imageHeight = $("#personalCropbox")[0].height;
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

        var fileLoaded = function (evt) {
            var imageData = evt.target.result;

            if (imageData == null)
                return;

            var cropbox = $("#personalCropbox");
            //set the source of the image element to be the newly uploaded image
            cropbox.attr("src", imageData);

            //set a hidden form to the file image's data (because we stole it with FileReader)
            $('#personal #imageData').val(imageData);

            //show the image
            $("#personalCropbox").css("visibility", "visible").css("width", "auto").css("height", "auto")
                .css("margin-left", "0px");

            //set so that the save changes event will also save the image
            newImage = true;
            saveHistory.save();
            tools.resizeImage("#personalCropbox", 200, 500);
        };

        //setup the FileReader on the imageUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        $("#personalImageUploadButton").fileReader();

        $("#personalImageUploadButton").on('change', function (evt) {
            var reader = new FileReader();
            reader.onload = fileLoaded;

            var file = evt.target.files[0];
            //check that the file is an image
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                notifications.error("File Type");
                return;
            }
            //check that the image is no larger than 10MB
            if (file.size > 5000000) {
                notifications.error("File Size");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);
            //set the form value
            $('#personal #imageFileName').val(file.name);
            tools.resizeImage("#personalCropbox", 200, 500);
        });

        //setup the form
        $('#personalImageUploadForm').ajaxForm({
            //from http://stackoverflow.com/questions/8151138/ie-jquery-form-multipart-json-response-ie-tries-to-download-response
            dataType: "text",
            contentType: "multipart/form-data",
            url: dbServices.API_URL + "settings/UpdateUserImage",
            success: function (response) {
                var url = response.replace(/['"]/g, '');
                personalSettings.viewModel.get("settings").set("ImageUrl", url);
            }});

        //retrieve the settings and bind them to the form
        dbServices.getPersonalSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            personalSettings.settings = settings;
            personalSettings.viewModel.set("settings", settings);
            kendo.bind($("#personal"), personalSettings.viewModel);
            //if there is no image, hide the container
            if (!settings.ImageUrl) {
                $("#personalCropbox").css("visibility", "hidden").css("width", "0px").css("height", "0px");
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

    return personalSettings;
});