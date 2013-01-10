"use strict";
!function ($) {
    //////////////////////////
    //  Enums
    //////////////////////////
    var states = {
        idle: 0,
        busy: 1,
        error: 2
    };

    var undoMode = {
        none: 0,
        last: 1,
        all: 2
    };

    //Image paths
    var statusImages =
        [
            "../img/idleStatus.png", //State 0
            "../img/busyStatus.png", //State 1
            "../img/errorStatus.png" //State 2
        ];

    var INIT_STATUS_IMG = statusImages[states.error];

    //////////////////////////
    //  Constructor
    //////////////////////////
    function Statuses(targetDiv, undoLast, undoAll){
       var thisStatus = this;
        this.targetDiv = targetDiv;
        this.currentState = states.idle;
        this.currentUndoMode = undoMode.all;

        this.onUndoLast = function(){};
        this.onUndoAll = function(){};

        var initializeStatuses = function(targetDiv){
            //Add status to target.
            var statusDiv = '<div id="statusesContainer">' +
                '<div id="navStatus" class="navElement">' +
                '<a><img class="navIcon" src="'+ INIT_STATUS_IMG +'"></img></a>' +
                '</div>' +
                '</div>';
            $(targetDiv).append(statusDiv);

            //Init Popup.
            var contents = [];
            var undoLastMenu = {"name": "Undo Last", id: "undoLast"};
            var undoAllMenu = {"name": "Undo All", id: "undoAll"};
            if(thisStatus.currentUndoMode>=1){
                contents.push(undoLastMenu);
            }
            if(thisStatus.currentUndoMode>=2){
                contents.push(undoAllMenu);
            }

            if(contents.lenght===0){
                //TODO: Disable popup.
            }

            $("#navStatus").optionsPopup({
                id: "navStatus",
                contents: contents,
                disableHeader: true
            });

            $(document).on("click", "#undoLast", function(){
                $(document).trigger("status.undoLast");
                thisStatus.onUndoLast();
            });

            $(document).on("click", "#undoAll", function(){
                $(document).trigger("status.undoAll");
                thisStatus.onUndoAll();
            });
        };

        initializeStatuses(targetDiv);
    }

    //////////////////////////
    //  Functions
    //////////////////////////
    Statuses.prototype.setState = function(state){
        this.currentState = state;

        $("#navStatus .navIcon").attr("src", statusImages[state]);
    };

    Statuses.prototype.setUndoMode = function(mode){
        this.currentUndoMode = mode;

        //TODO: Update undo menu.
    };

    //TODO: Move into navigator.
    $(document).on("navigator.loaded", function(){
        var navDiv = $("#nav");
        var s = new Statuses(navDiv, null, null);
    });
}(window.jQuery);
