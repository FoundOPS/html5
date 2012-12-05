// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["jquery", "tools/generalTools", "tools/dateTools", "kendo", "select2", "moment"], function ($, generalTools, dateTools) {
//    var testService = {Frequency: 4, StartDate: new Date(), RepeatEveryTimes: 2, EndDate: new Date(),
//        EndAfterTimes: null, FrequencyDetailAsWeeklyFrequencyDetail: [2, 3, 5], AvailableMonthlyFrequencyDetailTypes: [8, 14], FrequencyDetailAsMonthlyFrequencyDetail: 14};
    var service = {Frequency: 2, StartDate: new Date(), RepeatEveryTimes: 1, EndDate: new Date(),
            EndAfterTimes: 1, FrequencyDetailAsWeeklyFrequencyDetail: [], AvailableMonthlyFrequencyDetailTypes: []},
    widgetElement;

    $.widget("ui.repeat", {
        options: {
            repeat: {Frequency: 2, StartDate: new Date(), RepeatEveryTimes: 1, EndDate: new Date(),
                EndAfterTimes: 1, FrequencyDetailAsWeeklyFrequencyDetail: [], AvailableMonthlyFrequencyDetailTypes: []}
        },
        _create: function () {
            var _repeat, that = this;
            widgetElement = $(that.element);

            if (that.options.repeat) {
                service = that.options.repeat;
            }

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
                '<div class="left">&nbsp;</div>' +
                '<div class="weekday Sunday">S</div>' +
                '<div class="weekday Monday workday">M</div>' +
                '<div class="weekday Tuesday workday">T</div>' +
                '<div class="weekday Wednesday workday">W</div>' +
                '<div class="weekday Thursday workday">T</div>' +
                '<div class="weekday Friday workday">F</div>' +
                '<div class="weekday Saturday">S</div>' +
                '<div class="right">&nbsp;</div>' +
                '</div>' +
                '<br /><br /></div>' +
                '<div class="monthlyRepeatOn">' +
                '<label>Repeat On</label>' + that.getMonthlyRepeatOptions() +
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
                value: dateTools.parseDate(service.StartDate),
                format: "dddd, MMMM dd, yyyy",
                change: function (e) {
                    service.StartDate = e.sender.value().toISOString();
                }
            });

            //use the frequency int to get the frequency name(ex. 2 -> "Day")
            var frequencyName = generalTools.repeatFrequencies[service.Frequency];
            //set the format of the Repeat Every text based on the frequency
            if (service.RepeatEveryTimes > 1) {
                frequencyName += "s";
            }
            //set display format if there is a frequency name
            that._repeatFormat = (frequencyName !== "" ? "# " + frequencyName : "");

            //setup the Repeat Every numeric textbox
            widgetElement.find('.repeatEveryNum').kendoNumericTextBox({
                step: 1,
                min: 1,
                max: 1000,
                value: service.RepeatEveryTimes,
                decimals: 0,
                format: that._repeatFormat,
                spin: that.repeatEveryChanged,
                change: function (e) {
                    service.RepeatEveryTimes = e.sender.value();
                }
            });

            //set the endDate value only for the correct endDate field and
            //determine which item in the endDate dropdown should be selected
            if (service.EndAfterTimes) {
                //select "After"
                that._endSelection = 1;
                that._endAfterValue = service.EndAfterTimes;
                if (service.EndAfterTimes > 1) {
                    that._endAfterFormat = "# Occurrences";
                } else {
                    that._endAfterFormat = "# Occurrence";
                }
            } else if (service.EndDate) {
                //select "On"
                that._endSelection = 2;
                that._endOnValue = dateTools.parseDate(service.EndDate);
            } else {
                //select "Never"
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
                    if (endAfter.blur) {
                        endAfter.blur();
                    }
                },
                change: function (e) {
                    service.EndAfterTimes = e.sender.value()
                }
            }).data("kendoNumericTextBox");

            //setup the endDate datepicker
            widgetElement.find('.endDatePicker').kendoDatePicker({
                value: that._endOnValue,
                change: function (e) {
                    service.EndDate = e.sender.value().toISOString();
                }
            });

            //initially show the correct endDate field based on whether EndDate or EndAfterTimes exists
            if (service.EndAfterTimes) {
                widgetElement.find(".endDate .k-numerictextbox").addClass("showInput");
            } else if (service.EndDate) {
                widgetElement.find(".endDate .k-datepicker").addClass("showInput");
            }

            //function to format the option names of the frequency and end Date dropdowns
            var formatItemName = function (item) {
                return item.Name;
            };

            //setup the frequency dropdownlist (starts with 2 because 0 and 1 are reserved for null and "Once")
            var frequencyValues = [
                { value: 2, Name: "Daily" },
                { value: 3, Name: "Weekly" },
                { value: 4, Name: "Monthly" },
                { value: 5, Name: "Yearly" }
            ];

            //setup the frequency dropdown
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

            //initially set the correct frequency(if one exists)
            if (service.Frequency >= 2) {
                widgetElement.find('.frequency').select2("data", {value: service.Frequency, Name: frequencyValues[service.Frequency - 2].Name});
            }

            var endValues = [
                { value: 0, Name: "Never" },
                { value: 1, Name: "After" },
                { value: 2, Name: "On" }
            ];

            //setup the endDate dropdownlist
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
                    //TODO: remove old value from the service?
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

            var weekdayElement = widgetElement.find(".weekdayWrapper div");

            //event for clicking on a day of the week
            weekdayElement.on("click", function (e) {
                var element = e.srcElement;
                //toggle between selected and unselected states
                if ($(element).hasClass("selected")) {
                    $(element).removeClass("selected");
                } else {
                    $(element).addClass("selected");
                }
                that.saveRepeatDays();
            });
            //unselect all days when click on left weekday button
            widgetElement.find(".weekday.left").on("click", function () {
                weekdayElement.removeClass("selected");
                that.saveRepeatDays();
            });
            //select M-F when click on right weekday button
            widgetElement.find(".weekday.right").on("click", function () {
                //unselect all first to remove Sat and Sun.
                weekdayElement.removeClass("selected");
                widgetElement.find(".workday").addClass("selected");
                that.saveRepeatDays();
            });

            that.frequencyChanged(service.Frequency);

            //check if weekly
            if (service.Frequency == 3) {
                //set the repeatOn days
                that.setRepeatDays();
            }
        },

        //region Functions
        //gets the selected days from the weekly repeat
        saveRepeatDays: function () {
            var that = this, days = [];
            //iterate through each day element
            $(that.element).find(".weekday").each(function () {
                //check if it's selected
                if (this.className.indexOf("selected") !== -1) {
                    //get the day name
                    var day = this.className.match(/weekday\s(.*)\s/)[1];
                    day = day.replace(" workday", "");
                    //get the index that corresponds to the day name and add it to the array
                    for (var i in dateTools.days) {
                        if (dateTools.days[i] === day) {
                            days.push(parseInt(i));
                        }
                    }
                }
            });
            service.FrequencyDetailAsWeeklyFrequencyDetail = days;
        },

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
            service.Frequency = frequency;
            var widgetElement = $(that.element);
            var monthlyElement = widgetElement.find(".monthlyRepeatOn");
            var weeklyElement = widgetElement.find(".weeklyRepeatOn");
            //check if frequency is null or not a number
            if (!frequency || (isNaN(parseFloat(frequency)) && !isFinite(frequency))) {
                //set frequency to the selected frequency
                frequency = widgetElement.find("input.frequency").val();
            }
            //get the value of the Repeat Every widget
            var repeat = widgetElement.find(".repeatEveryNum").val();
            //get a reference to the Repeat Every field
            var repeatEvery = widgetElement.find('.repeatEveryNum:not(.k-formatted-value)').data("kendoNumericTextBox");
            //show/hide the correct Repeat On field
            //daily
            if (frequency == 2) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:none");
            //weekly
            } else if (frequency == 3) {
                monthlyElement.attr("style", "display:none");
                weeklyElement.attr("style", "display:block");
                that.setRepeatDays();
                //monthly
            } else if (frequency == 4) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:block");
                //manually add monthly options if none exist
                if (widgetElement.find(".monthlyRepeatOn")[0].innerHTML.indexOf("On the") === -1) {
                    var options = that.getMonthlyRepeatOptions();
                    widgetElement.find(".monthlyRepeatOn")[0].innerHTML = '<label>Repeat On</label>' + options;
                }

                //setup the change event for the radio buttons
                $(".monthlyRepeatOn").find("input[type='radio']").change(function () {
                    //find which option is selected
                    $(".monthlyRepeatOn").find("input[type='radio']").each(function () {
                        if (this.checked) {
                            //save the selected option
                            service.FrequencyDetailAsMonthlyFrequencyDetail = parseInt(this.className.match(/option([0-9]*)$/)[1]);
                        }
                    });
                });
            //yearly
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
            //get the selected frequency
            var frequency = widgetElement.find(".frequency:not(.select2-container)").val();
            //get the value of the Repeat Every field
            var repeat = widgetElement.find(".repeatEveryNum").val();
            //get a reference to the Repeat Every widget
            var repeatEvery = widgetElement.find(".repeatEveryNum:not(.k-formatted-value)").data("kendoNumericTextBox");
            //use the frequency int to get the frequency name(ex. 2 -> "Day")
            var frequencyName = generalTools.repeatFrequencies[frequency];
            //add "s" to the frequency name if repeat number is more than one and frequency exists
            if (frequencyName) {
                if (repeat.match(/^([0-9]*)\s/)[1] > 1) {
                    frequencyName += "s";
                }
            }

            //set display format if there is a frequency name
            repeatEvery.options.format = (frequencyName ? "# " + frequencyName : "");
        },

        //returns an input and a label for each available monthly frequency option
        getMonthlyRepeatOptions: function () {
            var that = this, htmlString = "", monthlyOptions = service.AvailableMonthlyFrequencyDetailTypes;

            //.match(/option([0-9]*)$/)

            //if no repeat was passed to the widget, manually generate the options
            if (!service.StatusInt || monthlyOptions.length == 0) {
                var detailInt = that.getFrequencyDetailInt(service.StartDate);
                //add the first two options
                htmlString = '<input type="radio" name="repeatOnGroup" checked="checked" class="option8" /><label class="inline">On the ' + dateTools.getDateWithSuffix(service.StartDate) + '</label><br />' +
                    '<input type="radio" name="repeatOnGroup" class="option' + detailInt + '" /><label class="inline">On the ' + that.getWeekAndDay(service.StartDate) + '</label><br />';

                var newDetailTypes = [8, parseInt(detailInt)];
                //check if startDate is the last day of the month
                var lastDay = new Date(dateTools.parseDate(service.StartDate).getTime() + 86400000).getDate() === 1;
                //if it is
                if (lastDay) {
                    //add option for the last day of the month
                    htmlString += '<input type="radio" name="repeatOnGroup" class="option10" /><label class="inline">The last day of the month</label>';
                    newDetailTypes.push(10);
                }
                //save the new default options
                service.AvailableMonthlyFrequencyDetailTypes = newDetailTypes;
                service.FrequencyDetailAsMonthlyFrequencyDetail = 8;
            } else {
                for (var mo in monthlyOptions) {
                    if (monthlyOptions[mo] === service.FrequencyDetailAsMonthlyFrequencyDetail) {
                        htmlString += '<input type="radio" name="repeatOnGroup" checked="checked" class="option'+ monthlyOptions[mo] + '" />' +
                            '<label class="inline">' + generalTools.getFrequencyDetailString(monthlyOptions[mo], service.StartDate, true) + '</label><br />';
                    } else {
                        htmlString += '<input type="radio" name="repeatOnGroup" class="option'+ monthlyOptions[mo] + '" />' +
                            '<label class="inline">' + generalTools.getFrequencyDetailString(monthlyOptions[mo], service.StartDate, true) + '</label><br />';
                    }
                }
            }
            return htmlString;
        },

        //get day of the week and the nth occurrence of that day. ex. "3rd Friday"
        getWeekAndDay: function (date) {
            //get a date object from the date string
            date = dateTools.parseDate(date);
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var prefixes = ['1st', '2nd', '3rd', 'Last'];
            return prefixes[0 | (date.getDate() - 1) / 7] + ' ' + days[date.getDay()];
        },

        /**
         * Get the Monthly Frequency Detail
         * @param date
         * @return {number}
         */
        getFrequencyDetailInt: function (date) {
            //get a date object from the date string
            date = dateTools.parseDate(date);
            var prefixes = ["11", "12", "13", "14"];
            return prefixes[0 | (date.getDate() - 1) / 7];
        },

        //remove the widget
        removeWidget: function () {
            var that = this;
            $(that.element)[0].innerHTML = "";
        }
        //endregion
    });
});