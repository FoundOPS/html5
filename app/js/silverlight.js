'use strict';

define(['underscore', 'db/services', 'session'], function (dbservices, session) {
    var silverlight = {}, currentSection;

    window.silverlight = silverlight;

    //region private

    //resize the silverlight container to the proper size according to the window size
    var resizeContainers = function () {
        //from navigator.less: navHeight = 45px
        var height = $(window).height() - 45;
        var width = $("#content").width();
        $("#silverlightControlHost").height(height);
        $("#silverlightControlHost").width(width);
        $("#remoteContent").height(height);
        $("#remoteContent").width(width);
    };
    $(window).resize(resizeContainers);

    //endregion

    //region functions for the silverlight object

    window.onSilverlightPluginLoaded = function (sender, args) {
        silverlight.plugin = document.getElementById('silverlightPlugin').Content;
    };
    window.onSilverlightError = function (sender, args) {
        var appSource = "";
        if (sender != null && sender != 0) {
            appSource = sender.getHost().Source;
        }

        var errorType = args.ErrorType;
        var iErrorCode = args.ErrorCode;

        if (errorType == "ImageError" || errorType == "MediaError") {
            return;
        }

        var errMsg = "Unhandled Error in Silverlight Application " + appSource + "\n";

        errMsg += "Code: " + iErrorCode + "    \n";
        errMsg += "Category: " + errorType + "       \n";
        errMsg += "Message: " + args.ErrorMessage + "     \n";

        if (errorType == "ParserError") {
            errMsg += "File: " + args.xamlFile + "     \n";
            errMsg += "Line: " + args.lineNumber + "     \n";
            errMsg += "Position: " + args.charPosition + "     \n";
        }
        else if (errorType == "RuntimeError") {
            if (args.lineNumber != 0) {
                errMsg += "Line: " + args.lineNumber + "     \n";
                errMsg += "Position: " + args.charPosition + "     \n";
            }
            errMsg += "MethodName: " + args.methodName + "     \n";
        }

        //for chrome
        console.log(errMsg);

        //for IE
        throw new Error(errMsg);

        dbservices.trackError(errMsg, currentSection, session.getRole().name);
    };
    window.onSourceDownloadProgressChanged = function (sender, eventArgs) {
        var myText = sender.findName("progressText");
        myText.Text = (Math.round(eventArgs.progress * 100)).toString();
        var myBar = sender.findName("ProgressBarTransform");
        myBar.ScaleX = eventArgs.progress;
    };

    //#endregion

    //region functions only accessed by the silverlight application when it is loaded

    silverlight.onLoaded = function () {
        silverlight.updateRole();
        //if there is a current section, navigate to it
        if (currentSection) {
            silverlight.navigate(currentSection);
        }

        $(silverlight).trigger('loaded');
    };

    //for silverlight to get around a security exception with
    //cross-domain Http Gets that do not have a crossdomainpolicy
    //this is for invoking totango tracking events
    silverlight.httpGetImage = function (url) {
        var img = new Image();
        img.src = url;
    };

    //endregion

    /**
     * Hide the silverlight plugin
     */
    silverlight.hide = function () {
        //TODO try 0px
        //instead of hiding the silverlight (which will disable it), make it really small
//        $("#silverlightControlHost").css("display", "none");
        $("#silverlightPlugin").css("height", "1px");
        $("#silverlightPlugin").css("width", "1px");

        $("#remoteContent").css("display", "");
    };

    /**
     * Show the silverlight plugin
     */
    silverlight.show = function () {
        //show the silverlight client
        $("#silverlightControlHost").css("display", "");
        $("#silverlightPlugin").css("height", "100%");
        $("#silverlightPlugin").css("width", "100%");

        $("#remoteContent").css("display", "none");
        _.delay(resizeContainers, 150);
    };

    /**
     * Navigate to a section
     * @param {string}  sectionName
     */
    silverlight.navigate = function (sectionName) {
        currentSection = sectionName;

        try {
            silverlight.show();
            silverlight.plugin.navigationVM.NavigateToView(sectionName);
        } catch (err) {
        }
    };

    /**
     * Update the silverlight app's role to the session's selected role
     * @param {{id: string}} role
     */
    silverlight.updateRole = function () {
        try {

            var selectedRole = session.getRole();
            if (selectedRole) {
                silverlight.plugin.navigationVM.ChangeRole(selectedRole.id);
            }
        } catch (err) {
        }
    };

    resizeContainers();
    silverlight.hide();

    return silverlight;
});