// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold saveHistory logic.
 */

"use strict";

define(['underscore', 'tools/generalTools', 'noty'], function (_, generalTools) {
    var saveHistory = {}, successText = "Your Changes Have Been Saved.", errorText = "Error - Your Changes May Not Have Been Saved", undoEnabled = true;

    //Stores the states of the current section
    //the first state is the initial state
    saveHistory.states = [];

    /**
     * Close any save popup, hookup options
     * @param {{page: string, save: function(), undo: function(bool), state: function():Object}} options
     * page: The name of the page.
     * save: A function to trigger saving the data.
     * undo: A function to undo changes. Takes a bool cancelEverything. If set to true, it will revert back to the initial state.
     * state: A function to get the section's state.
     */
    saveHistory.setCurrentSection = function (options) {
        saveHistory.close();
        saveHistory.options = options;
        saveHistory.resetHistory();
    };

    /**
     * Enable or disable undo functionality
     * @param isEnabled
     */
    saveHistory.setUndoEnabled = function (isEnabled) {
        //if it just became enabled, reset the undo history
        if (!undoEnabled && isEnabled) {
            saveHistory.resetHistory();
        }

        undoEnabled = isEnabled;
    };

    //opens a save changes notification with undo links
    saveHistory.success = function (text) {
        if (!text) {
            text = successText;
        }

        var timeout = 0;

        //if there are changes to undo
        if (undoEnabled && saveHistory.states.length > 1) {
            var numChanges = saveHistory.states.length - 1;

            if (numChanges > 1) {
                text += "&nbsp;&nbsp;&nbsp;<br/><a onclick='saveHistory.undo(true)' style='position:relative; top:3px;'>Undo All Changes to " + saveHistory.options.page + "</a>&nbsp;&nbsp;&nbsp;<br/><a onclick='saveHistory.undo(false)' style='position:relative; top:4px;'>Undo Last Change</a>";
            } else {
                text += "&nbsp;&nbsp;&nbsp;<a onclick='saveHistory.undo(true)'>Undo</a>";
            }

            timeout = 5000;
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
        } else if (code === "No Client") {
            text = "You Must Select a Client";
        } else if (code === "No Location") {
            text = "You Must Select a Location";
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

    /**
     * Reset states to the initial state
     */
    saveHistory.resetHistory = function () {
        saveHistory.states = [];
        if (saveHistory.options.state) {
            var state = saveHistory.options.state();
            if (!state) {
                return;
            }
            //deep copy
            state = generalTools.deepClone(state);
            saveHistory.states.push(state);
        }
    };

    saveHistory.save = _.debounce(function () {
        //save the state (if there is a function to get it)
        if (saveHistory.options.state) {
            var state = saveHistory.options.state();
            if (!state) {
                return;
            }
            //deep copy
            state = generalTools.deepClone(state);

            saveHistory.states.push(state);
        }

        saveHistory.close();
        saveHistory.options.save();
    }, 200);

    /**
     * A function to undo changes
     * @param cancelAll If set to true, it will revert back to the initial state
     */
    saveHistory.undo = function (cancelAll) {
        saveHistory.states.pop();
        var state;
        if (!cancelAll) {
            state = saveHistory.states[saveHistory.states.length - 1];
        } else {
            state = saveHistory.states[0];
            //clear the states
            saveHistory.states = [];
            //add the initial state
            saveHistory.states.push(state);
        }

        saveHistory.close();

        //trigger the undo function on the current section
        saveHistory.options.undo(state);
    };

    /**
     * Watches all input elements on page for value change. Then triggers a save.
     * param {string} pageDiv The id of the view. ex: "#personal"
     */
    saveHistory.saveInputChanges = function (pageDiv) {
        $(pageDiv + ' input,' + pageDiv + ' textarea').each(function () {
            $(this).on("change", function () {
                _.delay(function () {
                    saveHistory.save();
                }, 200);
            });
        });
    };

    window.saveHistory = saveHistory;

    return saveHistory;
});