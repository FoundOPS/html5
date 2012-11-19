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
            $("#sigPad").jSignature();
        };
        section.onBack = function () {
            closeSigPad();
            //go to the previous page that opened the signature
            history.go(-1);
        };
        section.show = function () {
            setupSigPad();

            var sigPad = document.getElementById("sigPad");
            $(sigPad).on("change", sigPad, function(e) {
                if ($('#sigPad').jSignature("getData", "base30")[1]) {
                    $("#sigClear, #sigSave").css("display", "");
                    $("#sigCancel").css("display", "none");
                } else {
                    $("#sigClear, #sigSave").css("display", "none");
                    $("#sigCancel").css("display", "");
                }
            });
        };

//        #sigCancel {
//            float: left;
//            top:10px;
//            left: 10px;
//            margin-right: 8px;
//        }
//        #sigClear {
//            float: left;
//            top:10px;
//            margin-left: 8px;
//        }
//        #sigSave {
//            float: right;
//            top:10px;
//            right: 10px;
//        }

//signature pad methods
        var setupSigPad = _.debounce(function () {
            var width = $(window).width();
            var margin = width > 800 ? (width - 800) / 2 : 0;
            var top = ($('.sigWrapper').height() / 2) - ($('#sigPad').height() / 2);
            $('#content').css('padding', '0');

            $('#sigPad').css("top", top).css('margin', '0 ' + margin + 'px');
            $('.sigWrapper').animate({'opacity': 1}, 300);

            $('#nav, #sideBarWrapper').animate({'opacity': 0}, 300, function () {
                $('#nav, #sideBarWrapper').css('visibility', 'hidden');
            });

            //reset the canvas, fixes drawing bug
            var canvas = $("#sigPad canvas")[0];
            canvas.width = canvas.width;

            //reset sig pad to redraw sig line
            vm.clearSigPad();
        }, 250);

        var closeSigPad = function () {
            $(".sigWrapper").animate({"opacity": 0}, 300, function () {
                $("#content").css("padding", "");
            });
            $("#nav").css("visibility", "").animate({"opacity": 1}, 300);
            $("#sideBarWrapper").css("visibility", "").animate({"opacity": 1}, 300, function () {
                vm.clearSigPad();
            });
        };

        vm.clearSigPad = function () {
            $("#sigPad").jSignature("reset");
        };

        vm.saveSig = function () {
            //check there is a signature
            if ($('#sigPad').jSignature("getData", "base30")[1]) {
                var sigField = _.find(routeTask.vm.get("selectedService.Fields"), function (field) {
                    return field.Id === parameters.get().signatureId;
                });
                sigField.set("Value", $('#sigPad').jSignature("getData", "base30")[1]);
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
                setupSigPad();
            }
        });

        return section;
    });