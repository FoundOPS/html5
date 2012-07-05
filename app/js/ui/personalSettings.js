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

    personalSettings.initialize = function () {
        //setup the FileReader on the imageUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        $("#imageUpload").fileReader({
            id: "fileReaderSWFObject",
            filereader: "../../lib/filereader.swf",
            debugMode: false,
            multiple: false
        });

        $("#imageUpload").on('change', function (evt) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                var imageData = evt.target.result;

                if (imageData == null)
                    return;

                if(crop){
                    crop.destroy();
                }
                var cropbox = $("#cropbox");
                cropbox.attr("src", imageData);

                //Setup the cropbox after the image's source is set
                crop = $.Jcrop('#cropbox',{
                    aspectRatio: 1,
                    onSelect: updateCoords,
                    onChange: updateCoords,
                    setSelect: [0, 0, 100, 100],
                    maxSize: [300, 300]
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

            var file = evt.target.files[0];
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                alert("Only .jpg, .png, and .gif files types allowed!");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);
            //set the form value
            $('#imageFileName').val(file.name);
            $('#uploadBtn').removeAttr('disabled');
        });

        $('#imageUploadForm').attr("action", services.API_URL + "settings/UpdateUserImage");

        function updateCoords(c) {
            $('#x').val(c.x);
            $('#y').val(c.y);
            $('#w').val(c.w);
            $('#h').val(c.h);
        }

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