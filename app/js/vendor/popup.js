!function ($) {
            var popup = null;
            this.p = Popup;
            var methods = {
                init: function(options) {
                    if(typeof(options.backgroundColor) !== 'undefined'){
                        Popup.setBackgroundColor(options.backgroundColor);
                    }

                    if(typeof(options.fontColor) !== 'undefined'){
                        Popup.setFontColor(options.fontColor);
                    }

                    if(typeof(options.borderColor) !== 'undefined'){
                        Popup.setBorderColor(options.borderColor);
                    }

                    if(typeof(options.disableHeader) !== 'undefined'){
                        popup.disableHeader();
                    }

                    popup.addMenu(options.id, options.title, options.contents);
                },
                popupInit: function(options) {
                    popup = new Popup(this.selector);
                    methods.init(options);
                },
                optionsPopupInit: function (options) {
                    popup = new OptionsPopup(this.selector);

                    if(typeof(options.disableBackButton) !== 'undefined'){
                        popup.disableBackButton();
                    }

                    methods.init(options);
                },
                lockPopup: function() {
                    Popup.lockPopup();
                },
                unlockPopup: function() {
                    Popup.unlockPopup();
                },
                disableHeader: function() {
                    popup.disableHeader();
                },
                addMenu: function (menu) {
                    if (popup === null)return;
                    popup.addMenu(menu.id, menu.title, menu.contents);
                },
                closePopup: function () {
                    popup.closePopup();
                },
                test: function() {
                    console.log(Popup.title);
                    console.log(Popup.menus);
                }
            };

            $.fn.optionsPopup = function (method) {
            // Create some defaults, extending them with any options that were provided
            //var settings = $.extend({}, options);
            // Method calling logic
            if (methods[method]) {
                return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.optionsPopupInit.apply(this, arguments);
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.popup');
            }

            return this.each(function () {
            });
        };

        $.fn.popup = function (method) {
            // Create some defaults, extending them with any options that were provided
            //var settings = $.extend({}, options);
            // Method calling logic
            if (methods[method]) {
                return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.popupInit.apply(this, arguments);
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.popup');
            }

            return this.each(function () {
            });
        }

    //Static popup variables
    Popup.popupNum = 0;
    Popup.lastElementClick = null;
    Popup.currentTarget = null;
    Popup.title = "";
    Popup.content = "";
    Popup.menus = [];
    Popup.history = [];
    Popup.backgroundColor = null;
    Popup.fontColor = null;
    Popup.borderColor = null;
    Popup.padding = 3;
    Popup.offScreenX = false;
    Popup.offScreenY = false;
    Popup.isLocked = false;
    Popup.isHeaderDisabled = false;
    Popup.above = false;
    Popup.caretLeftOffset = "50%";
    /** Popup Constructor **/
    Popup.lastPopupClicked = null;
    function Popup(popupListener) {
        this.popupNumber = 0;
        var thisPopup = this;

        if ((typeof(popupListener) === 'undefined') || popupListener === null) {
            console.log("ERROR: No listener passed!");
            return;
        }
        var listenerElements = $(popupListener);

        Popup.popupNum++;
        this.popupNumber = Popup.popupNum;
        //Class added to detect clicks on primary buttons triggering popups.
        this.popupListenerID = "popupListener"+this.popupNumber;
        listenerElements.addClass(this.popupListenerID);

        listenerElements.css("cursor", "pointer");
        listenerElements.click(function (e) {
            thisPopup.toggleVisible(e, $(this));
        });

        Popup.setBackgroundColor = function(color){
            Popup.backgroundColor = color;
        };

        Popup.setFontColor = function(color){
            Popup.fontColor = color;
        };

        Popup.setBorderColor = function(color){
            Popup.borderColor = color;
        };

        Popup.lockPopup = function(){
            Popup.isLocked = true;
        };

        Popup.unlockPopup = function(){
            Popup.isLocked = false;
        };

        this.disableHeader = function() {
            $("#popupHeader").hide();

            //TODO: Move into navigator? Shouldn't rely on jscrollpane.
            $("#popup .jspPane").css("padding", "0");

            $("#popupContentWrapper").css("padding-top", "0px");

            $("#popupContent").css("border-top-right-radius", "5px")
                .css("border-top-left-radius", "5px")
                .css("border-top", "2px solid #CCC")
                .css("border-right", "2px solid #CCC")
                .css("border-left", "2px solid #CCC");
        };

        this.toggleVisible = function (e, clicked) {
            Popup.lastPopupClicked = thisPopup;
            var clickedDiv = $(clicked);
            if (clickedDiv === null) {
                console.log("ERROR: No element clicked!");
                return;
            }

            var popupWrapperDiv = $("#popupWrapper");
            if (popupWrapperDiv.length === 0) {
                //console.log("Popup not initialized; initializing.");
                popupWrapperDiv = this.createPopup();
                if (popupWrapperDiv.length === 0) {
                    console.log("ERROR: Failed to create Popup!");
                    return;
                }
            }

            //TODO: In the future, add passed id to selected div's data-* or add specific class.
            var id = clickedDiv.attr("id");
            var identifierList = clickedDiv.attr('class').split(/\s+/);

            //NOTE: identifierList contains the clicked element's id and class names. This is used to find its
            //      associated menu. The next version will have a specialized field to indicate this.
            identifierList.push(id);
            //console.log("List: "+identifierList);

            //TODO: Fix repetition.
            if ($("#popup").is(":visible") && Popup.lastElementClick !== null) {
                if (clickedDiv.is("#" + Popup.lastElementClick)) {
                    console.log("Clicked on same element!");
                    console.log("Last clicked: " + Popup.lastElementClick);
                    this.closePopup();
                    //lastElementClick = clickedDiv.attr("id");
                    return;
                }
                console.log("Clicked on different element!");
                this.closePopup();
            }

            //Blocking statement that waits until popup closing animation is complete.
            $("#popup").promise().done(function () {});

            //If popup is locked, don't continue actions.
            if(Popup.isLocked)return;

            //Update content
            this.populate(identifierList);

            clickedDiv.trigger("popupEvent", clickedDiv);

            if(Popup.backgroundColor!==null){
                $("#popupHeader").css("backgroundColor", Popup.backgroundColor);
                $("#popupContent").css("backgroundColor", Popup.backgroundColor);
            }

            if(Popup.fontColor!==null){
                $("#popup").css("color", Popup.fontColor);
                //TODO: OPTIONSPOPUP REFACTOR: Possibly push this into new optionsPopup.
                $("#popup a").css("color", Popup.fontColor);
            }

            if(Popup.borderColor!==null){
                $("#popupHeader").css("border-color", Popup.borderColor);
                $("#popupContent").css("border-color", Popup.borderColor);
                $(".popupContentRow").css("border-color", Popup.borderColor);
            }

            //Make popup visible
            $("#popup").stop(false, true).fadeIn('fast');
            $("#popupWrapper").css("visibility", "visible");
            $("#popup").promise().done(function () {});

            popupWrapperDiv.trigger("popup.visible");

            //Update left, right and caret positions for popup.
            //NOTE: Must be called after popup.visible event, in order to trigger jspScrollPane update.
            updatePositions(clickedDiv);

            Popup.lastElementClick = clickedDiv.attr("id");
        };

        //Function returns the left offset of the popup and target element.
        this.getLeft = function (target) {
            var popupWrapperDiv = $("#popupWrapper");
            Popup.currentTarget = target;
            var targetLeft = target.offset().left + target.outerWidth() / 2;
            var rightOffset = targetLeft + popupWrapperDiv.outerWidth() / 2;
            var offset = targetLeft - popupWrapperDiv.outerWidth() / 2 + Popup.padding + 1; //TODO: Figure out where the 1 extra pixel is.. could just be rounding.
            var windowWidth = $(window).width();

            Popup.offScreenX = false;
            if (offset < 0) {
                Popup.offScreenX = true;
                offset = Popup.padding;
            } else if (rightOffset > windowWidth) {
                Popup.offScreenX = true;
                offset = windowWidth - popupWrapperDiv.outerWidth();
            }

            //Returns left offset of popup from window.
            return {targetLeft: targetLeft, popupLeft: offset};
        };

        this.getTop = function(target){
            var caretHeight =  $("#popupArrow").height();
            var targetTop = target.offset().top;
            var targetBottom = targetTop + target.outerHeight() - $(window).scrollTop();
            var popupTop = targetBottom + caretHeight;
            var windowHeight = $(window).height();
            var popupContentHeight = $("#popupContent").height();
            var popupHeight = popupContentHeight + $("#popupHeader").outerHeight() + caretHeight;

            Popup.above = false;
            Popup.offScreenY = false;

            if (windowHeight < targetBottom + popupHeight) {
                Popup.offScreenY = true;
                if(targetTop >= popupHeight){
                    popupTop = targetTop - popupHeight;
                    Popup.above = true;
                    //console.log("Case 2");
                }else{
                    popupTop = windowHeight - popupHeight;
                    //console.log("Case 3");
                }
            } else if (popupTop < 0) {
                //console.log("Case 4");
                Popup.offScreenY = true;
                popupTop = Popup.padding + caretHeight;
            }else{
                //console.log("Case 1");
            }

            /*
            //Debug logs
            console.log("------------------------------------------------------------");
            console.log("Caret Height: " + caretHeight);
            console.log("TargetTop: " + targetTop);
            console.log("Popup Cont Height: " + popupContentHeight);
            console.log("Cont Height: " + $("#popupContent").height());
            console.log("Header Height: " + $("#popupHeader").outerHeight());
            console.log("targetBottom: " + targetBottom);
            console.log("popupHeight: " + popupHeight);
            console.log("popupBottom: " + (targetBottom + popupHeight));
            console.log("Popup Height: " + $("#popup").height());
            console.log("PopupWrapper Height: " + $("#popupWrapper").height());
            console.log("PopupWrapper2 Height: " + $("#popupWrapper").height(true));
            console.log("popupTop: " + popupTop);
            console.log("windowHeight: " + windowHeight);
            console.log("offScreenY: " + Popup.offScreenY);
            console.log("Popup.above: " + Popup.above);
            console.log("\n");
            */

            return popupTop;
        };

        this.setCaretPosition = function(offset){
            var caretPos = "50%";
            var caret = $("#popupArrow");
            if (Popup.offScreenX) {
                caretPos = offset;
            }
            //Moves carrot on popup div.
            caret.css("left", caretPos);

            if(Popup.above){
                var popupHeight = $("#popupHeader").outerHeight() + $("#popupContent").outerHeight() - 2;
                $("#popupArrow").css("margin-top", popupHeight+"px");
                $("#popupArrow").addClass("flipArrow");
            }else{
                $("#popupArrow").css("margin-top", "");
                $("#popupArrow").removeClass("flipArrow");
            }
            Popup.caretLeftOffset = caretPos;
        };

        this.updateLeftPosition = function(target){
            var offset = thisPopup.getLeft(target);
            $("#popupWrapper").css("left", offset.popupLeft);
            this.setCaretPosition(offset.targetLeft - offset.popupLeft + Popup.padding);
        };

        var updatePositions = function(target){
            thisPopup.updateLeftPosition(target);
            var top = thisPopup.getTop(target);
            $("#popupWrapper").css("padding-top", top + "px");
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
                "<div id='popupTitle'></div>" +
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
                //$("#popupWrapper").css("visibility", "hidden");
            });

            //Window resize listener to check if popup is off screen.
            $(window).on('resize', function () {
                    if ($("#popup").is(":visible")) {
                        updatePositions(Popup.currentTarget);
                    }
                }
            );

            //Click listener to detect clicks outside of popup
            $('html')
                .on('click touchend', function (e) {
                    var clicked = $(e.target);
                    //TODO: Return if not visible.
                    var popupHeaderLen = clicked.parents("#popupHeader").length + clicked.is("#popupHeader") ? 1 : 0;
                    //TODO: Find better listener for this.
                    var popupContentLen = (clicked.parents("#popupContentWrapper").length && !clicked.parent().is("#popupContentWrapper")) ? 1 : 0;
                    //console.log("popupListenerID: "+Popup.lastPopupClicked.popupListenerID);
                    var isListener = clicked.parents("."+Popup.lastPopupClicked.popupListenerID).length + clicked.is("."+Popup.lastPopupClicked.popupListenerID) ? 1 : 0;
                    //console.log("isListener: "+isListener);
                    if (popupHeaderLen === 0 && popupContentLen === 0 && isListener === 0) {
                        thisPopup.closePopup();
                    }
                }
            );

            var popupContentWrapperDiv = $("#popupContentWrapper");
            var throttleTimeout;
            $(window).bind('resize', function () {
                if ($.browser.msie) {
                    if (!throttleTimeout) {
                        throttleTimeout = setTimeout(function () {
                                popupContentWrapperDiv.trigger("popup.resize");
                                throttleTimeout = null;
                            }, 50
                        );
                    }
                } else {
                    popupContentWrapperDiv.trigger("popup.resize");
                }
            });

            //TODO: Is this the safest way?
            popupContentWrapperDiv.trigger("popup.created");

            //Function also returns the popup div for ease of use.
            return popupWrapperDiv;
        };

        //Closes the popup
        this.closePopup = function () {
            if(Popup.isLocked)return;
            Popup.lastElementClick = null;

            $(document).trigger("popup.closing");
            Popup.history = [];
            $("#popup").stop(false, true).fadeOut('fast');
            $("#popupWrapper").css("visibility", "hidden");
        };

        this.getAction = function () {
            return $("#currentPopupAction").html();
        };

        this.setAction = function (id) {
            $("#currentPopupAction").html(id);
        };

        this.previousPopup = function(){
            Popup.history.pop();
            if (Popup.history.length <= 0) {
                thisPopup.closePopup();
                return;
            }
            this.setData(Popup.history[Popup.history.length - 1]);
        };

        //Public setter function for private var title and sets title of the html popup element.
        this.setTitle = function (t) {
            Popup.title = t;
            $("#popupTitle").html(t);
        };

        //Public setter function for private var content and sets content of the html popup element.
        this.setContent = function (cont) {
            Popup.content = cont;
            //popupContentDiv.data('jsp').getContentPane().find("#popupContent").html(content);
            //TODO: Is setting the content w/o using the jScrollPane api safe to do?
            $("#popupContent").html(cont);
            //TODO: Change event namespace.
            $("#popupContentWrapper").trigger("popup.setContent", $(this));
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
            for (i = 0; i < Popup.menus.length; i += 1) {
                if (Popup.menus[i].id === id) {
                    return Popup.menus[i];
                }
            }

            //Null result returned if popup data object is not found.
            //console.log("No data found, returning null.");
            return null;
        };

        this.addMenu = function (id, title, contents) {
            Popup.menus.push({'id': id, 'title': title, 'contents': contents});
        };

        //Public void function that populates setTitle and setContent with data found by id passed.
        this.populate = function (identifierList) {

            var newMenu = null;
            var i=0;
            for(i; i<identifierList.length; i++){
                newMenu = this.getMenu(identifierList[i]);
                if(newMenu!==null){
                    //console.log("Found menu! id: "+identifierList[i]);
                    break;
                }
            }

            if (newMenu === null) {
                console.log("ID not found.");
                return false;
            }
            $(document).trigger('popup.populating');
            Popup.history.push(newMenu);
            this.clearData();
            this.setData(newMenu);
            return true;
        };

        this.clearData = function (){
            $("#popupTitle").html("");
            $("#popupContent").html("");
        };

        this.setData = function (data) {
            this.setAction(data.id);
            this.setTitle(data.title);
            this.setContent(data.contents);
        }
    }

    function OptionsPopup(popupListener){
        Popup.apply(this, [popupListener]);
        //this.prototype = new Popup(popupListener);
        //Popup.call(this, popupListener);
        var thisOptionsPopup = this;

        var isBackEnabled = true;

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
                var newId = [];
                newId.push($(this).attr('id'));

                //TODO: Prefix all events triggered
                if ($(this).hasClass("popupEvent")) {
                    $(this).trigger("popupEvent", $(this));
                }

                var keepOpen = thisOptionsPopup.populate(newId);
                if (!keepOpen) thisOptionsPopup.closePopup();
            })
            .on('popup.created', function(){
                createBackButton();
            })
        ;

        var createBackButton = function(){
            //Don't create back button or listener if disabled.
            if(!isBackEnabled)return;
            //console.log("Creating back button.");
            $("#popupHeader").prepend("<a id='popupBack'></a>");
            $("#popupBack").click(function () {
                thisOptionsPopup.previousPopup();
            });
        };

        this.disableBackButton = function(){
            isBackEnabled = false;
        };

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

                //Links are given the popupEvent class if no url passed. If link has popupEvent,
                // event is fired based on currentPopupAction.
                if (typeof(contArray[i].id) !== 'undefined') {
                    menuId = " id='" + contArray[i].id + "'";
                }

                if (typeof(contArray[i].url) !== 'undefined') {
                    menuUrl = " href='" + contArray[i].url + "'";
                } else {
                    popupEvent = " popupEvent";
                }

                c += "<a" + menuUrl + menuId + " class='popupContentRow" + popupEvent + lastElement + "'>" +
                    contArray[i].name +
                    "</a>";
            }

            //TODO: Possibly move this into populate and call during back listener.
            var oldPopupTop = $("#popup").offset().top;
            //console.log("Old top: "+oldPopupTop);
            var oldPopupHeight = $("#popupArrow").height() + $("#popupContent").height() + $("#popupHeader").height();

            this.setAction(data.id);
            this.setTitle(data.title);
            this.setContent(c);

            if(Popup.above){
                var newPopupHeight = $("#popupArrow").height() + $("#popupContent").height() + $("#popupHeader").height();
                var popupTop = oldPopupTop - (newPopupHeight - oldPopupHeight);
                //console.log("New top: "+popupTop);
                $("#popupWrapper").css("padding-top", popupTop + "px");
                this.setCaretPosition(Popup.caretLeftOffset);
            }
        };
    }
}(window.jQuery);
