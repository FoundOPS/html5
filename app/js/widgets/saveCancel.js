define(["jquery", "lib/kendo.all"], function () {
    //Shorten references to variables. This is better for uglification.
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget

    var SaveCancel = Widget.extend({
        init: function (element, options) {
            var that = this, templateElement;

            Widget.fn.init.call(that, element, options);

            var template =
                '<button class="k-button k-button-icontext saveBtn" onclick="' + that.options.page + '.save()" disabled>' +
                    '<span class="k-icon k-update"></span>Save</button>' +
                    '<button class="k-button k-button-icontext cancelBtn" onclick="' + that.options.page + '.cancel()" disabled>' +
                    '<span class="k-icon k-cancel"></span>Cancel Changes</button>';

            templateElement = $(template);
            that.element.append(templateElement);
        },
        options: new kendo.data.ObservableObject({
            name: "SaveCancel",
            //name of the page. ex: personalSettings
            page: ""
        })
    });

    ui.plugin(SaveCancel);
});