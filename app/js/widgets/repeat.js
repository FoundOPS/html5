'use strict';
define(["jquery", "db/services", "kendo"], function ($, dbServices) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget

    var Repeat = Widget.extend({
        init: function (element, options) {
            var _repeat, options, that = this;

            Widget.fn.init.call(that, element, options);

            options = this.options;

            // append the element that will be the menu
            //TODO: eventually make a popup and show only line below initially
            //_repeat = $('<input id="repeatCheckbox" type="checkbox" /><label id="repeatLabel" for="repeatCheckbox">Repeat</label>');

            _repeat = $('<h3>Repeat</h3>' +
                '<div id="frequency"><label>Frequency:</label><select>' +
                    '<option value="0" title="Once">Once</option>' +
                    '<option value="1" title="Daily">Daily</option>' +
                    '<option value="2" title="Weekly">Weekly</option>' +
                    '<option value="3" title="Monthly">Monthly</option>' +
                    '<option value="4" title="Yearly">Yearly</option>' +
                '</select></div>' +
                '<div id="startDate"><label for="startDatepicker">Start Date:</label><input id="startDatepicker" style="width:150px;" /></div>' +
                '<div id="repeatEvery"><label>Repeat Every:</label><input type="number" min="1" step="1" /></div>' +
                '<div id="repeatOn"><label>Repeat On:</label><br />' +
                    '<input type="checkbox" /><label>Su</label><input type="checkbox" /><label>M</label>' +
                '<input type="checkbox" /><label>Tu</label><input type="checkbox" /><label>W</label>' +
                '<input type="checkbox" /><label>Th</label><input type="checkbox" /><label>F</label><input type="checkbox" /><label>Sa</label></div>' +
                '<div id="endDate"><label for="endDatepicker">End Date:</label><input id="endDatepicker" style="width:150px;" /></div>');

            this.element.append(_repeat);
            //$("#repeat select").val() -> ex. 2

            $(_repeat).find('#startDatepicker').kendoDatePicker();
            $(_repeat).find('#endDatepicker').kendoDatePicker();
            $(_repeat).find('#repeatEvery').kendoNumericTextBox();
        },

        frequencyChanged: function (value) {

        },

        options: new kendo.data.ObservableObject({
            name: "Repeat"
        })
    });

    ui.plugin(Repeat);
});