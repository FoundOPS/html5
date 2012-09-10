define(["jquery", "lib/kendo.all", "underscore"], function ($) {
    // shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        mobile = kendo.mobile,
        ui = mobile.ui,
        Widget = ui.Widget,
        DATABINDING = "dataBinding",
        DATABOUND = "dataBound",
        elementTemplate =
            '<div>' +
                '<p style="top:10px; margin-bottom: -5px;">Contacts</p>' +
                '<hr style="width:90%;"/>' +
                '</div>',
        listViewTemplate = "<ul></ul>",
        // data-rel="external" href="mailto:${Data}"
        // data-rel="external" href="tel:${Data}"
        // data-rel="external" href="http://${Data}"
        emailTemplate = '<a>E-mail ${Label}<br/><p id="contactData">${Data}</p></a>',
        phoneTemplate = '<a>Call ${Label}<br/><p id="contactData">${Data}</p></a>',
        websiteTemplate = '<a>Go to Website<br/><p id="contactData">${Data}</p></a>';

    var Contacts = Widget.extend({
        // method called when a new widget is created
        init: function (element, options) {
            var that = this;

            // base call to initialize widget
            Widget.fn.init.call(that, element, options);
            that.render(options.contacts);
        },

        events: [
            DATABINDING,
            DATABOUND
        ],

        items: function () {
            return this.element.children();
        },

        render: function (contacts) {
            var that = this;

            that.trigger(DATABINDING);

            that.element.empty();

            var element = $(elementTemplate).appendTo(that.element);

            if (contacts) {
                //split up the contacts by type
                var emailContacts = [];
                var phoneContacts = [];
                var websiteContacts = [];

                _.each(contacts, function (value) {
                    switch (value.Type) {
                    case "Email Address":
                        emailContacts.push(value);
                        break;
                    case "Phone Number":
                        phoneContacts.push(value);
                        break;
                    case "Website":
                        websiteContacts.push(value);
                        break;
                    }
                });

                //add the list views
                $(listViewTemplate).appendTo(element).kendoMobileListView({
                    template: phoneTemplate,
                    dataSource: phoneContacts,
                    style: "inset",
                    click: function (e) {
                        window.open("tel:" + e.dataItem.Data);
                    }
                });

                $(listViewTemplate).appendTo(element).kendoMobileListView({
                    template: emailTemplate,
                    dataSource: emailContacts,
                    style: "inset",
                    click: function (e) {
                        window.open("mailto:" + e.dataItem.Data);
                    }
                });

                $(listViewTemplate).appendTo(element).kendoMobileListView({
                    template: websiteTemplate,
                    dataSource: websiteContacts,
                    style: "inset",
                    click: function (e) {
                        window.open("http://" + e.dataItem.Data);
                    }
                });

                that.trigger(DATABOUND);
            }
        },

        options: {
            name: "Contacts"
        }
    });

    ui.plugin(Contacts);

    kendo.data.binders.widget.contacts = kendo.data.Binder.extend(({
        init: function (element, bindings, options) {
            kendo.data.Binder.fn.init.call(this, element, bindings, options);
        },

        refresh: function (e) {
            var contacts = this.bindings.contacts.get();

            if (this.element) {
                this.element.render(contacts);
            }
        }
    }));
});