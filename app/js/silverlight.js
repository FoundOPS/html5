'use strict';

define(function () {
    var silverlight = {};

    window.silverlight = silverlight;

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
        //instead of hiding the silverlight (which will disable it), make it really small
        $("#silverlightPlugin").css("height", "1px");
        $("#silverlightPlugin").css("width", "1px");

        $("#remoteContent").css("display", "");
    };

    /**
     * Show the silverlight plugin
     */
    silverlight.show = function () {
        //show the silverlight client
        $("#silverlightPlugin").css("height", "100%");
        $("#silverlightPlugin").css("width", "100%");

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
        } catch (err) { }
    };

    /**
     * Change the current role
     * @param {{id: string}} role
     */
    silverlight.setRole = function (role) {
        try {
            silverlight.plugin.navigationVM.ChangeRole(role.id);
        } catch (err) { }
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

    silverlight.hide();

    return silverlight;
});