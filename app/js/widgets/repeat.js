// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "tools/generalTools", "tools/dateTools", "kendo", "select2"], function ($, generalTools, dateTools) {
    var serviceA = {Frequency: 3, StartDate: new Date(), RepeatEveryTimes: 3, RepeatOn: "Monday,Wednesday", EndDate: 4},
        serviceB = {Frequency: 4, StartDate: new Date(), RepeatEveryTimes: 1, RepeatOn: 1, EndDate: new Date()},

        serviceC = {Frequency: 4, StartDate: new Date(), RepeatEveryTimes: 2, EndDate: new Date(),
            EndAfterTimes: null, FrequencyDetailAsWeeklyFrequencyDetail: [2, 3, 5], AvailableMonthlyFrequencyDetailTypes: [8, 14], FrequencyDetailAsMonthlyFrequencyDetail: 14};
    var service = serviceC, widgetElement;

    $.widget("ui.repeat", {
        _create: function () {
            var _repeat, that = this;
            widgetElement = $(that.element);

            _repeat = $('<h3>Repeat</h3>' +
                '<label>Frequency</label>' +
                '<input class="frequency" />' +
                '<div class="startDate">' +
                '<label>Start Date</label>' +
                '<input class="startDatePicker" /></div>' +
                '<div class="repeatEvery">' +
                '<label>Repeat Every</label>' +
                '<input class="repeatEveryNum" type="number" value="1" /></div>' +
                '<div class="weeklyRepeatOn"><label>Repeat On</label><br />' +
                '<div class="weekdayWrapper">' +
                '<div class="weekday left">&nbsp;</div>' +
                '<div class="weekday Sunday">S</div>' +
                '<div class="weekday workday Monday">M</div>' +
                '<div class="weekday workday Tuesday">T</div>' +
                '<div class="weekday workday Wednesday">W</div>' +
                '<div class="weekday workday Thursday">T</div>' +
                '<div class="weekday workday Friday">F</div>' +
                '<div class="weekday Saturday">S</div>' +
                '<div class="weekday right">&nbsp;</div>' +
                '</div>' +
                '<br /><br /></div>' +
                '<div class="monthlyRepeatOn">' +
                '<label>Repeat On</label>' + this.getMonthlyRepeatOptions() +
                '</div>' +
                '<div class="endDate">' +
                '<label>End Date</label>' +
                '<input class="endDropdown" />' +
                '<input class="endAfterNum" type="number" />' +
                '<input class="endDatePicker" />' +
                '</div>');

            that.element.append(_repeat);

            //region SetupFields
            //setup the startdate datepicker
            widgetElement.find('.startDatePicker').kendoDatePicker({
                value: new Date(),
                format: "dddd, MMMM dd, yyyy"
            });

            //use the frequency int to get the frequency name(ex. 2 -> "Day")
            var frequencyName = generalTools.repeatFrequencies[service.Frequency];
            //set the format of the Repeat Every text based on the frequency
            if (service.RepeatEveryTimes > 1) {
                frequencyName += "s";
            }
            that._repeatFormat = "# " + frequencyName;

            //setup the Repeat Every numeric textbox
            widgetElement.find('.repeatEveryNum').kendoNumericTextBox({
                step: 1,
                min: 1,
                max: 1000,
                value: service.RepeatEveryTimes,
                decimals: 0,
                format: that._repeatFormat,
                spin: that.repeatEveryChanged
            });

            //set the endDate value only for the correct endDate field and
            //determine which item in the endDate dropdown should be selected
            if (service.EndAfterTimes) {
                that._endSelection = 1;
                that._endAfterValue = service.EndAfterTimes;
                if (service.EndDate > 1) {
                    that._endAfterFormat = "# Occurrences";
                } else {
                    that._endAfterFormat = "# Occurrence";
                }
            } else if (service.EndDate && service.EndDate.getMonth) {
                that._endSelection = 2;
                that._endOnValue = service.EndDate;
            } else {
                that._endSelection = 0;
            }

            //setup the endAfter numeric textbox
            var endAfter = widgetElement.find('.endAfterNum').kendoNumericTextBox({
                step: 1,
                min: 1,
                max: 1000,
                value: that._endAfterValue,
                decimals: 0,
                format: that._endAfterFormat,
                spin: function (e) {
                    //set the text based on the value
                    if (e.sender._value > 1) {
                        endAfter.options.format = "# Occurrences";
                    } else {
                        endAfter.options.format = "# Occurrence";
                    }
                    //reset focus to refresh the input, in order to get the new format
                    endAfter.focus();
                    endAfter.blur();
                }
            }).data("kendoNumericTextBox");

            //setup the endDate datepicker
            widgetElement.find('.endDatePicker').kendoDatePicker({
                value: that._endOnValue
            });

            //initially show the correct endDate field based on whether EndDate or EndAfterTimes exists
            if (service.EndAfterTimes) {
                widgetElement.find(".endDate .k-numerictextbox").addClass("showInput");
            } else if (service.EndDate && service.EndDate.getMonth) {
                widgetElement.find(".endDate .k-datepicker").addClass("showInput");
            }

            //function to format the option names of the frequency and end Date dropdowns
            var formatItemName = function (item) {
                return item.Name;
            };

            //setup the frequency dropdownlist
            //TODO: when setting up saving, refer to timezone dropdown in prsonalSettings
            var frequencyValues = [
                { value: 2, Name: "Daily" },
                { value: 3, Name: "Weekly" },
                { value: 4, Name: "Monthly" },
                { value: 5, Name: "Yearly" }
            ];

            widgetElement.find('.frequency').select2({
                placeholder: "Select a frequency",
                minimumResultsForSearch: 15,
                width: "250px",
                id: function (frequency) {
                    return frequency.value;
                },
                query: function (query) {
                    if (!frequencyValues) {
                        frequencyValues = [];
                    }
                    var data = {results: frequencyValues};
                    query.callback(data);
                },
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop frequencyDropdown"
            }).on("change", function () {
                that.frequencyChanged(widgetElement.find('.frequency').select2("data").value);
            });

            //initially set the correct frequency
            widgetElement.find('.frequency').select2("data", {value: service.Frequency, Name: frequencyValues[service.Frequency - 2].Name});

            var endValues = [
                { value: 0, Name: "Never" },
                { value: 1, Name: "After" },
                { value: 2, Name: "On" }
            ];

            //setup the endDate dropdownlist
            //TODO: when setting up saving, refer to timezone dropdown in prsonalSettings
            widgetElement.find('.endDropdown').select2({
                placeholder: "",
                minimumResultsForSearch: 15,
                width: "80px",
                id: function (end) {
                    return end.value;
                },
                query: function (query) {
                    if (!endValues) {
                        endValues = [];
                    }
                    var data = {results: endValues};
                    query.callback(data);
                },
                formatSelection: formatItemName,
                formatResult: formatItemName,
                dropdownCssClass: "bigdrop endDateDropdown"
            }).on("change", function (e) {
                    var textBox = widgetElement.find(".endDate .k-numerictextbox");
                    var datepicker = widgetElement.find(".endDate .k-datepicker");
                    //show the correct field based on the end date option
                    if (e.val == 0) {
                        textBox.removeClass("showInput");
                        datepicker.removeClass("showInput");
                    } else if (e.val == 1) {
                        textBox.addClass("showInput");
                        datepicker.removeClass("showInput");
                    } else if (e.val == 2) {
                        textBox.removeClass("showInput");
                        datepicker.addClass("showInput");
                    }
                });

            //initially set the correct end option
            widgetElement.find('.endDropdown').select2("data", {value: that._endSelection, Name: endValues[that._endSelection].Name});
            //endregion

            var weekdayElement = widgetElement.find(".weekday");

            //event for clicking on a day of the week
            weekdayElement.on("click", function (e) {
                var element = e.srcElement;
                //get the day that was selected. ex. "Tuesday"
                //TODO: use class below instead of id(use regex?)
                //var selectedDay = e.srcElement.id;
                if ($(element).hasClass("selected")) {
                    $(element).removeClass("selected");
                } else {
                    $(element).addClass("selected");
                }
            });
            //unselect all days when click on left weekday button
            widgetElement.find(".weekday.left").on("click", function () {
                weekdayElement.removeClass("selected");
            });
            //select M-F when click on right weekday button
            widgetElement.find(".weekday.right").on("click", function () {
                //unselect all first to remove Sat and Sun.
                weekdayElement.removeClass("selected");
                widgetElement.find(".workday").addClass("selected");
            });

            that.frequencyChanged(service.Frequency);

            //check if weekly
            if (service.Frequency == 3) {
                //set the repeatOn days
                that.setRepeatDays();
            }
        },

        //region Functions
        //sets the initial selected days for a weekly repeat
        setRepeatDays: function () {
            var that = this, frequencyDetail = service.FrequencyDetailAsWeeklyFrequencyDetail;
            //iterate through each weekday int
            for (var d in frequencyDetail) {
                var dayInt = frequencyDetail[d];
                //select the button with the id that matches the current day
                $(that.element).find("." + dateTools.days[dayInt]).addClass("selected");
            }
        },

        /**
         * Shows and hides the correct fields based on the frequency and sets the text in Repeat Every
         * @param {string} frequency ex. "Weekly"
         */
        frequencyChanged: function (frequency) {
            var that = this;
            var widgetElement = $(that.element);
            var monthlyElement = widgetElement.find(".monthlyRepeatOn");
            var weeklyElement = widgetElement.find(".weeklyRepeatOn");
            //check if frequency is null or not a number
            if (!frequency || (isNaN(parseFloat(frequency)) && !isFinite(frequency))) {
                //set frequency to the selected frequency
                frequency = widgetElement.find("input.frequency").val();
            }
            //get the value of the Repeat Every field
            var repeat = widgetElement.find(".repeatEveryNum").val();
            //get a reference to the Repeat Every field
            var repeatEvery = widgetElement.find('.repeatEveryNum:not(.k-formatted-value)').data("kendoNumericTextBox");
            //show/hide the correct Repeat On field
            //TODO: check if supposed to check against string or num
            if (frequency == 2) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:none");
            } else if (frequency == 3) {
                monthlyElement.attr("style", "display:none");
                weeklyElement.attr("style", "display:block");
                that.setRepeatDays();
            } else if (frequency == 4) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:block");
            } else if (frequency == 5) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:none");
            }
            //use the frequency int to get the frequency name(ex. 2 -> "Day")
            var frequencyName = generalTools.repeatFrequencies[frequency];

            //add "s" to the frequency name if repeat number is more than one
            if (repeat > 1) {
                frequencyName += "s";
            }
            //set the format. ex. "# Weeks"
            repeatEvery.options.format = "# " + frequencyName;
            //reset focus to refresh the input, in order to get the new format
            that.repeatEveryChanged();
            repeatEvery.focus();
            widgetElement.find('.repeatEveryNum:not(.k-formatted-value)').blur();

        },

        //updates the Repeat Every text when the value changes
        repeatEveryChanged: function () {
            var that = this;
            var frequency = widgetElement.find(".frequency:not(.select2-container)").val();
            //get the value of the Repeat Every field
            var repeat = widgetElement.find(".repeatEveryNum").val();
            //get a reference to the Repeat Every field
            var repeatEvery = widgetElement.find(".repeatEveryNum:not(.k-formatted-value)").data("kendoNumericTextBox");
            //use the frequency int to get the frequency name(ex. 2 -> "Day")
            var frequencyName = generalTools.repeatFrequencies[frequency];
            //add "s" to the frequency name if repeat number is mmore than one
            if (repeat.match(/^([0-9]*)\s/)[1] > 1) {
                frequencyName += "s";
            }
            repeatEvery.options.format = "# " + frequencyName;
        },

        //returns an input and a label for each available monthly frequency option
        getMonthlyRepeatOptions: function () {
            //TODO: finish this
            var htmlString = "", monthlyOptions = service.AvailableMonthlyFrequencyDetailTypes;
            for (var mo in monthlyOptions) {
                if (monthlyOptions[mo] === service.FrequencyDetailAsMonthlyFrequencyDetail) {
                    htmlString += '<input type="radio" name="repeatOnGroup" checked="checked" class="option'+ monthlyOptions[mo] + '" />' +
                        '<label class="inline">' + generalTools.getFrequencyDetailString(monthlyOptions[mo], service.StartDate, true) + '</label><br />';
                } else {
                    htmlString += '<input type="radio" name="repeatOnGroup" class="option'+ monthlyOptions[mo] + '" />' +
                        '<label class="inline">' + generalTools.getFrequencyDetailString(monthlyOptions[mo], service.StartDate, true) + '</label><br />';
                }
            }

            return htmlString;
        },

        //remove the widget
        removeWidget: function () {
            var that = this;
            $(that.element)[0].innerHTML = "";
        }
        //endregion
    });
});