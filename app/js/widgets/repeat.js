// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "kendo"], function ($, dbServices) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget

    var Repeat = Widget.extend({
        init: function (element, options) {
            var _repeat, options, that = this, date, day;

            Widget.fn.init.call(that, element, options);

            options = this.options;

            date = new Date();

            // append the element that will be the menu
            //TODO: eventually make a popup and show only line below initially
            //_repeat = $('<input id="repeatCheckbox" type="checkbox" /><label id="repeatLabel" for="repeatCheckbox">Repeat</label>');

            _repeat = $('<h3>Repeat</h3>' +
                '<label>Frequency:</label><br />' +
                '<input id="frequency" />' +
                '<div id="startDate">' +
                    '<label for="startDatePicker">Start Date:</label><br />' +
                    '<input id="startDatePicker" /></div>' +
                '<div id="repeatEvery">' +
                    '<label>Repeat Every:</label>' +
                    '<input id="repeatEveryNum" type="number" value="1" /></div>' +
                '<div id="weeklyRepeatOn"><label>Repeat On:</label><br />' +
                    '<div class="weekday" id="Sunday">S</div>' +
                    '<div class="weekday" id="Monday">M</div>' +
                    '<div class="weekday" id="Tuesday">T</div>' +
                    '<div class="weekday" id="Wednesday">W</div>' +
                    '<div class="weekday" id="Thursday">T</div>' +
                    '<div class="weekday" id="Friday">F</div>' +
                    '<div class="weekday" id="Saturday">S</div>' +
                '<br /><br /></div>' +
                '<div id="monthlyRepeatOn">' +
                '<label>Repeat On:</label><br />' + this.getMonthlyRepeatOptions(date) +
                '</div>' +
                '<div id="endDate">' +
                    '<label for="endDatePicker">End Date:</label><br />' +
                    '<input id="endNever" type="radio" name="end" /><label>Never</label><br />' +
                    '<input id="endAfter" type="radio" name="end" /><label>After</label><input id="endAfterNum" type="number" value="1" /><br />' +
                    '<input id="endOn" type="radio" name="end" /><label>On</label><input id="endDatePicker" />' +
                '</div>');

            this.element.append(_repeat);

            $(_repeat).find('#startDatePicker').kendoDatePicker({
                value: new Date(),
                format:"dddd, MMMM dd, yyyy"
            });
            $(_repeat).find('#endDatePicker').kendoDatePicker({
                value: new Date()
            });
            $(_repeat).find('#repeatEveryNum').kendoNumericTextBox({
                step: 1,
                min: 0,
                max: 1000,
                value: 1,
                decimals: 0
            });
            $(_repeat).find('#endAfterNum').kendoNumericTextBox({
                step: 1,
                min: 0,
                max: 1000,
                value: 1,
                decimals: 0
            });
            $($(_repeat)[3]).kendoDropDownList({
                change: function () {
                    var frequency = $("#frequency").val();
                    if(frequency == "0" || frequency == "3"){
                        $("#weeklyRepeatOn").attr("style", "display:none");
                        $("#monthlyRepeatOn").attr("style", "display:none");
                    }else if(frequency == "1") {
                        $("#monthlyRepeatOn").attr("style", "display:none");
                        $("#weeklyRepeatOn").attr("style", "display:block");
                    }else if(frequency == "2") {
                        $("#weeklyRepeatOn").attr("style", "display:none");
                        $("#monthlyRepeatOn").attr("style", "display:block");
                    }
                },
                dataTextField: "Name",
                dataValueField: "value",
                dataSource: [ { value: 0, Name: "Daily" }, { value: 1, Name: "Weekly" }, { value: 2, Name: "Monthly" }, { value: 3, Name: "Yearly" } ]
            });

            $(".weekday").on("click", function (e) {
                var element = e.srcElement;
                var selectedDay = e.srcElement.id;
                $(element).css("color", "#000000");

            });
        },

        //returns an input and a label for each available option
        //ex. label text: "The third Friday of the month" and "The 21st of the month"
        getMonthlyRepeatOptions: function (startDate) {
            var dayOfWeek, dayOfMonth, days, nthDay, dateWithSuffix, htmlString;
            //dayOfWeek = startDate.getDay();
            //days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            dayOfMonth = startDate.getDate();
            nthDay = this.weekAndDay(startDate);
            dateWithSuffix = this.getDateWithSuffix(dayOfMonth);
            htmlString = '<input type="radio" name="repeatOnGroup" /><label>The ' + dateWithSuffix + ' of the month</label><br />' +
                '<input type="radio" name="repeatOnGroup" /><label>The ' + nthDay + ' of the month</label><br />';

            if(this.isLastDayOfMonth(startDate)){
                htmlString += '<input type="radio" name="repeatOnGroup" /><label>The last day of the month</label>';
            }

            return htmlString;
        },

        weekAndDay: function (date) {
            var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            var prefixes = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
            return prefixes[0 | (date.getDate() - 1) / 7] + ' ' + days[date.getDay()];
        },

        getDateWithSuffix: function (dayOfMonth) {
            var suffix, lastDigit;
            dayOfMonth = dayOfMonth.toString();
            lastDigit = dayOfMonth.charAt(dayOfMonth.length - 1);
            if((lastDigit > 3 && lastDigit <= 9) || (lastDigit >= 11 && lastDigit <= 13) || lastDigit == 0){
                suffix = "th";
            }else if(lastDigit == "1"){
                suffix = "st";
            }else if(lastDigit == "2"){
                suffix = "nd";
            }else if(lastDigit == "3"){
                suffix = "rd";
            }
            return dayOfMonth + suffix;
        },

        isLastDayOfMonth: function (date) {
            return new Date(date.getTime() + 86400000).getDate() === 1;
        },

        options: new kendo.data.ObservableObject({
            name: "Repeat"
        })
    });

    ui.plugin(Repeat);
});