// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold business settings logic.
 */

"use strict";

define(["db/services", "developer", "ui/saveHistory", "session", "tools", "widgets/settingsMenu", "lib/jquery-ui-1.8.21.core.min",
    "lib/jquery.FileReader", "lib/swfobject"], function (dbServices, developer, saveHistory, session, tools) {
    var businessSettings = {};

    //keep track of if a new image has been selected
    var newImage = false;

    businessSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (businessSettings.validator.validate()) {
                dbServices.updateBusinessSettings(businessSettings.viewModel.get("settings"));
            }
            //check if image has been changed and changes have not been canceled
            if (newImage && $("#imageData")[0].value != "") {
                $("#businessImageUploadForm").submit();
            }
            //tools.disableButtons("#business");
        },
        cancelChanges: function (e) {
            businessSettings.viewModel.set("settings", businessSettings.settings);
            //clear the new image data
            $("#imageData")[0].value = "";
            $("#businessCropbox").css("width", businessSettings.imageWidth);
            $("#businessCropbox").css("height", businessSettings.imageHeight);
            tools.resizeImage("#businessCropbox", 200, 500);

            //if there is no image, hide the container
            if (!businessSettings.settings.ImageUrl) {
                $("#businessCropbox").css("visibility", "hidden").css("width", "0px").css("height", "0px")
                    .css("margin-left", "0px");
            }
            //tools.disableButtons("#business");
        }
    });

    //add these so save and cancel can be called from the SaveCancel widget
    businessSettings.save = function () {
        businessSettings.viewModel.saveChanges();
    };
    businessSettings.cancel = function () {
        businessSettings.viewModel.cancelChanges();
    };

    businessSettings.onImageLoad = function () {
        tools.resizeImage("#businessCropbox", 200, 500);

        if (!newImage) {
            businessSettings.imageWidth = $("#businessCropbox")[0].width;
            businessSettings.imageHeight = $("#businessCropbox")[0].height;
        }
    };

    businessSettings.initialize = function () {
        businessSettings.validator = $("#businessForm").kendoValidator().data("kendoValidator");

        //setup menu
        var menu = $("#business .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Business"});

        saveHistory.observeInput("#business");

        var fileLoaded = function (evt) {
            var imageData = evt.target.result;

            if (imageData == null)
                return;

            var cropbox = $("#businessCropbox");
            //set the source of the image element to be the newly uploaded image
            cropbox.attr("src", imageData);

            //set a hidden form to the file image's data (because we stole it with FileReader)
            $('#business #imageData').val(imageData);

            //show the image
            $("#businessCropbox").css("visibility", "visible").css("width", "auto").css("height", "auto");

            //set so that the save changes event will also save the image
            newImage = true;
            //tools.enableButtons("#business");

            tools.resizeImage("#businessCropbox", 200, 500);
        };

        //setup the FileReader on the imageUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        $("#businessImageUploadButton").fileReader();

        $("#businessImageUploadButton").on('change', function (evt) {
            var reader = new FileReader();
            reader.onload = fileLoaded;

            var file = evt.target.files[0];
            //check that the file is an image
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                saveHistory.error("File Type");
                return;
            }
            //check that the image is no larger than 10MB
            if (file.size > 5000000) {
                saveHistory.error("File Size");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);
            //set the form value
            $('#business #imageFileName').val(file.name);
            tools.resizeImage("#businessCropbox", 200, 500);
        });

        var setupDataSourceUrls = function () {
            var roleId = session.get("role.id");
            if (!roleId) {
                return;
            }
            //setup the form
            $('#businessImageUploadForm').ajaxForm({
                //from http://stackoverflow.com/questions/8151138/ie-jquery-form-multipart-json-response-ie-tries-to-download-response
                dataType: "text",
                contentType: "multipart/form-data",
                url: dbServices.API_URL + "settings/UpdateBusinessImage?roleId=" + roleId,
                success: function (response) {
                    var url = response.replace(/['"]/g, '');
                    businessSettings.viewModel.get("settings").set("ImageUrl", url);
                }});
        };
        //update the form url after the role has been set
        session.bind("change", function (e) {
            if (e.field == "role") {
                setupDataSourceUrls();
            }
        });

        //retrieve the settings and bind them to the form
        dbServices.getBusinessSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            businessSettings.settings = settings;
            businessSettings.viewModel.set("settings", settings);
            kendo.bind($("#business"), businessSettings.viewModel);
            //if there is no image, hide the container
            if (!settings.ImageUrl) {
                $("#businessCropbox").css("visibility", "hidden").css("width", "0px").css("height", "0px");
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