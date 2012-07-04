// Copyright 2012 FoundOPS LLC. All Rights Reserved.
/**
 * @fileoverview Class to hold personal settings logic.
 */
"use strict";

define(['jquery', 'lib/jcrop', 'db/services', 'lib/cordova'], function (jquery, j, services, c) {
    var personalSettings = {};

    personalSettings.imageUrl = function(){
//      return " localhost:9711/api/Settings/UpdateUserImage?x='+personalSettings.x +'&y='&w=&h"
    };

    personalSettings.displayImage = function (evt){
        var files = evt.files;
        var reader = new FileReader();

        reader.onload = (function(theFile){
            return function(e){
                $("#cropbox").attr("src", e.target.result).attr("style", "display:block;margin-bottom:-300px");
                $("#image").attr("src", e.target.result);
                personalSettings.imageData = e.target.result;
            };
        })(files[0]);
        reader.readAsDataURL(files[0]);
    }

    var updateImage = function (){
        var upload = $("#photos").data("kendoUpload");
        var x = $('#x')[0].value;
        var y = $('#y')[0].value;
        var w = $('#w')[0].value;
        var h = $('#h')[0].value;

        services.updateUserImage(personalSettings.imageData, x, y, w, h), function (e) {
            if (e) {
                alert('tada!');
            }
        }
    };

    var viewModel = kendo.observable({
        saveChanges: function(){
            var that = this;

            services.updatePersonalSettings(that.get("settings"), function (e) {
                if (e) {
                    alert('tada!');
                }
            });
        }
    });
    personalSettings.viewModel = viewModel;

    personalSettings.initialize = function () {
        $("#photos").kendoUpload({
            multiple: false
        });

        $(function ($) {
            $('#cropbox').Jcrop({
                aspectRatio: 1,
                onSelect: updateCoords,
                onChange: updateCoords,
                setSelect: [30, 10, 150, 150],
                //set the max viewing size
                boxWidth: 300,
                boxHeight: 300,
                maxSize: [300, 300]
            });
        });
        function updateCoords(c) {
            $('#x').val(c.x);
            $('#y').val(c.y);
            $('#w').val(c.w);
            $('#h').val(c.h);
        }
        personalSettings.checkCoords = function () {
            if (parseInt($('#w').val()) > 0) {
                updateImage();
                return true;
            }
            alert('Please select a crop region then press submit.');
            return false;
        };

        services.getPersonalSettings(function (settings) {
            viewModel.set("settings", settings);
            kendo.bind($("#personal"), viewModel);
        });
    };

    //set personalSettings to a global function, so the functions are accessible from the HTML element
    window.personalSettings = personalSettings;

    return personalSettings;
});