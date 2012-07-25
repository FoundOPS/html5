'use strict';

define(['db/services', 'session', 'underscore'], function (dbservices, session) {
    var silverlight = {}, currentSection;

    window.silverlight = silverlight;

    //region private

    //resize the silverlight container to the proper size according to the window size
    var resizeContainers = function () {
        if(!currentSection || !currentSection.isSilverlight){
            return;
        }
        //from navigator.less: navHeight = 45px
        var height = $(window).height() - 45;
        var width = $("#content").width();
        $("#silverlightControlHost").height(height);
        $("#silverlightControlHost").width(width);
        $("#remoteContent").height(height);
        $("#remoteContent").width(width);
    };

    //hide the silverlight plugin
    var hide = function () {
        $("#silverlightControlHost").css("height", "0px");
        $("#silverlightControlHost").css("width", "0px");

        //instead of hiding the silverlight (which will disable it), make it really small
        $("#silverlightPlugin").css("height", "1px");
        $("#silverlightPlugin").css("width", "1px");

        $("#remoteContent").css("display", "");
    };

    //show the silverlight plugin
    var show = function () {
        //show the silverlight client
        $("#silverlightPlugin").css("height", "100%");
        $("#silverlightPlugin").css("width", "100%");

        $("#remoteContent").css("display", "none");
        _.delay(resizeContainers, 150);
    };

    //Update the silverlight app's role to the session's selected role
    var updateRole = function () {
        try {
            var selectedRole = session.getRole();
            if (selectedRole) {
                silverlight.plugin.navigationVM.ChangeRole(selectedRole.id);
            }
        } catch (err) {
        }
    };

    //if the section isn't silverlight, hide the silverlight control
    window.onhashchange = function () {
        if (!location || !location.hash) {
            return;
        }
        if (location.hash.indexOf("silverlight") == -1) {
            hide();
        }
    };

    //a workaround for opening the importer
    //this is called when the importer view is shown
    window.openImporter = function () {
        silverlight.setSection({name: "Importer", isSilverlight: true});
    };

    //endregion

    //region functions for the silverlight object

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
        silverlight.plugin = document.getElementById('silverlightPlugin').Content;

        updateRole();

        //if there is a current section, navigate to it
        if (currentSection) {
            silverlight.setSection(currentSection);
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

//region Public

    /**
     * Sets the section.
     * If it is a silverlight section this will navigate the silverlight control to that section.
     * @param {{name: string, isSilverlight: boolean}} section
     */
    silverlight.setSection = function (section) {
        currentSection = section;

        if (!section.isSilverlight) {
            hide();
            return;
        }

        show();
        try {
            silverlight.plugin.navigationVM.NavigateToView(section.name);
        } catch (err) {
        }
    };

//#endregion

    hide();
    $(window).resize(resizeContainers);
    resizeContainers();
    session.bind("change", function (e) {
        if (e.field == "role") {
            updateRole();
        }
    });

    return silverlight;
});