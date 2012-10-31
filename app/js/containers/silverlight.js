'use strict';

define(['db/services', 'db/session', 'hasher', 'tools/parameters'], function (dbServices, session, hasher, parameters) {
    var silverlight = {}, currentSection;

    window.silverlight = silverlight;

    //region private

    //resize the silverlight container to the proper size according to the window size
    var resizeContainers = function () {
        if (!currentSection || !currentSection.isSilverlight) {
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

    var cssHide = _.debounce(function () {
        $("#silverlightControlHost").css("height", "0px");
        $("#silverlightControlHost").css("width", "0px");

        //instead of hiding the silverlight (which will disable it), make it really small
        $("#silverlightPlugin").css("height", "1px");
        $("#silverlightPlugin").css("width", "1px");

        $("#remoteContent").css("display", "");
    }, 200);

    //hide the silverlight plugin
    var hide = function () {
        //prevents crashing bug from the silverlight clients section
        if (silverlight.plugin && silverlight.plugin.navigationVM) {
            silverlight.plugin.navigationVM.BeforeHide();
        }

        cssHide();
    };

    //show the silverlight plugin
    var show = function () {
        //show the silverlight client
        $("#silverlightPlugin").css("height", "100%");
        $("#silverlightPlugin").css("width", "100%");

        $("#remoteContent").css("display", "none");
        _.delay(resizeContainers, 150);
    };

    window.openImporter = function () {
        parameters.set({section: {name: "Importer", isSilverlight: true}});
    };
    //endregion

    //region functions for the silverlight object

    window.onSilverlightError = function (sender, args) {
        var appSource = "";
        if (sender !== null && sender !== 0) {
            appSource = sender.getHost().Source;
        }

        var errorType = args.ErrorType;
        var iErrorCode = args.ErrorCode;

        if (errorType === "ImageError" || errorType === "MediaError") {
            return;
        }

        var errMsg = "Unhandled Error in Silverlight Application " + appSource + "\n";

        errMsg += "Code: " + iErrorCode + "    \n";
        errMsg += "Category: " + errorType + "       \n";
        errMsg += "Message: " + args.ErrorMessage + "     \n";

        if (errorType === "ParserError") {
            errMsg += "File: " + args.xamlFile + "     \n";
            errMsg += "Line: " + args.lineNumber + "     \n";
            errMsg += "Position: " + args.charPosition + "     \n";
        } else if (errorType === "RuntimeError") {
            if (args.lineNumber !== 0) {
                errMsg += "Line: " + args.lineNumber + "     \n";
                errMsg += "Position: " + args.charPosition + "     \n";
            }
            errMsg += "MethodName: " + args.methodName + "     \n";
        }

        dbServices.errors.create({
            body: {
                Business: session.get("role.name"),
                Message: errMsg
            }
        });

        //for chrome
        console.log(errMsg);

        //for IE
        throw new Error(errMsg);
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

        parameters.roleId.changed.add(function (roleId) {
            if (!roleId) {
                return;
            }

            //Update the silverlight app's role to the selected role
            silverlight.plugin.navigationVM.ChangeRole(roleId);
        });

        //Update the silverlight app's role to the selected role
        silverlight.plugin.navigationVM.ChangeRole(parameters.get().roleId);

        if (currentSection && currentSection.isSilverlight) {
            try {
                silverlight.plugin.navigationVM.NavigateToView(currentSection.name);
            } catch (err) {
            }
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

    //to get around occasional security violation
    silverlight.setHash = function (hash) {
        window.location.hash = hash;
    };

    //endregion

//region Public
    var drawSilverlight = function () {
        var section = parameters.getSection();
        currentSection = section;

        if (!section || !section.isSilverlight) {
            hide();
            return;
        }

        show();
        try {
            silverlight.plugin.navigationVM.NavigateToView(section.name);
        } catch (err) {
        }
    };

    //if the section isn't silverlight, hide the silverlight control
    hasher.changed.add(function () {
        drawSilverlight();
    });

//#endregion

    $(window).resize(resizeContainers);

    //setup initial page
    //delay to let the navigator load
    _.delay(function () {
        drawSilverlight();
        resizeContainers();
    }, 500);

    return silverlight;
});