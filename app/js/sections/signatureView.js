// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold the selected route task's logic.
 */

'use strict';

define(["sections/routeTask", "db/services", "db/saveHistory", "tools/parameters", "underscore", "tools/kendoTools", "jsignature", "jsigbase30", "jsigSVG"],
    function (routeTask, dbServices, saveHistory, parameters, _, kendoTools) {
        /**
         * routeTask = wrapper for all service objects
         * vm = viewModel
         * popupCaller = the button who's click opened the popup.
         */
        var section = {}, vm = kendo.observable(), popupCaller;
        window.routeTask = section;

        section.vm = vm;

//public methods

        section.initialize = function () {
            console.log("Hello, this is sigView");
            $(".sigPad").jSignature();
        };
        section.onBack = function () {
                application.navigate("routeTask", "slide");
        };
        section.show = function () {
            //Get selected task ID.
        };

//signature pad methods
        vm.resetSigPad = function () {$(".sigPad").jSignature("reset")};
        vm.openSigPad = function () {
            vm.resetSigPad();
            //Wait until screen is in landscape orientation to call out the sig pad.
            setTimeout( function() {
                var width = $('#routeTask').width();
                var margin = width > 800 ? ($('#sideBarWrapper').width()) / 2 : 0;
                var canvasMargin = width > 800 ? (width-800)/2 : 0;
                $('#content').css('padding', '0');
                $('.sigWrapper canvas').css('margin', '0 '+canvasMargin+'px 0'+canvasMargin+'px')
                $('.sigWrapper').css('visibility', 'visible').css('width', width).css('z-index', '10000').css('margin', '0 '+margin+'px 0'+margin+'px').animate({'opacity': 1}, 300);
                $('#sigListView ul, #routeStatus-listview, .fieldLabel').css('visibility', 'hidden');
                $('#nav, #sideBarWrapper').animate({'opacity': 0}, 300, function () {
                    $('#nav, #sideBarWrapper').css('visibility', 'hidden');
                });
                kendoTools.disableScroll('#routeTask');
                //Reset scroll to top.
                $('#routeTask .km-scroll-container').css('-webkit-transform', '');
            }, 500);
        };
        vm.closeSigPad = function () {
//        if (field.Value) {
//            $("#sigDisplay").jSignature("setData", "data:image/jsignature;base30,"+field.Value);
//        }
            $(".sigWrapper").animate({"opacity": 0}, 300, function () {
                $(".sigWrapper").css("visibility", "hidden").css("width", 0).css("z-index", "-10");
                $("#content").css("padding", "");
                $("#sigListView ul, #routeStatus-listview, .fieldLabel").css("visibility", "");
            });
            $("#nav").css("visibility", "").animate({"opacity": 1}, 300, function () {
                vm.resetSigPad();
            });
            $("#sideBarWrapper").css("visibility", "").animate({"opacity": 1}, 300, function () {
                console.log($("textarea"));
            });
            kendoTools.re_enableScroll("#routeTask");

            //Reset scroll to top.
            $("#routeTask .km-scroll-container").css("-webkit-transform", "");
        };
        vm.saveSig = function () {
            if($('.sigPad').jSignature("getData","base30")[1] !== "") {
                console.log(vm);
//            field.set('Value', $('.sigPad').jSignature("getData","base30")[1]);
                vm.closeSigPad();
                vm.displaySig();
            } else {
                alert("Please sign before you save or hit the cancel button to go back.");
            }
        };
        vm.displaySig = function () {
//        $(".sigPad").jSignature("setData", "data:image/jsignature;base30,"+field.Value);
            var svgString = $('.sigPad').jSignature("getData","svgbase64").join(",");
            $("#sigDisplay").attr("src", "data:"+svgString);
        };
        //Resize sig pad opon window dimension change (such as screen rotation).
        $(window).bind("resize", function () {
            var width = $('#routeTask').width();
            var margin = width > 800 ? ($('#sideBarWrapper').width()) / 2 : 0;
            var canvasMargin = width > 800 ? (width-800)/2 : 0;
            $('#content').css('padding', '0');
            $('.sigWrapper canvas').css('margin', '0 '+canvasMargin+'px 0'+canvasMargin+'px')
            $('.sigWrapper').css('width', width).css('margin', '0 '+margin+'px 0'+margin+'px');
            if ($(".sigWrapper").css("visibility") === "visible" ) {
                $('#sideBarWrapper').css('visibility', 'hidden');
            }
        });

        return section;
    });