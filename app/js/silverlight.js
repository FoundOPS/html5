'use strict';

define(function () {
    var silverlight = {};

    window.silverlight = silverlight;

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

    //In case a section is not chosen start with the Dispatcher
    var currentSection = "Dispatcher";
    /**
     * Returns the current section. When the silverlight client loads, it will open this section.
     * @return {String}
     */
    silverlight.getCurrentSection = function () {
        return currentSection;
    };

    /**
     * Hide the silverlight plugin
     */
    silverlight.hide = function () {
        //TODO try 0px
        //instead of hiding the silverlight (which will disable it), make it really small
        $("#silverlightControlHost").css("display", "none");
        $("#silverlightPlugin").css("height", "0px");
        $("#silverlightPlugin").css("width", "0px");

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
        resizeContainers();

        $("#remoteContent").css("display", "none");
    };

    /**
     * Navigate to a section
     * @param {{name: string}}  section
     */
    silverlight.navigate = function (section) {
        silverlight.currentSection = section;

        try {
            silverlight.show();
            silverlight.plugin.navigationVM.NavigateToView(section.name);
        } catch (err) {
        }
    };

    /**
     * Change the current role
     * @param {{id: string}} role
     */
    silverlight.setRole = function (role) {
        try {
            silverlight.plugin.navigationVM.ChangeRole(role.id);
        } catch (err) {
        }
    };

    //#region Setup functions for the silverlight object
    window.onSilverlightPluginLoaded = function (sender, args) {
        silverlight.plugin = document.getElementById('silverlightPlugin').Content;
        $(silverlight).trigger('loaded');
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

        //TODO track this, then restart the app if it crashed
        throw new Error(errMsg);
    };
    window.onSourceDownloadProgressChanged = function (sender, eventArgs) {
        var myText = sender.findName("progressText");
        myText.Text = (Math.round(eventArgs.progress * 100)).toString();
        var myBar = sender.findName("ProgressBarTransform");
        myBar.ScaleX = eventArgs.progress;
    };
    //#endregion

    //This is for invoking totango tracking events
    //for silverlight to get around a security exception
    //with cross-domain Http Gets that do not have a crossdomainpolicy
    window.httpGetImage = function (url) {
        var img = new Image();
        img.src = url;
    };

    resizeContainers();
    silverlight.hide();

    return silverlight;
});