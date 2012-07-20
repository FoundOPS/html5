define(['lib/noty'], function(){
    var notifications = {};
    var succesText = "Changes Saved";
    var errorText = "Error - Your Changes May Not Have Been Saved";

    notifications.success = function(code){
        var text = succesText;
        $.noty({
            type : 'success',
            layout : 'topCenter',
            easing : 'swing',
            text : text,
            speed : 300
        });
    };

    notifications.error = function(code){
        var text = errorText;
        if(code === "Internal Server Error"){
            text = "Server Error";
        }else if(code === "Conflict"){
            text = "Error - A User Already Exists With That Email Address";
        }else if(code === "Get"){
            text = "Connection Error";
        }
        $.noty({
            type : 'error',
            layout : 'topCenter',
            easing : 'swing',
            text : text,
            speed : 300
        });
    };

    return notifications;
});