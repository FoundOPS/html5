// Copyright 2012 FoundOPS LLC. All Rights Reserved.

"use strict";

define(["widgets/settingsMenu"], function () {
    var privacyPolicy = {};

    privacyPolicy.initialize = function () {
        //setup menu
        var menu = $("#privacyPolicy").find(".settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Privacy"});
    };

    //set privacyPolicy to a global function, so the functions are accessible from the HTML element
    window.privacyPolicy = privacyPolicy;
});