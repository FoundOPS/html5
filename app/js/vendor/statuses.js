"use strict";
!function ($) {
    var methods = {
        init: function () {
            console.log("Init.");
            var loadStatus = function(){
                console.log("Status loaded.");
                var navDiv = $("#nav");
                return new Statuses(navDiv, null, null);
            };
            if($("#nav").length===0){
                $(document).on("navigator.loaded", function(){
                    return loadStatus();
                });
            }else{
                return loadStatus();
            }
        },
        setState: function(status, state){
            console.log("Setting state.");
            status.setState(state);
        },
        setUndoMode: function(status, mode){
            console.log("Setting mode.");
            status.setUndoMode(mode);
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

    var createStatusMenu = function(status, mode){
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
        this.currentState = states.idle;
        this.currentUndoMode = undoMode.all;
        this.statusPopup = null;

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
            var menu = createStatusMenu(thisStatus, thisStatus.currentUndoMode);
            thisStatus.statusPopup = $("#navStatus").optionsPopup(menu);

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

        $(document).trigger("status.stateChange");
    };

    Statuses.prototype.setUndoMode = function(mode){
        var previousMode = this.currentUndoMode;
        this.currentUndoMode = mode;

        var popupClass = this.statusPopup.superConstructor;
        var menu = popupClass.getMenu("navStatus");
        var newMenu = null;

        if(previousMode === mode){
            return;
        }

        popupClass.closePopup();

        if(this.currentUndoMode === undoMode.none){
            this.statusPopup.disablePopup();
        }else{
            this.statusPopup.enablePopup();
        }

        newMenu = createStatusMenu(this, mode);
        console.log("currentUndoMode: "+mode);

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
