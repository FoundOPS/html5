define(['lib/noty'], function () {
    var notifications = {};
    var successText = "Changes Saved";
    var errorText = "Error - Your Changes May Not Have Been Saved";

    notifications.success = function (code) {
        var text = successText;
        $.noty({
            type: 'success',
            layout: 'topCenter',
            easing: 'swing',
            text: text,
            speed: 300
        });
    };

    notifications.error = function (code) {
        var text = errorText;
        if (code === "Internal Server Error") {
            text = "Server Error";
        } else if (code === "Conflict") {
            text = "Error - A User Already Exists With That Email Address";
        } else if (code === "Get") {
            text = "Connection Error";
        } else if (code === "File Size") {
            text = "File Is Too Large! Maximum Allowed Is 5MB.";
        } else if (code === "File Type") {
            text = "Only .jpg, .png, and .gif Files Types Allowed!";
        } else if (code === "Image") {
            text = "Your Image May Not Have Saved Properly";
        }
        $.noty({
            type: 'error',
            layout: 'topCenter',
            easing: 'swing',
            text: text,
            speed: 300
        });
    };

    /*
     * Used for linking AJAX success, and failure
     */
    notifications.linkNotification = function (ajax) {
        return ajax.success(function (data, textStatus, jqXHR) {
            notifications.success(jqXHR);
        }).error(function (data, textStatus, jqXHR) {
                notifications.error(jqXHR);
            });
    };

    return notifications;
});