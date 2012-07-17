define(["lib/jquery.mousewheel", "lib/jquery.jScrollPane"], function () {
    /** Popup Constructor **/
    function Popup(data) {
        var thisPopup = this;
        var title = "";
        var content = "";
        var object = null;
        var history = [];
        var lastElementClick = null;
        var currentTarget = null;

        //TODO: Passed as object until jQuery plugin is written.
        if(typeof(data.popupListener)==='undefined'){
            console.log("ERROR: No listener passed!");
            return;
        }
        var listenerElements = $(data.popupListener);
        listenerElements.filter(".popup").click(function (e) {
            thisPopup.toggleVisible(e, $(this));
        });

        //Static data objects, could be removed in future iterations.
        var menus = [
            {
                id: "navClient",
                title: data.name,
                contents: [
                    {"name": "Settings", url: data.settingsUrl},
                    {"name": "Change Business", id: "changeBusiness"},
                    {"name": "Logout", url: data.logoutUrl}
                ]
            }
        ];

        this.addMenu = function (id, title, contents) {
            menus.push({'id': id, 'title': title, 'contents': contents});
        };

        this.toggleVisible = function (e, clicked) {
            var clickedDiv = $(clicked);
            if (clickedDiv === null) {
                //console.log("ERROR: No element clicked!");
                return;
            }

            var popupWrapperDiv = $("#popupWrapper");
            if (popupWrapperDiv.length === 0) {
                //console.log("Popup not initialized; initializing.");
                popupWrapperDiv = this.createPopup();
                if (popupWrapperDiv.length === 0) {
                    //console.log("ERROR: Failed to create Popup!");
                    return;
                }
            }

            var id = clickedDiv.attr("id");
            //TODO: Fix repetition.
            if ($("#popup").is(":visible") && lastElementClick !== null) {
                if (clickedDiv.is("#" + lastElementClick)) {
                    //console.log("Clicked on same element!");
                    this.closePopup();
                    lastElementClick = clickedDiv.attr("id");
                    return;
                }
                //console.log("Clicked on different element!");
                this.closePopup();
            }
            var left = this.getLeft(clickedDiv, popupWrapperDiv);
            popupWrapperDiv.css("left", left);

            var top = clickedDiv.offset().top + clickedDiv.height() + $("#popupArrow").height();
            popupWrapperDiv.css("padding-top", top + "px");
            this.populate(id);

            clickedDiv.trigger("popupEvent", clickedDiv);

            $("#popup").stop(false, true).fadeIn('fast');
            //TODO: Fire event here and reinit on in in navigator.js
            $("#popupContentWrapper").data('jsp').reinitialise();
            lastElementClick = clickedDiv.attr("id");
        };

        //Function returns the left offset of the popup and sets the carrot element's position.
        this.getLeft = function (target, popupDiv) {
            var padding = 4;
            currentTarget = target;
            var x = target.offset().left + target.width() / 2;
            var rightOffset = x + popupDiv.outerWidth() / 2 + padding;
            var offset = x - popupDiv.width() / 2;
            var windowWidth = $(window).width();

            //Sets popup variables referenced in resize listener.
            var offScreen = false;

            var carrotPos = "50%";
            if (offset < 0) {
                offScreen = true;
                offset = padding;
            } else if (rightOffset > windowWidth) {
                offScreen = true;
                offset = windowWidth - popupDiv.width() - padding;
            }

            var carrot = $("#popupArrow");
            if (offScreen) {
                carrotPos = (x - offset + padding);
            }
            //Moves carrot on popup div.
            carrot.css("left", carrotPos);

            //Returns left offset of popup from window.
            return offset;
        };

        /** Initializes scrollbar for popup contents **/
        this.initPopupScrollBar = function () {
            var popupContentDiv = $("#popupContentWrapper");
            popupContentDiv.jScrollPane({
                horizontalGutter: 0,
                verticalGutter: 0,
                'showArrows': false
            });

            var api = popupContentDiv.data('jsp');
            var throttleTimeout;
            $(window).bind('resize', function(){
                if ($.browser.msie) {
                    if (!throttleTimeout) {
                        throttleTimeout = setTimeout(function(){
                                api.reinitialise();
                                throttleTimeout = null;
                            }, 50
                        );
                    }
                } else {
                    api.reinitialise();
                }
            });
        };

        // createPopup: Prepends popup to dom
        this.createPopup = function () {
            //Creates popup div that will be populated in the future.
            var popupWrapperDiv = $(document.createElement("div"));
            popupWrapperDiv.attr("id", "popupWrapper");

            var s = "<div id='popup'>" +
                "<div id='popupArrow'></div>" +
                "<div id='currentPopupAction' style='display: none;'></div>" +
                "<div id='popupHeader'>" +
                "<a id='popupBack'></a>" +
                "<span id='popupTitle'></span>" +
                "<a id='popupClose'></a>" +
                "</div>" +
                "<div id='popupContentWrapper'>" +
                "<div id='popupContent'></div>" +
                "</div>" +
                "</div>";
            popupWrapperDiv.html(s);
            popupWrapperDiv.find("#popup").css("display", "none");

            //Appends created div to page.
            $("body").prepend(popupWrapperDiv);

            //Click listener for popup close button.
            $("#popupClose").click(function () {
                thisPopup.closePopup();
            });

            $("#popupBack").click(function () {
                history.pop();
                if (history.length <= 0) {
                    thisPopup.closePopup();
                    return;
                }
                thisPopup.setData(history[history.length - 1]);
            });

            //Window resize listener to check if popup is off screen.
            $(window).on('resize', function () {
                    var popupWrapperDiv = $("#popupWrapper");
                    if ($("#popup").is(":visible")) {
                        var left = thisPopup.getLeft(currentTarget, popupWrapperDiv);
                        popupWrapperDiv.css("left", left);
                    }
                }
            );

            //Click listener to detect clicks outside of popup
            $('html')
                .on('click touchend', function (e) {
                    var clicked = $(e.target);
                    //TODO: Return if not visible.
                    var popupLen = clicked.parents("#popup").length + clicked.is("#popup") ? 1 : 0;
                    var navLen = clicked.parents(".navElement").length + clicked.is(".navElement") ? 1 : 0;
                    if (popupLen === 0 && navLen === 0) {
                        thisPopup.closePopup();
                    }
                }
            );

            //TODO: Remove for production.
            $("#silverlightControlHost").focusin(function() {
                thisPopup.closePopup();
            });

            $(document)
                .on('touchstart mousedown', '#popup a',
                function () {
                    $(this).css({backgroundColor: "#488FCD"});
                })
                .on('touchend mouseup mouseout', '#popup a',
                function () {
                    $(this).css({backgroundColor: ""});
                })
                .on('click', '.popupContentRow',
                function () {
                    var newId = $(this).attr('id');

                    if($(this).hasClass("popupEvent")){
                        $(this).trigger("popupEvent", $(this));
                    }

                    var keepOpen = thisPopup.populate(newId);
                    if(!keepOpen) thisPopup.closePopup();
                });

            //Sets global popup object, object, with the created div.
            //TODO: Rename of remove.
            object = popupWrapperDiv;

            //TODO: Refactor.
            this.addMenu("changeBusiness", "Businesses", data.roles);
            this.initPopupScrollBar();

            //Function also returns the popup div for ease of use.
            return popupWrapperDiv;
        };

        //Closes the popup
        this.closePopup = function () {
            history = [];

            //TODO: Make close synchronous
            $("#popup").stop(false, true).fadeOut('fast');
        };

        //Public void function that populates setTitle and setContent with data found by id passed.
        this.populate = function (id) {
            var newMenu = this.getMenu(id);
            if (newMenu === null) {
                //TODO: Possibly add a boolean to pass to indicate link or end of menu action.
                console.log("ID not found.");
                return false;
            }
            history.push(newMenu);
            this.setData(newMenu);
            return true;
        };

        //Links are given the popupEvent class if no url passed. If link has popupEvent,
        // event is fired based on currentPopupAction.
        this.setData = function (data) {
            var contArray = data.contents;
            var c = "";
            var i;
            //popupContentDiv.html('');
            for (i = 0; i < contArray.length; i++) {
                var lastElement = "";
                var popupEvent = "";
                var menuId = "";
                var menuUrl = "";
                if (i === contArray.length - 1) {
                    lastElement = " last";
                }

                if (typeof(contArray[i].id) !== 'undefined') {
                    menuId = " id='" + contArray[i].id + "'";
                }

                if (typeof(contArray[i].url) !== 'undefined') {
                    menuUrl = " href='"+contArray[i].url+"'";
                }else{
                    popupEvent = " popupEvent";
                }

                c += "<a" + menuUrl + menuId + " class='popupContentRow" + popupEvent + lastElement + "'>" +
                    contArray[i].name +
                    "</a>";
            }
            this.setAction(data.id);
            this.setTitle(data.title);
            this.setContent(c);
        };

        this.getAction = function(){
            return $("#currentPopupAction").html();
        };

        this.setAction = function(id){
            $("#currentPopupAction").html(id);
        };

        //Public setter function for private var title and sets title of the html popup element.
        this.setTitle = function (t) {
            title = t;
            $("#popupTitle").html(title);
        };

        //Public setter function for private var content and sets content of the html popup element.
        this.setContent = function (cont) {
            content = cont;
            var popupContentDiv = $("#popupContentWrapper");
            //popupContentDiv.html(content);
            //TODO: This should be abstracted.
            popupContentDiv.data('jsp').getContentPane().find("#popupContent").html(content);
            popupContentDiv.data('jsp').reinitialise();
        };

        // Public getter function that returns a popup data object.
        // Returns: Popup data object if found, null if not.
        // Identifiers in object:
        //      id: Same as html id used if static
        //      title: Display text for popup header
        //      contents: Array of objects, included identifiers below
        //          name: Display text for links
        this.getMenu = function (id) {
            //Searches for a popup data object by the id passed, returns data object if found.
            var i;
            for (i = 0; i < menus.length; i += 1) {
                if (menus[i].id === id) {
                    return menus[i];
                }
            }

            //Null result returned if popup data object is not found.
            //console.log("No data found, returning null.");
            return null;
        };
    }

    return Popup;
});