// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold saveHistory logic.
 */

"use strict";

define(['lib/noty'], function () {
    var saveHistory = {};

    saveHistory.setCurrentSection = function (options) {
        saveHistory.close();
        saveHistory.options = options;
        saveHistory.states = [];
    };

    var successText = "Your Changes Have Been Saved.";
    var errorText = "Error - Your Changes May Not Have Been Saved";

    //opens a save changes notification with undo links
    saveHistory.success = function () {
        var text = successText;
        var timeout = 0;
        if (saveHistory.states.length !== 0) {
            if (saveHistory.multiple) {
                text += "&nbsp;&nbsp;&nbsp;<a onclick='window.saveHistory.cancel()'>Undo All Changes to " + saveHistory.options.page + "</a>&nbsp;&nbsp;&nbsp;<a onclick='window.saveHistory.options.section.undo()'>Undo Last Change</a>";
            } else {
                text += "&nbsp;&nbsp;&nbsp;<a onclick='window.saveHistory.cancel()'>Undo</a>";
            }
        } else {
            timeout = 5000;
        }

        $.noty({
            type: 'success',
            layout: 'topCenter',
            easing: 'swing',
            text: text,
            speed: 300,
            timeout: timeout,
            closeOnSelfClick: false
        });
    };

    /**
     * Opens an error notification
     * @param code The error text
     */
    saveHistory.error = function (code) {
        var text = errorText;
        if (code === "Conflict") {
            text = "Error - A User Already Exists With That Email Address";
        } else if (code === "Get") {
            text = "Connection Error";
        } else if (code === "File Size") {
            text = "File is Too Large! Maximum Allowed is 5MB.";
        } else if (code === "File Type") {
            text = "Only .JPG, .PNG, and .GIF Files Types Allowed!";
        }
        $.noty({
            type: 'error',
            layout: 'topCenter',
            easing: 'swing',
            text: text,
            speed: 300
        });
    };

    saveHistory.close = function () {
        $.noty.closeAll();
    };

    /**
     * Used for linking AJAX success, and failure
     * @param ajax
     * @return {*}
     */
    saveHistory.linkNotification = function (ajax) {
        return ajax.success(function () {
            saveHistory.success();
        }).error(function (data, textStatus, jqXHR) {
                saveHistory.error(jqXHR);
            });
    };

    saveHistory.save = function () {
        if (saveHistory.options.page !== "Dispatcher Settings") {
            var state = saveHistory.options.state();
            //deep copy
            state = jQuery.extend(true, {}, state);

            saveHistory.states.push(state);

            var numChanges = saveHistory.states.length;
            if (numChanges > 1) {
                saveHistory.multiple = true;
            } else {
                saveHistory.multiple = false;
            }
        }
        saveHistory.close();
        saveHistory.options.onSave();
    };

    saveHistory.cancel = function () {
        saveHistory.options.onCancel();
        saveHistory.states = [];
        saveHistory.options.onSave();
        saveHistory.close();
    };

    /**
     * watches all input elements on page for value change
     * param {string} pageDiv The id of the view. ex: "#personal"
     */
    saveHistory.observeInput = function (pageDiv) {
        $(pageDiv + ' input').each(function () {
            $(this).on("change", function () {
                _.delay(saveHistory.save, 200);
            });
        });
    };

    window.saveHistory = saveHistory;

    return saveHistory;
});