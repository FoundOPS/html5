// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold the selected route task signature's logic
 */

'use strict';

define(["sections/routeTask", "db/services", "db/saveHistory", "tools/parameters", "underscore", "jsignature", "jsigbase30", "jsigSVG"],
    function (routeTask, dbServices, saveHistory, parameters, _) {
        /**
         * vm = viewModel
         * popupCaller = the button who's click opened the popup.
         */
        var section = {}, vm = kendo.observable();
        section.vm = vm;

        window.signature = section;

//public methods
        //TODO onLeave: destroy this view to fix resizing bug

        section.initialize = function () {
            $("#sigPad").jSignature();
        };
        section.onBack = function () {
            closeSigPad();
            //go to the previous page that opened the signature
            history.go(-1);

            var sigPad = document.getElementById("sigPad");
            $(sigPad).off();
        };
        section.show = function () {
            setupSigPad();

            var sigPad = document.getElementById("sigPad");
            $(sigPad).off();
            //update the buttons whenever the sig pad changes
            $(sigPad).on("change", sigPad, function (e) {
                if (getSigData()) {
                    $("#sigClear, #sigSave").css("display", "");
                    $("#sigCancel").css("display", "none");
                } else {
                    $("#sigClear, #sigSave").css("display", "none");
                    $("#sigCancel").css("display", "");
                }
            });
        };

//signature pad methods
        var getSigData = function () {
            return $('#sigPad').jSignature("getData", "base30")[1];
        };

        /**
         * Setup the signature pad
         * @param [sigData] Data to initialize the pad with
         */
        var setupSigPad = _.debounce(function (sigData) {
            var width = $(window).width();
            var margin = width > 800 ? (width - 800) / 2 : 0;
            var top = ($('.sigWrapper').height() / 2) - ($('#sigPad').height() / 2);
            $('#content').css('padding', '0');

            $('#sigPad').css("top", top).css('margin', '0 ' + margin + 'px');
            $('.sigWrapper').animate({'opacity': 1}, 300);

            //hide the navigation panel and sidebar
            $('#nav, #sideBarWrapper').animate({'opacity': 0}, 300, function () {
                $('#nav, #sideBarWrapper').css('visibility', 'hidden');
            });

            //reset sig pad
            vm.resetSigPad(sigData);

            if (sigData) {
                $('#sigPad').jSignature("setData", "data:image/jsignature;base30," + sigData);
            }
        }, 250);

        var closeSigPad = function () {
            $(".sigWrapper").animate({"opacity": 0}, 300, function () {
                $("#content").css("padding", "");
            });
            //show the navigation panel and sidebar
            $("#nav").css("visibility", "").animate({"opacity": 1}, 300);
            $("#sideBarWrapper").css("visibility", "").animate({"opacity": 1}, 300, function () {
                $("#sigPad").jSignature("reset");
            });
        };

        /**
         * Reset the signature pad, fix its height
         */
        vm.resetSigPad = function () {
            //reset the canvas to fix drawing bug
            var canvas = $("#sigPad canvas");
            canvas[0].width = $("#sigPad").width();

            $("#sigPad").jSignature("reset");
        };

        vm.saveSig = function () {
            //check there is a signature
            if (getSigData()) {
                var sigField = _.find(routeTask.vm.get("selectedService.Fields"), function (field) {
                    return field.Id === parameters.get().signatureId;
                });
                sigField.set("Value", getSigData());
                routeTask.save(function () {
                    //allow the value to propagate
                    section.onBack();
                });
            } else {
                alert("Please sign before you save or press the cancel button to go back.");
            }
        };

        //Reset css upon resize
        $(window).resize(function () {
            if (parameters.getSection().name === "signature") {
                setupSigPad(getSigData());
            }
        });

        return section;
    });