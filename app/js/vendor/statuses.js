"use strict";

$.widget("ui.statuses", {
    states: {
        idle: 0,
        busy: 1,
        error: 2
    },

    undoMode: {
        none: 0,
        last: 1,
        all: 2
    },

    options: {
        initialStatus: 0,
        initialUndoMode: 0,
        //callbacks
        undoLast: function () {
        },
        undoAll: function () {
        }
    },


//Image paths
    _statusImages: [
        "idleStatus", //State 0
        "busyStatus", //State 1
        "errorStatus" //State 2
    ],

    _init: function () {
        var widget = this, options = widget.options;

        widget._currentState = options.initialStatus;
        widget._currentUndoMode = options.initialUndoMode;
        widget._statusPopup = null;
        widget._lastStateChangeTime = 0;

        //Init
        //Add status to target.
        var statusDiv = '<div id="navStatus" class="navElement">' +
            '<a><div class="navIcon ' + widget._statusImages[options.initialStatus] + '"></div></a>' +
            '</div>';
        $(widget.element).append(statusDiv);

        var menu = widget._createStatusMenu(widget._currentUndoMode);
        widget.statusPopup = $("#navStatus").popup(menu);

        widget.state(widget._currentState);
        widget.setUndoMode(widget._currentUndoMode);

        //TODO make these widget specific
        $(document).on("click", "#undoLast", function () {
            $(document).trigger("statuses.undoLast");
            widget.options.undoLast();
        });

        $(document).on("click", "#undoAll", function () {
            $(document).trigger("statuses.undoAll");
            widget.options.undoAll();
        });
        $(document).trigger("statuses.loaded");
    },

    _createStatusMenu: function (mode) {
        var buttons = "";
        var undoLast = '<div id="undoLast" class="statusPopupButton">Undo Last</div>';
        var undoAll = '<div id="undoAll" class="statusPopupButton">Undo All</div>';

        //Init Popup.
        if (mode >= 1) {
            buttons += undoLast;
        }
        if (mode >= 2) {
            buttons += undoAll;
        }

        var menuHtml =
            '<div id="statusPopup">' +
                '<div class="statusPopupMessage success">' +
                'Your changes have been saved.' +
                '</div>' +
                '<div id="buttonContainer">' +
                buttons +
                '</div>' +
                '</div>';

        var menu = {
            id: "navStatus",
            contents: menuHtml
        };
        return menu;
    },

    //  Functions
    state: function (state) {
        var widget = this;

        //If no argument passed, pass state
        //Else, set state.
        if (typeof(state) === "undefined") {
            //console.log(this.currentState);
            return widget.currentState;
        }

        //Minimum time busy icon is visible.
        var MIN_TIME_VISIBLE = 800;

        var timeNow = new Date().getTime();
        var timeSince = (timeNow - widget._lastStateChangeTime);
        //console.log("Time: "+ timeSince);
        widget._lastStateChangeTime = timeNow;
        var previousState = widget.currentState;

        //If the last state was the busy state, and less than min time has passed; keep image as busy until delay fn.
        //Otherwise, just switch to the state passed.
        if (previousState === widget.states.busy && (timeSince < MIN_TIME_VISIBLE)) {
            //$("#navStatus .navIcon").attr("src", statusImages[states.busy]);
            widget.changeStatusImage(widget._statusImages[widget.states.busy]);
            _.delay(function () {
                widget.setState(state);
            }, (MIN_TIME_VISIBLE - timeSince));
        } else {
            widget.setState(state);
        }
    },

    changeStatusImage: function (state) {
        var statusImages = this._statusImages;
        for (var img in statusImages) {
            if (state === statusImages[img]) {
                $("#navStatus .navIcon").addClass(statusImages[img]);
            } else {
                $("#navStatus .navIcon").removeClass(statusImages[img]);
            }
        }
    },

    //TODO change to state()
    setState: function (state) {
        this.currentState = state;
        //$("#navStatus .navIcon").attr("src", statusImages[state]);
        this.changeStatusImage(this._statusImages[state]);
        $(document).trigger("status.stateChange");
    },

    //TODO change to undoMode()
    setUndoMode: function (mode) {
        var widget = this;
        widget._currentUndoMode = mode;
        var popupClass = widget.statusPopup.constructor;
        var menu = popupClass.getMenu("navStatus");


        popupClass.closePopup();

        if (widget._currentUndoMode === widget.undoMode.none) {
            widget.statusPopup.disablePopup();
        } else {
            widget.statusPopup.enablePopup();
        }

        var newMenu = widget._createStatusMenu(widget._currentUndoMode);

        //Replace menu in popup
        widget.statusPopup.replaceMenu(menu, newMenu);

        $(document).trigger("status.undoModeChange");
    }
});