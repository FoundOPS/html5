'use strict';
define(["jquery", "lib/kendo.all"], function ($) {

    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DATABINDING = "dataBinding",
        DATABOUND = "dataBound",
        CHANGE = "change",
        textBoxTemplate = "<input id='textbox' type='text'/>",
        multiLineTextBoxTemplate = "<textarea id='textarea'></textarea>";

    var ServiceDetails = Widget.extend({
        init: function (element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            console.log("testing");

            that.setDataSource();
        },

        events: [
            DATABINDING,
            DATABOUND
        ],

        items: function () {
            return this.element.children();
        },
        // for supporting changing o the datasource via MVVM
        setDataSource: function (dataSource) {
            var that = this;
            that.options.dataSource = dataSource;

            that._refreshHandler = $.proxy(that.refresh, that);

            that.refresh();
            console.log("2");
        },
        refresh: function () {
            console.log("1");
            var that = this;

            that.trigger(DATABINDING);

            that.element.empty();

            var fieldsListView = $("<ul></ul>");

            var service = that.element.value;
            if (service) {
                for (var i = 0; i < service.Fields.length; i++) {
                    var field = service.Fields[i];
                    var fieldElement = null;
                    switch (field.Type) {
                        case "TextBoxField":
                            if (field.IsMultiLine) {
                                fieldElement = $(multiLineTextBoxTemplate);
                            }
                            else {
                                fieldElement = $(textBoxTemplate);
                            }
                            break;
                    }

                    if (fieldElement) {
                        //Set the source relative to the service
                        var dataBindAttr = "source: Fields[" + i + "], value: Value";
                        fieldElement.attr("data-bind", dataBindAttr);

                        console.log(fieldElement);

                        //add the element to the fieldsListView
                        fieldElement.appendTo(fieldsListView);
                    }
                }
            }

            var html = fieldsListView.kendoMobileListView({style: "inset"}).wrap("<form></form>").html();

            that.element.html(html);

            that.trigger(DATABOUND);
        },
        options: new kendo.data.ObservableObject({
            name: "ServiceDetails"
        })
    });

    ui.plugin(ServiceDetails);
});