define(["jquery", "session", "lib/kendo.all"], function ($, session) {
    // shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget;

    var SettingsMenu = Widget.extend({
        //TODO some kind of navigate event
        //onclick="settings.personal()"

        // method called when a new widget is created
        init: function (element, options) {
            var _menu, options;

            // base call to initialize widget
            Widget.fn.init.call(this, element, options);

            options = this.options;

            // append the element that will be the menu
            _menu = $('<ul id="settingsList"> ' +
                '<li class="active" onclick="window.navigateToPersonal()"><a>Personal</a></li>' +
                '<li onclick="window.navigateToBusiness()"><a>Business</a></li>' +
                '<li onclick="window.navigateToUsers()"><a>Users</a></li>' +
                '</ul>');

            var personalLi = _menu.find("li:nth-child(1)");
            var businessLi = _menu.find("li:nth-child(2)");
            var usersLi = _menu.find("li:nth-child(3)");

            if (options.selectedItem === "Personal") {
                personalLi.addClass('active');

                businessLi.removeClass('active');
                usersLi.removeClass('active');
            } else if (options.selectedItem === "Business") {
                businessLi.addClass('active');

                personalLi.removeClass('active');
                usersLi.removeClass('active');
            } else if (options.selectedItem === "Users") {
                usersLi.addClass('active');

                personalLi.removeClass('active');
                businessLi.removeClass('active');
            }

            //Show all settings if user is admin
            if (session._selectedRole.type == "Administrator") {
                businessLi.css("display", "block");
                usersLi.css("display", "block");
            }

            this.element.append(_menu);
        },

        options: {
            name: "SettingsMenu",
            selectedItem: "Personal"
        }
    });

    ui.plugin(SettingsMenu);
});