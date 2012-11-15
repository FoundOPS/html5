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

        section.initialize = function () {
            $(".sigPad").jSignature();
        };

        section.onBack = function () {
            closeSigPad();
            var query = parameters.get();
            delete query.signatureId;
            parameters.set({params: query, replace: true, section: {name: "routeTask"}});
        };

        section.show = function () {
            openSigPad();
        };

//signature pad methods
        var openSigPad = function () {
            vm.resetSigPad();
            var width = $(window).width();
            var margin = width > 800 ? (width - 800) / 2 : 0;
            var top = ($('.sigWrapper').height() / 2) - ($('.sigPad').height() / 2);
            $('#content').css('padding', '0');
            $('.sigPad').css("top", top).css('margin', '0 ' + margin + 'px');
            $('.sigWrapper').animate({'opacity': 1}, 300);
            $('#nav, #sideBarWrapper').animate({'opacity': 0}, 300, function () {
                $('#nav, #sideBarWrapper').css('visibility', 'hidden');
            });
        };
        var closeSigPad = function () {
            $(".sigWrapper").animate({"opacity": 0}, 300, function () {
                $("#content").css("padding", "");
            });
            $("#nav").css("visibility", "").animate({"opacity": 1}, 300);
            $("#sideBarWrapper").css("visibility", "").animate({"opacity": 1}, 300, function () {
                vm.resetSigPad();
            });
        };

        vm.resetSigPad = function () {
            $(".sigPad").jSignature("reset");
        };

        vm.saveSig = function () {
            //check there is a signature
            if ($('.sigPad').jSignature("getData", "base30")[1]) {
                var sigField = _.find(routeTask.vm.get("selectedService.Fields"), function (field) {
                    return field.Id === parameters.get().signatureId;
                });
                sigField.set("Value", $('.sigPad').jSignature("getData", "base30")[1]);
                routeTask.save(function () {
                    //allow the value to propagate
                    section.onBack();
                });
            } else {
                alert("Please sign before you save or press the cancel button to go back.");
            }
        };

        //Detect whether device supports orientation change event, otherwise fall back to the resize event
        var supportsOrientationChange = "onorientationchange" in window,
            orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

        //Reset css upon device rotation
        window.addEventListener(orientationEvent, function () {
            if (parameters.getSection().name === "signature") {
                openSigPad();
            }
        }, false);

        return section;
    });