// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(["db/services", "ui/notifications", "tools", "widgets/settingsMenu", "lib/jquery-ui-1.8.21.core.min",
    "lib/jquery.FileReader", "lib/swfobject", "lib/jquery.form"], function (dbServices, notifications, tools) {
    var personalSettings = {};

    //keep track of if a new image has been selected
    var newImage = false;

    personalSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (personalSettings.validator.validate()) {
                dbServices.updatePersonalSettings(this.get("settings"))
                    .success(function (data, textStatus, jqXHR) {
                        notifications.success(jqXHR);
                    }).error(function (data, textStatus, jqXHR) {
                        notifications.error(jqXHR);
                    });
            }
            //check if image has been changed and changes have not been canceled
            if (newImage && $("#imageData")[0].value != "") {
                $("#personalImageUploadForm").submit();
            }
        },
        cancelChanges: function (e) {
            personalSettings.viewModel.set("settings", personalSettings.settings);
            //clear the new image data
            $("#imageData")[0].value = "";
            $("#personalCropbox").css("width", personalSettings.imageWidth);
            $("#personalCropbox").css("height", personalSettings.imageHeight);
            personalSettings.resizeImage("#personalCropbox");
            //if there is no image, hide the container
            if (!e.data.settings.ImageUrl){
                $("#personalCropbox").css("visibility", "hidden").css("width", "0px").css("height", "0px")
                    .css("margin-left", "0px");
            }
        }
    });

    personalSettings.onImageLoad = function () {
        tools.resizeImage("#personalCropbox", 200, 500);
        if(!newImage){
            personalSettings.imageWidth = $("#personalCropbox")[0].width;
            personalSettings.imageHeight = $("#personalCropbox")[0].height;
        }
    };

    personalSettings.initialize = function () {
        personalSettings.validator = $("#personalForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#personal .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Personal"});

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
                var url = response.replace(/['"]/g,'');
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
        });
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;

    return personalSettings;
});