// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold personal settings logic.
 */

"use strict";

define(['jquery', 'lib/ajaxUpload'], function ($, upload) {
    var personalSettings = {};

    var thumb = $('#thumb');
    new AjaxUpload('imageUpload', {
        action: $('#newHotnessForm').attr('action'),
        name: 'image',
        onSubmit: function(file, extension) {
            $('#preview').addClass('loading');
        },
        onComplete: function(file, response) {
            thumb.load(function(){
                $('#preview').removeClass('loading');
                thumb.unbind();
            });
            thumb.attr('src', response);
        }
    });
});