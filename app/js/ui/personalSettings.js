// Copyright 2012 FoundOPS LLC. All Rights Reserved.
/**
 * @fileoverview Class to hold personal settings logic.
 */
"use strict";

define(['jquery', 'lib/jquery-ui-1.8.21.core.min', 'lib/jcrop', 'db/services', 'lib/cordova', 'lib/jquery.FileReader', 'lib/swfobject'], function (jquery, jui, j, services, c, f, s) {
    var personalSettings = {};

    var viewModel = kendo.observable({
        saveChanges: function () {
            services.updatePersonalSettings(this.get("settings"));
        }
    });
    personalSettings.viewModel = viewModel;

    personalSettings.initialize = function () {
        //TODO: add check if user doesn't already have an image
//        if(){
//            $(".jcrop-handle").attr("style", "display:block;");
//            $(".jcrop-dragbar").attr("style", "display:block;");
//        }

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

                $("#cropbox").attr("src", imageData).attr("style", "margin-bottom:-" + $("#cropbox")[0].width + "px;display:block;visibility:visible;");
                $("#image").attr("src", imageData).attr("height", $("#cropbox")[0].height).attr("width", $("#cropbox")[0].width);
                //$(".jcrop-handle").attr("style", "display:block;");
                //$(".jcrop-dragbar").attr("style", "display:block;");
                //personalSettings.imageData = evt.target.result;

                //set a hidden form to the file value (because we stole it with FileReader)
                $('#imageData').val(imageData);
            };

            var file = evt.target.files[0];
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                alert("Only .jpg, .png, and .gif files types allowed!");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);

            $('#fileName').text(file.name);

            //set the form value
            $('#imageFileName').val(file.name);
            $('#uploadBtn').removeAttr('disabled');
        });

        $('#cropbox').Jcrop({
            aspectRatio: 1,
            onSelect: updateCoords,
            onChange: updateCoords,
            setSelect: [0, 0, 100, 100],
            maxSize: [300, 300]
        });

        $('#imageUploadForm').attr("action", services.API_URL + "settings/UpdateUserImage");

        function updateCoords(c) {
            $('#x').val(c.x);
            $('#y').val(c.y);
            $('#w').val(c.w);
            $('#h').val(c.h);
        }

//        personalSettings.uploadImage = function () {
//            if (parseInt($('#w').val()) > 0) {
//                var x = $('#x')[0].value;
//                var y = $('#y')[0].value;
//                var w = $('#w')[0].value;
//                var h = $('#h')[0].value;
//
//                services.updateUserImage(personalSettings.imageData, x, y, w, h);
//                return true;
//            }
//            alert('Please select a crop region then press submit.');
//            return false;
//        };

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