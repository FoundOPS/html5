define(["lib/jquery.mousewheel", "lib/jquery.jScrollPane"], function () {
    /** Popup Constructor **/
    function Popup(data) {
        var title = "";
        var content = "";
        var object = null;

        var lastNavClick = null;
        var offScreen = false;
        var carrotPos = "50%";
        var thisPopup = this;
        var currentIconTarget = null;

        var history = [];

        //Static data objects, could be removed in future iterations.
        var menus = [
            {
                id: "navClient",
                title: data.name,
                contents: [
                    {"name": "Settings", url: data.settingsUrl}, {"name": "Settings", url: data.settingsUrl}, {"name": "Settings", url: data.settingsUrl}, {"name": "Settings", url: data.settingsUrl}, {"name": "Settings", url: data.settingsUrl}, {"name": "Settings", url: data.settingsUrl},
                    {"name": "Change Business", id: "changeBusiness"},
                    {"name": "Logout", url: data.logoutUrl}
                ]
            }
        ];

        this.addMenu = function (id, title, contents) {
            menus.push({'id': id, 'title': title, 'contents': contents});
        };

        //TODO: Maybe change to global listener. Currently has to be called after .navElement creation.
        $(".navElement").filter(".popup").click(function (e) {
            thisPopup.toggleVisible(e, $(this));
        });

        /*TODO: Break toggleVisible into generic functions (eg. Should not expect el=navElement)*/
        this.toggleVisible = function (e, el) {
            var icon = $(el).find("img.navIcon").first();
            if (icon === null) {
                //console.log("ERROR: Cannot locate nav icon in element!");
                return;
            }
            //console.log("Found navIcon in element.");
            //console.log("Looking for existing popup...");

            var popupDiv = $("#popup");

            if (popupDiv.length === 0) {
                //console.log("Popup not initialized");
                popupDiv = this.createPopup();
            }
            if (popupDiv.length === 0) {
                /*console.log("ERROR: FAILED TO CREATE POPUP!!!");*/
                return;
            }

            var navElem = $(el).closest(".navElement");
            var left = "50%";
            var id = navElem.attr("id");
            //TODO: Fix repetition.
            if (popupDiv.is(":visible") && lastNavClick !== null) {
                if (navElem.is("#" + lastNavClick)) {
                    //console.log("Clicked on same nav button!");
                    this.closePopup();
                    lastNavClick = navElem.attr("id");
                    return;
                }
                //console.log("Clicked on different nav button!");
                var thisPopup = this;
                this.closePopup();
                //TODO: Make sure this doesn't cause animation problems.
                /*popupDiv.promise("fx").done(function () {
                 left = thisPopup.getLeft(icon, popupDiv);
                 popupDiv.css("left", left);
                 thisPopup.populate(id);
                 popupDiv.stop(false, true).fadeIn('fast');
                 });
                 lastNavClick = navElem.attr("id");
                 return;*/
            }
            left = this.getLeft(icon, popupDiv);
            popupDiv.css("left", left);
            popupDiv.css("top", $("nav").height());
            this.populate(id);

            //console.log(el);
            $(el).trigger("popupEvent", $(el));

            popupDiv.stop(false, true).fadeIn('fast');
            $("#popupContentWrapper").data('jsp').reinitialise();
            lastNavClick = navElem.attr("id");
        };

        //Function returns the left offset of the popup and sets the carrot element's position.
        this.getLeft = function (iconTarget, popupDiv) {
            currentIconTarget = iconTarget;
            //console.log("IconTarget Offset: " + iconTarget.offset().left);
            //console.log("IconTarget Width: " + iconTarget.width());
            var x = iconTarget.offset().left + iconTarget.width() / 2;
            //console.log("x: " + x);
            //TODO: Should this be outerWidth()?
            var rightOffset = x + popupDiv.width() / 2 + 4;
            var offset = x - popupDiv.width() / 2;
            var windowWidth = $(window).width();
            //console.log("Window width: " + windowWidth);
            //console.log("Right popup offset: " + rightOffset);

            //Sets popup variables referenced in resize listener.
            offScreen = false;
            carrotPos = "50%";
            var padding = 4;
            if (offset < 0) {
                offScreen = true;
                offset = padding;
            } else if (rightOffset > windowWidth) {
                offScreen = true;
                offset = windowWidth - popupDiv.width() - padding;
            }

            var carrot = $("#popupArrow");
            if (offScreen) {
                //console.log("Offscreen popup.");

                carrotPos = (x - offset);
                //console.log("x: " + x);
                //console.log("Carrot width: " + carrot.width());
                //console.log("Popup offset: " + popupDiv.offset().left);
                //console.log("Carrot position: " + carrotPos);
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
            $(window).bind(
                'resize',
                function()
                {
                    if ($.browser.msie) {
                        // IE fires multiple resize events while you are dragging the browser window which
                        // causes it to crash if you try to update the scrollpane on every one. So we need
                        // to throttle it to fire a maximum of once every 50 milliseconds...
                        if (!throttleTimeout) {
                            throttleTimeout = setTimeout(
                                function()
                                {
                                    api.reinitialise();
                                    throttleTimeout = null;
                                },
                                50
                            );
                        }
                    } else {
                        api.reinitialise();
                    }
                }
            );
            //popupContentDiv.data('jsp').reinitialise();
        };


        // createPopup: Appends popup to the nav
        this.createPopup = function () {
            //Creates popup div that will be populated in the future.
            var popupDiv = $(document.createElement("div"));
            popupDiv.attr("id", "popupWrapper");

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
            popupDiv.html(s);
            popupDiv.css("display", "none");

            //Appends created div to page.
            popupDiv.insertAfter("#nav");

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
                    var popupDiv = $("#popup");
                    if (popupDiv.is(":visible")) {
                        var left = thisPopup.getLeft(currentIconTarget, popupDiv);
                        popupDiv.css("left", left);
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
            $("#silverlightControlHost").focusin(function(e) {
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
                        //console.log(thisPopup.getAction());
                    }

                    var keepOpen = thisPopup.populate(newId);

                    if(!keepOpen)
                        thisPopup.closePopup();
                });

            //Sets global popup object, object, with the created div.
            object = popupDiv;

            //TODO: Refactor.
            this.addMenu("changeBusiness", "Businesses", data.roles);
            this.initPopupScrollBar();

            //Function also returns the popup div for ease of use.
            return popupDiv;
        };

        //Closes the popup
        this.closePopup = function () {
            history = [];
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