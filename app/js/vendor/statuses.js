"use strict";
!function ($) {
    //TODO: Change away from last status instantiated.
    var status = null;
    var methods = {
        init: function (config) {
            console.log("Init.");
            var loadStatus = function(){
                console.log("Status loaded.");
                var navDiv = $("#nav");

                var undoLast = null;
                if(config.undoLastFunction)undoLast = config.undoLastFunction;

                var undoAll = null;
                if(config.undoAllFunction)undoAll = config.undoAllFunction;

                return status = new Statuses(navDiv, undoLast, undoAll);
            };
            if($("#nav").length===0){
                $(document).on("navigator.loaded", function(){
                    return loadStatus();
                });
            }else{
                return loadStatus();
            }
        },
        setState: function(state){
            //console.log("Setting state.");
            status.setState(state);
        },
        setUndoMode: function(mode){
            //console.log("Setting mode.");
            status.setUndoMode(mode);
        },
        setUndoLastFunction: function(f){
            status.onUndoLast = f;
        },
        setUndoAllFunction: function(f){
            status.onUndoAll = f;
        }

    };

    $.fn.status = function (method) {
        // Create some defaults, extending them with any options that were provided
        //var settings = $.extend({}, options);
        // Method calling logic

        if (methods[method]) {
            if(method!=='init'&&!navigator){
                $.error('Navigator not initialized!');
                return;
            }
            return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.navigator');
        }

        return this.each(function () {});
    };


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

    var INIT_STATUS_IMG = statusImages[states.idle];

    var createStatusMenu = function(status){
        var popupClass = $(document).popup("getPopupClass");
        var contents = [];
        var menu = {
            id: "navStatus",
            contents: contents,
            disableHeader: true
        };

        var undoLastMenu = {"name": "Undo Last", id: "undoLast"};
        var undoAllMenu = {"name": "Undo All", id: "undoAll"};

        if(status.currentUndoMode>=1){
            contents.push(undoLastMenu);
        }
        if(status.currentUndoMode>=2){
            contents.push(undoAllMenu);
        }
        return menu;
    };

    //////////////////////////
    //  Constructor
    //////////////////////////
    function Statuses(targetDiv, undoLast, undoAll){
        var thisStatus = this;
        this.targetDiv = targetDiv;
        var INIT_STATE = states.idle;
        var INIT_UNDO_MODE = undoMode.none;
        this.currentState = INIT_STATE;
        this.currentUndoMode = INIT_UNDO_MODE;
        this.statusPopup = null;
        this.lastStateChangeTime = 0;

        this.onUndoLast = undoLast;
        this.onUndoAll = undoAll;

        //Init
        //Add status to target.
        var statusDiv = '<div id="statusesContainer">' +
            '<div id="navStatus" class="navElement">' +
            '<a><img class="navIcon" src="'+ INIT_STATUS_IMG +'"></img></a>' +
            '</div>' +
            '</div>';
        $(targetDiv).append(statusDiv);

        //Init Popup.
        var menu = createStatusMenu(thisStatus);
        thisStatus.statusPopup = $("#navStatus").optionsPopup(menu);

        this.setState(INIT_STATE);
        this.setUndoMode(INIT_UNDO_MODE);

        $(document).on("click", "#undoLast", function(){
            $(document).trigger("status.undoLast");
            thisStatus.onUndoLast();
        });

        $(document).on("click", "#undoAll", function(){
            $(document).trigger("status.undoAll");
            thisStatus.onUndoAll();
        });
    }

    //////////////////////////
    //  Functions
    //////////////////////////
    Statuses.prototype.setState = function(state){
        var timeNow = new Date().getTime();
        var timeSince = (timeNow-this.lastStateChangeTime);
        //console.log("Time: "+ timeSince);
        this.lastStateChangeTime = timeNow;
        var previousState = this.currentState;
        this.currentState = state;

        if(previousState===states.busy&&timeSince<800){
            $("#navStatus .navIcon").attr("src", statusImages[states.busy]);
            //console.log("Busy.");
            _.delay(function(){
                //console.log("Fired.");
                $("#navStatus .navIcon").attr("src", statusImages[state]);
                $(document).trigger("status.stateChange");
            }, (800-timeSince));
        }else{
            $("#navStatus .navIcon").attr("src", statusImages[state]);
            $(document).trigger("status.stateChange");
        }

    };

    Statuses.prototype.setUndoMode = function(mode){
        var previousMode = this.currentUndoMode;
        this.currentUndoMode = mode;
        var popupClass = this.statusPopup.superConstructor;
        var menu = popupClass.getMenu("navStatus");
        var newMenu = null;

        /*if(previousMode === mode){
            return;
        }*/

        popupClass.closePopup();

        if(this.currentUndoMode === undoMode.none){
            this.statusPopup.disablePopup();
        }else{
            this.statusPopup.enablePopup();
        }

        newMenu = createStatusMenu(this, mode);
        //console.log("currentUndoMode: "+mode);

        //Overwrite properties //TODO: Move into popup function, replaceMenu(oldMenu, newMenu).
        var property;
        for(property in menu){
            delete menu[property];
        }
        for(property in newMenu){
            menu[property] = newMenu[property];
        }

        $(document).trigger("status.undoModeChange");
    };
}(window.jQuery);
