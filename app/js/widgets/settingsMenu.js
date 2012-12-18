define(["jquery", "db/session", "kendo"], function ($, session) {
    //shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget;

    var SettingsMenu = Widget.extend({
        //method called when a new widget is created
        init: function (element, options) {
            var _menu, options;

            //base call to initialize widget
            Widget.fn.init.call(this, element, options);

            options = this.options;

            //append the element that will be the menu
            _menu = $('<h2>Settings</h2>' +
                '<ul id="settingsList"> ' +
                '<li><a>Personal</a></li>' +
                '<li><a>Business</a></li>' +
                '<li><a>Users</a></li>' +
                '<li><a>Dispatcher</a></li>' +
//                '<li><a>Import</a></li>' +
//                '<li><a>Privacy Policy</a></li>' +
//                '<li><a>Terms of Service</a></li>' +
                '</ul>' +
                '<div><a href="http://indymade.com/" target="_blank">Made with Pride in Indiana</a></div>');

            var personalLi = _menu.find("li:nth-child(1)");
            var businessLi = _menu.find("li:nth-child(2)");
            var usersLi = _menu.find("li:nth-child(3)");
            var dispatcherLi = _menu.find("li:nth-child(4)");
//            var importerLi = _menu.find("li:nth-child(5)");
//            var privacyLi = _menu.find("li:nth-child(5)");
//            var termsLi = _menu.find("li:nth-child(6)");

            personalLi.click(function () {
                application.navigate("view/personalSettings.html");
            });
            businessLi.click(function () {
                application.navigate("view/businessSettings.html");
            });
            usersLi.click(function () {
                application.navigate("view/usersSettings.html");
            });
            dispatcherLi.click(function () {
                application.navigate("view/dispatcherSettings.html");
            });
//            importerLi.click(function () {
//                application.navigate("view/importerUpload.html");
//            });
//            privacyLi.click(function () {
//                application.navigate("view/privacyPolicy.html");
//            });
//            termsLi.click(function () {
//                application.navigate("view/termsOfService.html");
//            });

            if (options.selectedItem === "Personal") {
                personalLi.addClass('active');
            } else if (options.selectedItem === "Business") {
                businessLi.addClass('active');
            } else if (options.selectedItem === "Users") {
                usersLi.addClass('active');
            } else if (options.selectedItem === "Dispatcher") {
                dispatcherLi.addClass('active');
            } else if (options.selectedItem === "Importer") {
                //importerLi.addClass('active');
//            } else if (options.selectedItem === "Privacy") {
//                privacyLi.addClass('active');
//            } else if (options.selectedItem === "Terms") {
//                termsLi.addClass('active');
            }

            session.followRole(function (role) {
                if (!role || role.type !== "Administrator") {
                    businessLi.css("display", "none");
                    usersLi.css("display", "none");
                    dispatcherLi.css("display", "none");
                    //importerLi.css("display", "none");
                } else {
                    //Show all settings if user is admin
                    businessLi.css("display", "block");
                    usersLi.css("display", "block");
                    dispatcherLi.css("display", "block");
                    //importerLi.css("display", "block");
                }
            });

            this.element.append(_menu);
        },

        options: {
            name: "SettingsMenu",
            selectedItem: "Personal"
        }
    });

    ui.plugin(SettingsMenu);
});