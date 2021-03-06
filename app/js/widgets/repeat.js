// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(["tools/generalTools", "tools/dateTools"], function (generalTools, dateTools) {
//    var testService = {FrequencyInt: 4, StartDate: new Date(), RepeatEveryTimes: 2, EndDate: new Date(), FrequencyDetailInt: 14,
//        EndAfterTimes: null, AvailableMonthlyFrequencyDetailTypes: [8, 14];
    var service = {FrequencyInt: null, StartDate: null, RepeatEveryTimes: null, EndDate: null,
            EndAfterTimes: null, FrequencyDetailInt: null, AvailableMonthlyFrequencyDetailTypes: []},
    element;

    $.widget("ui.repeat", {
        options: {
            repeat: service
        },
        _create: function () {
            var _repeat, widget = this;
            element = $(widget.element);

            if (widget.options.repeat) {
                service = widget.options.repeat;
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
                '<label>Repeat On</label>' + widget.getMonthlyRepeatOptions() +
                '</div>' +
                '<div class="endDate">' +
                '<label>End Date</label>' +
                '<input class="endDropdown" />' +
                '<input class="endAfterNum" type="number" />' +
                '<input class="endDatePicker" />' +
                '</div>');

            widget.element.append(_repeat);

            //region SetupFields
            //setup the startdate datepicker
            element.find('.startDatePicker').kendoDatePicker({
                value: dateTools.parseDate(service.StartDate),
                format: "dddd, MMMM dd, yyyy",
                change: function (e) {
                    service.StartDate = e.sender.value().toISOString();
                }
            });

            //use the frequency int to get the frequency name(ex. 2 -> "Day")
            var frequencyName = generalTools.repeatFrequencies[service.FrequencyInt];
            //set the format of the Repeat Every text based on the frequency
            if (service.RepeatEveryTimes > 1) {
                frequencyName += "s";
            }
            //set display format if there is a frequency name
            widget._repeatFormat = (frequencyName !== "" ? "# " + frequencyName : "");

            //setup the Repeat Every numeric textbox
            element.find('.repeatEveryNum').kendoNumericTextBox({
                step: 1,
                min: 1,
                max: 1000,
                value: service.RepeatEveryTimes,
                decimals: 0,
                format: widget._repeatFormat,
                spin: widget.repeatEveryChanged,
                change: function (e) {
                    service.RepeatEveryTimes = e.sender.value();
                }
            });

            //set the endDate value only for the correct endDate field and
            //determine which item in the endDate dropdown should be selected
            if (service.EndAfterTimes) {
                //select "After"
                widget._endSelection = 1;
                widget._endAfterValue = service.EndAfterTimes;
                if (service.EndAfterTimes > 1) {
                    widget._endAfterFormat = "# Occurrences";
                } else {
                    widget._endAfterFormat = "# Occurrence";
                }
            } else if (service.EndDate) {
                //select "On"
                widget._endSelection = 2;
                widget._endOnValue = dateTools.parseDate(service.EndDate);
            } else {
                //select "Never"
                widget._endSelection = 0;
            }

            //setup the endAfter numeric textbox
            var endAfter = element.find('.endAfterNum').kendoNumericTextBox({
                step: 1,
                min: 1,
                max: 1000,
                value: widget._endAfterValue,
                decimals: 0,
                format: widget._endAfterFormat,
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
            element.find('.endDatePicker').kendoDatePicker({
                value: widget._endOnValue,
                change: function (e) {
                    service.EndDate = e.sender.value().toISOString();
                }
            });

            //initially show the correct endDate field based on whether EndDate or EndAfterTimes exists
            if (service.EndAfterTimes) {
                element.find(".endDate .k-numerictextbox").addClass("showInput");
            } else if (service.EndDate) {
                element.find(".endDate .k-datepicker").addClass("showInput");
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
            element.find('.frequency').select2({
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
                widget.frequencyChanged(element.find('.frequency').select2("data").value);
            });

            //initially set the correct frequency(if one exists)
            if (service.FrequencyInt >= 2) {
                element.find('.frequency').select2("data", {value: service.FrequencyInt, Name: frequencyValues[service.FrequencyInt - 2].Name});
            }

            var endValues = [
                { value: 0, Name: "Never" },
                { value: 1, Name: "After" },
                { value: 2, Name: "On" }
            ];

            //setup the endDate dropdownlist
            element.find('.endDropdown').select2({
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
                    var textBox = element.find(".endDate .k-numerictextbox");
                    var datepicker = element.find(".endDate .k-datepicker");
                    //show the correct field based on the end date option
                    if (e.val == 0) {
                        textBox.removeClass("showInput");
                        datepicker.removeClass("showInput");
                        //clear the values for endOn and endAfter
                        service.EndDate = null;
                        service.EndAfterTimes = null;
                    } else if (e.val == 1) {
                        textBox.addClass("showInput");
                        datepicker.removeClass("showInput");
                        //clear the value for endOn
                        service.EndDate = null;
                    } else if (e.val == 2) {
                        textBox.removeClass("showInput");
                        datepicker.addClass("showInput");
                        //clear the value for endAfter
                        service.EndAfterTimes = null;
                    }
                });

            //initially set the correct end option
            element.find('.endDropdown').select2("data", {value: widget._endSelection, Name: endValues[widget._endSelection].Name});
            //endregion

            var weekdayElements = element.find(".weekdayWrapper div");

            //event for clicking on a day of the week
            weekdayElements.on("click", function (e) {
                var weekdayElement = e.srcElement;
                //toggle between selected and unselected states
                if ($(weekdayElement).hasClass("selected")) {
                    $(weekdayElement).removeClass("selected");
                } else {
                    $(weekdayElement).addClass("selected");
                }
                widget.saveRepeatDays();
            });
            //unselect all days when click on left weekday button
            element.find(".left").on("click", function () {
                weekdayElements.removeClass("selected");
                widget.saveRepeatDays();
            });
            //select M-F when click on right weekday button
            element.find(".right").on("click", function () {
                //unselect all first to remove Sat and Sun.
                weekdayElements.removeClass("selected");
                element.find(".workday").addClass("selected");
                widget.saveRepeatDays();
            });

            widget.frequencyChanged(service.FrequencyInt);

            //check if weekly
            if (service.FrequencyInt == 3) {
                //set the repeatOn days
                widget.setRepeatDays();
            }
        },

        //region Functions
        //gets the selected days from the weekly repeat
        saveRepeatDays: function () {
            var widget = this, days = [];
            //iterate through each day element
            $(widget.element).find(".weekday").each(function () {
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
            service.FrequencyDetailInt = days;
        },

        //sets the initial selected days for a weekly repeat
        setRepeatDays: function () {
            var widget = this, frequencyDetail = service.FrequencyDetailInt;
            //iterate through each weekday int
            for (var d in frequencyDetail) {
                //filter out properties
                if(parseInt(d) || d === "0") {
                    var dayInt = frequencyDetail[d];
                    //select the button with the id that matches the current day
                    $(widget.element).find("." + dateTools.days[dayInt]).addClass("selected");
                }
            }
        },

        /**
         * Shows and hides the correct fields based on the frequency and sets the text in Repeat Every
         * @param {string} frequency ex. "Weekly"
         */
        frequencyChanged: function (frequency) {
            var widget = this;
            service.FrequencyInt = frequency;
            var element = $(widget.element);
            var monthlyElement = element.find(".monthlyRepeatOn");
            var weeklyElement = element.find(".weeklyRepeatOn");
            //check if frequency is null or not a number
            if (!frequency || (isNaN(parseFloat(frequency)) && !isFinite(frequency))) {
                //set frequency to the selected frequency
                frequency = element.find("input.frequency").val();
            }
            //get the value of the Repeat Every widget
            var repeat = element.find(".repeatEveryNum").val();
            //get a reference to the Repeat Every field
            var repeatEvery = element.find('input.repeatEveryNum:not(.k-formatted-value)').data("kendoNumericTextBox");
            //show/hide the correct Repeat On field
            //daily
            if (frequency == 2) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:none");
                //clear values for monthly and weekly
                service.FrequencyDetailInt = null;
            //weekly
            } else if (frequency == 3) {
                monthlyElement.attr("style", "display:none");
                weeklyElement.attr("style", "display:block");
                widget.setRepeatDays();
                //monthly
            } else if (frequency == 4) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:block");
                //manually add monthly options if none exist
                if (element.find(".monthlyRepeatOn")[0].innerHTML.indexOf("On the") === -1) {
                    var options = widget.getMonthlyRepeatOptions();
                    element.find(".monthlyRepeatOn")[0].innerHTML = '<label>Repeat On</label>' + options;
                }

                //setup the change event for the radio buttons
                $(".monthlyRepeatOn").find("input[type='radio']").change(function () {
                    //find which option is selected
                    $(".monthlyRepeatOn").find("input[type='radio']").each(function () {
                        if (this.checked) {
                            //save the selected option
                            service.FrequencyDetailInt = parseInt(this.className.match(/option([0-9]*)$/)[1]);
                        }
                    });
                });
            //yearly
            } else if (frequency == 5) {
                weeklyElement.attr("style", "display:none");
                monthlyElement.attr("style", "display:none");
                //clear values for monthly and weekly
                service.FrequencyDetailInt = null;
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
            widget.repeatEveryChanged();
            repeatEvery.focus();
            element.find('.repeatEveryNum:not(.k-formatted-value)').blur();
        },

        //updates the Repeat Every text when the value changes
        repeatEveryChanged: function () {
            //get the selected frequency
            var frequency = element.find(".frequency:not(.select2-container)").val();
            //get the value of the Repeat Every field
            var repeat = element.find('input.repeatEveryNum:not(.k-formatted-value)').val();
            //get a reference to the Repeat Every widget
            var repeatEvery = element.find('input.repeatEveryNum:not(.k-formatted-value)').data("kendoNumericTextBox");
            //use the frequency int to get the frequency name(ex. 2 -> "Day")
            var frequencyName = generalTools.repeatFrequencies[frequency];
            //add "s" to the frequency name if repeat number is more than one and frequency exists
            if (frequencyName) {
                var match = repeat.match(/^([0-9]*)\s/);
                if ((match && match[1] > 1) || repeat > 1) {
                    frequencyName += "s";
                }
            }

            //set display format if there is a frequency name
            repeatEvery.options.format = (frequencyName ? "# " + frequencyName : "");
        },

        //returns an input and a label for each available monthly frequency option
        getMonthlyRepeatOptions: function () {
            var widget = this, htmlString = "", monthlyOptions = service.AvailableMonthlyFrequencyDetailTypes;

            //.match(/option([0-9]*)$/)

            //if no repeat was passed to the widget, manually generate the options
            if (!service.StatusInt || monthlyOptions.length == 0) {
                var detailInt = widget.getFrequencyDetailInt(service.StartDate);
                //add the first two options
                htmlString = '<input type="radio" name="repeatOnGroup" checked="checked" class="option8" /><label class="inline">On the ' + dateTools.getDateWithSuffix(service.StartDate) + '</label><br />' +
                    '<input type="radio" name="repeatOnGroup" class="option' + detailInt + '" /><label class="inline">On the ' + widget.getWeekAndDay(service.StartDate) + '</label><br />';

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
                service.FrequencyDetailInt = 8;
            } else {
                for (var mo in monthlyOptions) {
                    //filter out properties
                    if(parseInt(mo) || mo === "0") {
                        if (monthlyOptions[mo] === service.FrequencyDetailInt) {
                            htmlString += '<input type="radio" name="repeatOnGroup" checked="checked" class="option'+ monthlyOptions[mo] + '" />' +
                                '<label class="inline">' + generalTools.getFrequencyDetailString(monthlyOptions[mo], service.StartDate, true) + '</label><br />';
                        } else {
                            htmlString += '<input type="radio" name="repeatOnGroup" class="option'+ monthlyOptions[mo] + '" />' +
                                '<label class="inline">' + generalTools.getFrequencyDetailString(monthlyOptions[mo], service.StartDate, true) + '</label><br />';
                        }
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
            var widget = this;
            $(widget.element)[0].innerHTML = "";
        }
        //endregion
    });
});