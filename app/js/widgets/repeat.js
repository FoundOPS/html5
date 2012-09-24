// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "db/services", "kendo"], function ($, dbServices) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        serviceA = {Frequency: 1, StartDate: new Date(), RepeatEvery: 3, RepeatOn: "M,W", EndDate: 4},
        serviceB = {Frequency: 2, StartDate: new Date(), RepeatEvery: 1, RepeatOn: 1, EndDate: new Date()};
    var service = serviceA;

    var Repeat = Widget.extend({
        init: function (element, options) {
            var _repeat, that = this, endAfterValue, endOnValue, endAfterFormat, enableEndAfter = false, enableEndOn = false;

            Widget.fn.init.call(that, element, options);

            options = this.options;

            _repeat = $('<h3>Repeat</h3>' +
                '<label>Frequency</label><br />' +
                '<input id="frequency" />' +
                '<div id="startDate">' +
                    '<label for="startDatePicker">Start Date</label><br />' +
                    '<input id="startDatePicker" /></div>' +
                '<div id="repeatEvery">' +
                    '<label>Repeat Every</label>' +
                    '<input id="repeatEveryNum" type="number" value="1" /></div>' +
                '<div id="weeklyRepeatOn"><label>Repeat On</label><br />' +
                    '<div id="weekdayWrapper">' +
                    '<div class="weekday left">&nbsp;</div>' +
                    '<div class="weekday" id="Sunday">S</div>' +
                    '<div class="weekday workday" id="Monday">M</div>' +
                    '<div class="weekday workday" id="Tuesday">T</div>' +
                    '<div class="weekday workday" id="Wednesday">W</div>' +
                    '<div class="weekday workday" id="Thursday">T</div>' +
                    '<div class="weekday workday" id="Friday">F</div>' +
                    '<div class="weekday" id="Saturday">S</div>' +
                    '<div class="weekday right">&nbsp;</div>' +
                '</div>' +
                '<br /><br /></div>' +
                '<div id="monthlyRepeatOn">' +
                '<label>Repeat On</label><br />' + this.getMonthlyRepeatOptions(service.StartDate) +
                '</div>' +
                '<div id="endDate">' +
                    '<label>End Date</label><br />' +
                    '<input id="endNever" type="radio" name="end" /><label for="endNever">Never</label><br />' +
                    '<input id="endAfter" type="radio" name="end" /><label for="endAfter">After</label><input id="endAfterNum" type="number" /><br />' +
                    '<input id="endOn" type="radio" name="end" /><label for="endOn">On</label><input id="endDatePicker" />' +
                '</div>');

            this.element.append(_repeat);

            $(_repeat).find('#startDatePicker').kendoDatePicker({
                value: new Date(),
                format:"dddd, MMMM dd, yyyy"
            });

            $(_repeat).find('#repeatEveryNum').kendoNumericTextBox({
                step: 1,
                min: 1,
                max: 1000,
                value: service.RepeatEvery,
                decimals: 0,
                format: '#'
            });

            $($(_repeat).find("#option" + service.RepeatOn.toString())).attr("checked", "checked");

            if(!isNaN(parseFloat(service.EndDate)) && isFinite(service.EndDate) && !service.getMonth){
                $(_repeat).find('#endAfter').attr("checked", "checked");
                endAfterValue = service.EndDate;
                if(service.EndDate > 1){
                    endAfterFormat = "# Occurrences";
                }else{
                    endAfterFormat = "# Occurrence";
                }
                enableEndAfter = true;
            }else if(service.EndDate.getMonth){
                $(_repeat).find('#endOn').attr("checked", "checked");
                endOnValue = service.EndDate;
                enableEndOn = true;
            }else{
                $(_repeat).find('#endNever').attr("checked", "checked");
            }
            var endAfter = $(_repeat).find('#endAfterNum').kendoNumericTextBox({
                step: 1,
                min: 1,
                max: 1000,
                value: endAfterValue,
                decimals: 0,
                format: endAfterFormat,
                change: function (e) {
                    if(e.sender.value > 1){
                        e.sender.options.format = "# Occurrences";
                    }else{
                        e.sender.options.format = "# Occurrence";
                    }
                }
            }).data("kendoNumericTextBox");

            var endOn = $(_repeat).find('#endDatePicker').kendoDatePicker({
                value: endOnValue
            }).data("kendoDatePicker");

            endAfter.enable(enableEndAfter);
            endOn.enable(enableEndOn);

            $($(_repeat)[3]).kendoDropDownList({
                change: this.frequencyChanged,
                dataTextField: "Name",
                dataValueField: "value",
                dataSource: [ { value: 0, Name: "Daily" }, { value: 1, Name: "Weekly" }, { value: 2, Name: "Monthly" }, { value: 3, Name: "Yearly" } ],
                index: service.Frequency
            });

            $('#endDate input').on("click", function (e) {
                if(e.target.id == "endNever"){
                    endAfter.enable(false);
                    endOn.enable(false);
                }else if(e.target.id == "endAfter"){
                    endAfter.enable(true);
                    endOn.enable(false);
                }else if(e.target.id == "endOn"){
                    endAfter.enable(false);
                    endOn.enable(true);
                }
            });

            //event for clicking on a day of the week
            $(".weekday").on("click", function (e) {
                var element = e.srcElement;
                //get the day that was selected. ex. "Tuesday"
                var selectedDay = e.srcElement.id;
                if($(element).hasClass("selected")){
                    $(element).removeClass("selected");
                }else{
                    $(element).addClass("selected");
                }
            });
            //unselect all days when click on left weekday button
            $(".weekday.left").on("click", function () {
                $(".weekday").removeClass("selected");
            });
            //select M-F when click on right weekday button
            $(".weekday.right").on("click", function () {
                //unselect all first to remove Sat and Sun.
                $(".weekday").removeClass("selected");
                $(".workday").addClass("selected");
            });

            this.frequencyChanged();
        },

        frequencyChanged: function () {
            var that = this;
            var frequency = $("#frequency").val();
            var repeatEvery = $('#repeatEveryNum').data("kendoNumericTextBox");
            var frequencyName;
            if(frequency == "0"){
                $("#weeklyRepeatOn").attr("style", "display:none");
                $("#monthlyRepeatOn").attr("style", "display:none");
                frequencyName = "Day";
            }else if(frequency == "1") {
                $("#monthlyRepeatOn").attr("style", "display:none");
                $("#weeklyRepeatOn").attr("style", "display:block");
                frequencyName = "Week";
            }else if(frequency == "2") {
                $("#weeklyRepeatOn").attr("style", "display:none");
                $("#monthlyRepeatOn").attr("style", "display:block");
                frequencyName = "Month";
            }else if(frequency == "3") {
                $("#weeklyRepeatOn").attr("style", "display:none");
                $("#monthlyRepeatOn").attr("style", "display:none");
                frequencyName = "Year";
            }
            if(service.RepeatEvery > 1){
                frequencyName += "s";
            }
            repeatEvery.options.format = "# " + frequencyName;
        },

        //returns an input and a label for each available option
        //ex. label text: "The third Friday of the month" and "The 21st of the month"
        getMonthlyRepeatOptions: function (startDate) {
            var dayOfMonth, nthDay, dateWithSuffix, htmlString, lastDay = false;
            dayOfMonth = startDate.getDate();
            nthDay = this.weekAndDay(startDate);
            dateWithSuffix = this.getDateWithSuffix(dayOfMonth);
            htmlString = '<input type="radio" name="repeatOnGroup" id="option0" /><label for="option0">The ' + dateWithSuffix + ' of the month</label><br />' +
                '<input type="radio" name="repeatOnGroup" id="option1" /><label for="option1">The ' + nthDay + ' of the month</label><br />';

            //check if startDate is the last day of the month
            lastDay = new Date(startDate.getTime() + 86400000).getDate() === 1;
            if(lastDay){
                //add option for the last day of the month
                htmlString += '<input type="radio" name="repeatOnGroup" id="option2" /><label for="option2">The last day of the month</label>';
            }
            return htmlString;
        },

        //get day of the week and the nth occurrence of that day. ex. "Third Friday"
        weekAndDay: function (date) {
            var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            var prefixes = ['first', 'second', 'third', 'fourth', 'fifth'];
            return prefixes[0 | (date.getDate() - 1) / 7] + ' ' + days[date.getDay()];
        },

        //adds a suffix to the date. ex. 21 -> 21st
        getDateWithSuffix: function (dayOfMonth) {
            var suffix, lastDigit;
            dayOfMonth = dayOfMonth.toString();
            //get the last digit of the date. ex. 21 -> 1
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

        options: new kendo.data.ObservableObject({
            name: "Repeat"
        })
    });

    ui.plugin(Repeat);
});