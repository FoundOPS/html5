// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold the selected route task signature's logic.
 */

'use strict';

define(["sections/routeTask", "db/services", "db/saveHistory", "tools/parameters", "underscore", "tools/kendoTools", "jsignature", "jsigbase30", "jsigSVG"],
    function (routeTask, dbServices, saveHistory, parameters, _) {
        /**
         * vm = viewModel
         * popupCaller = the button who's click opened the popup.
         */
        var section = {}, vm = kendo.observable(), popupCaller;
        window.signature = section;

        section.vm = vm;

//public methods

        section.initialize = function () {
            $(".sigPad").jSignature();
        };
        section.onBack = function () {
            vm.closeSigPad();
            var query = parameters.get();
            delete query.signatureId;
            parameters.set({params: query, replace: true, section: {name: "routeTask"}});
        };
        section.show = function () {
            //TODO replace this with centralized access to loaded entities in new datamanager
            var service = routeTask.vm.get("selectedService");
//            parameters.get().signatureId;

            vm.openSigPad();
        };

//signature pad methods
        vm.resetSigPad = function () {
            $(".sigPad").jSignature("reset");
        };
        vm.openSigPad = function () {
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
        vm.closeSigPad = function () {
            $(".sigWrapper").animate({"opacity": 0}, 300, function () {
                $("#content").css("padding", "");
            });
            $("#nav").css("visibility", "").animate({"opacity": 1}, 300);
            $("#sideBarWrapper").css("visibility", "").animate({"opacity": 1}, 300, function () {
                vm.resetSigPad();
            });
        };
        vm.saveSig = function () {
            if ($('.sigPad').jSignature("getData", "base30")[1] !== "") {
                //TODO: Use field ID, not Type.
                var sigField = _.find(routeTask.vm.get("selectedService.Fields"), function (field) {
                    return field.Id === parameters.get().signatureId;
                });
                sigField.set("Value", $('.sigPad').jSignature("getData", "base30")[1]);
                setTimeout(function () {
                    //allow the value to propagate
                    section.onBack();
                }, 200);
            } else {
                alert("Please sign before you save or press the cancel button to go back.");
            }
        };

        //Handle css upon device rotation.
        //Detect whether device supports orientationchange event, otherwise fall back to the resize event.
        var supportsOrientationChange = "onorientationchange" in window,
            orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
        window.addEventListener(orientationEvent, function () {
            if (parameters.get().signatureId) {
                vm.openSigPad();
            }
        }, false);

        return section;
    });