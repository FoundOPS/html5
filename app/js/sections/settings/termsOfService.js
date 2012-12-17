// Copyright 2012 FoundOPS LLC. All Rights Reserved.

"use strict";

define(["widgets/settingsMenu"], function () {
    var termsOfService = {};

    termsOfService.initialize = function () {
        //setup menu
        var menu = $("#termsOfService").find(".settingsMenu");
        kendo.bind(menu);
        menu.kendoSettingsMenu({selectedItem: "Terms"});
    };

    //set termsOfService to a global function, so the functions are accessible from the HTML element
    window.termsOfService = termsOfService;
});