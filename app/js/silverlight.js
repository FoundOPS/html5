define(function () {
    var silverlight = {};

    silverlight.hide = function () {
        document.getElementById("silverlightControlHost").style.visibility = "hidden";
        document.getElementById("remoteContent").style.visibility = "visible";
    };

    silverlight.show = function () {
        document.getElementById("remoteContent").style.visibility = "hidden";
        document.getElementById("silverlightControlHost").style.visibility = "visible";
    };

    //Access function for silverlight to get around a security exception for Http Gets that do not have a crossdomainpolicy
    window.httpGet = function (url) {
        var img = new Image();
        img.src = url;
    };

    window.onSilverlightPluginLoaded = function (sender, args) {
        silverlight.plugin = document.getElementById('silverlightPlugin').Content;
        $(silverlight).trigger('loaded');
    };

    //TODO MOVE TO NATIVE
    window.openUserVoice = function () {
        UserVoice.showPopupWidget();
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

    return silverlight;
});