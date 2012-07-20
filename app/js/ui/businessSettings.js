// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold business settings logic.
 */

"use strict";

define(["db/services", "developer", "ui/notifications", "widgets/settingsMenu", "lib/jquery-ui-1.8.21.core.min",
    "lib/jquery.FileReader", "lib/swfobject"], function (services, developer, notifications) {
    var businessSettings = {};

    //keep track of if a new image has been selected
    businessSettings.newImage = false;

    businessSettings.viewModel = kendo.observable({
        saveChanges: function () {
            if (businessSettings.validator.validate()) {
                services.updateBusinessSettings(this.get("settings"))
                    .success(function (data, textStatus, jqXHR) {
                        notifications.success(jqXHR);
                    }).error(function (data, textStatus, jqXHR) {
                        notifications.error(jqXHR);
                    });
            }
            //check if image has been changed
            if (businessSettings.newImage) {
                $("#businessImageUploadForm").submit();
            }
        },
        cancelChanges: function () {
            this.set("settings", businessSettings.settings);
            businessSettings.resize();
        }
    });

    //make sure the image fits into desired area
    businessSettings.resize = function () {
        var cropbox = $("#businessCropbox");
        //get the original dimensions of the image
        var width = cropbox[0].width;
        var height = cropbox[0].height;
        //get the ratio for each dimension
        var w = 200 / width;
        var h = 200 / height;
        //find the lowest ratio(will be the shortest dimension)
        var ratio = Math.min(w, h);
        //use the ratio to set the new dimensions
        var newW = ratio * width;
        var newH = ratio * height;

        //set the largest dimension of the image to be the desired size
        if (width > height) {
            cropbox.attr("width", newW);
        } else {
            cropbox.attr("height", newH);
        }
        //center the image
        var margin = (500 - newW) / 2;
        cropbox.css("marginLeft", margin + "px");
    };

    businessSettings.fixImageBtnPosition = function () {
        businessSettings.resize();

        //if the Flash FileAPIProxy is being used, move the swf on top the moved input button
        if (window.FileAPIProxy !== null) {
            var input = $("#businessImageUpload");
            window.FileAPIProxy.container
                .height(input.outerHeight())
                .width(input.outerWidth())
                .position({of: input});
        }
    };

    businessSettings.initialize = function () {
        businessSettings.validator = $("#businessForm").kendoValidator().data("kendoValidator");

        //TODO:
//        $("#businessImageUpload").on("mouseover", function(){
//            $(".upload").css("background-color", "#cccccc").css("border-color", "#aaaaaa");
//        });
//
//        $("#businessImageUpload").on("mouseout", function(){
//            $(".upload").css("background-color", "#e3e3e3").css("border-color", "#c5c5c5");
//        });

        //setup menu
        var menu = $("#business .settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Business"});

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
            $("#business .upload").css("margin-left", "185px").css("margin-bottom", "-15px");
            $("#businessCropbox").css("visibility", "visible").css("width", "auto").css("height", "auto");
            $("#businessImageUploadForm").css("margin-top", "0");
            $("#businessImageUpload").css("margin-top", "0");

            //set so that the save changes event will also save the image
            businessSettings.newImage = true;

            businessSettings.fixImageBtnPosition();
        };

        //setup the FileReader on the imageUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        $("#businessImageUpload").fileReader({
            id: "fileReaderSWFObject",
            filereader: "../../lib/filereader.swf",
            debugMode: false,
            multiple: false
        });

        $("#businessImageUpload").on('change', function (evt) {
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
            $('#business #imageFileName').val(file.name);
        });

        //set the form action to the update image url
        $('#businessImageUploadForm').attr("action", services.API_URL + "settings/UpdateBusinessImage?roleId=" + developer.GOTGREASE_ROLE_ID);

        //retrieve the settings and bind them to the form
        services.getBusinessSettings(function (settings) {
            //set this so cancelChanges has a reference to the original settings
            businessSettings.settings = settings;
            businessSettings.viewModel.set("settings", settings);
            kendo.bind($("#business"), businessSettings.viewModel);
            if(!settings.ImageUrl){
                $("#business .upload").css("margin-left", "181px").css("margin-bottom", "-15px");
                $("#businessCropbox").css("visibility", "hidden").css("width", "0px").css("height", "0px");
                $("#businessImageUploadForm").css("margin-top", "-22px");
                $("#businessImageUpload").css("margin-top", "5px");
            }
        });
    };

    window.businessSettings = businessSettings;
});