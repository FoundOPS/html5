// Copyright 2012 FoundOPS LLC. All Rights Reserved.
/**
 * @fileoverview Class to hold personal settings logic.
 */
"use strict";

define(['jquery', 'lib/jquery-ui-1.8.21.core.min', 'lib/jcrop', 'db/services', 'lib/cordova', 'lib/jquery.FileReader', 'lib/swfobject'], function (jquery, jui, j, services, c, f, s) {
    var personalSettings = {};
    var crop;

    var viewModel = kendo.observable({
        saveChanges: function () {
            services.updatePersonalSettings(this.get("settings"));
        }
    });
    personalSettings.viewModel = viewModel;

    //make sure the image fits into desired area
    personalSettings.resize = function () {
        var cropbox = $("#cropbox");
        //get the original dimensions of the image
        var width = cropbox[0].width;
        var height = cropbox[0].height;
        //get the ratio for each dimension
        var w = 200 / width;
        var h = 200 / height;
        //find the lowest ratio(will be the shortest dimension)
        var ratio = Math.min(w, h);
        //use the ratio to set the new dimensions
        personalSettings.newW = ratio * width;
        personalSettings.newH = ratio * height;
        personalSettings.ratio = ratio;

        //set the largest dimension of the image to be the desired size
        if (width > height) {
            cropbox.attr("width", personalSettings.newW);
        } else {
            cropbox.attr("height", personalSettings.newH);
        }
        //center the image
        var margin = (320 - personalSettings.newW) / 2;
        if (crop) {
            $(".jcrop-holder").css("marginLeft", margin + "px");
        } else {
            cropbox.css("marginLeft", margin + "px");
        }
        return cropbox;
    };

    personalSettings.initialize = function () {
        console.log("initialize");

        var fileLoaded = function (evt) {
            console.log("fileLoaded");

            var imageData = evt.target.result;

            if (imageData == null)
                return;

            var cropbox = $("#cropbox");

            //remove the image crop if one already exists
            if (crop) {
                crop.destroy();
                //remove it's height and width(neccesary for the new image to be correct size)
                cropbox.removeAttr("height").removeAttr("width").removeAttr("style");
            }
            //set the source of the image element to be the newly uploaded image
            cropbox.attr("src", imageData);

            //make sure the image fits into desired area
            personalSettings.resize();

            //Setup the cropbox after the image's source is set
            crop = $.Jcrop('#cropbox', {
                //keep the crop area square
                aspectRatio: 1,
                onSelect: updateCoords,
                onChange: updateCoords,
                onRelease: updateCoords,
                //set a predefined crop area
                setSelect: [0, 0, personalSettings.newW, personalSettings.newH]
            });

            //if the Flash FileAPIProxy is being used, move the swf on top the moved input button
            if (window.FileAPIProxy !== null) {
                var input = $("#imageUpload");
                window.FileAPIProxy.container
                    .height(input.outerHeight())
                    .width(input.outerWidth())
                    .position({of: input});
            }

            //set a hidden form to the file image's data (because we stole it with FileReader)
            $('#imageData').val(imageData);
        };

        var reader = new FileReader();
        reader.onload = fileLoaded;

        //setup the FileReader on the imageUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        $("#imageUpload").fileReader({
            id: "fileReaderSWFObject",
            filereader: "../../lib/filereader.swf",
            debugMode: false,
            multiple: false
        });

        $("#imageUpload").on('change', function (evt) {
            var file = evt.target.files[0];
            //check that the file is an image
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                alert("Only .jpg, .png, and .gif files types allowed!");
                return;
            }
            //check that the image is no larger than 10MB
            if (file.size > 5000000) {
                alert("File is too large! Maximum allowed is 5MB.");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);
            //set the form value
            $('#imageFileName').val(file.name);
            //enable the "Crop Image" button
            $('#uploadBtn').removeAttr('disabled');
        });

        //set the form action to the update image url
        $('#imageUploadForm').attr("action", services.API_URL + "settings/UpdateUserImage");

        //update the position and size of the crop area
        function updateCoords(c) {
            //divide by the ratio to account for images that are larger than they appear
            $('#x').val(Math.round(c.x / personalSettings.ratio));
            $('#y').val(Math.round(c.y / personalSettings.ratio));
            $('#w').val(Math.round(c.w / personalSettings.ratio));
            $('#h').val(Math.round(c.h / personalSettings.ratio));
        }

        //retrieve the settings and bind them to the form
        services.getPersonalSettings(function (settings) {
            viewModel.set("settings", settings);
            kendo.bind($("#personal"), viewModel);
        });
    };

//set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;

    return personalSettings;
})
;