"use strict";
/*
require.config({
    baseUrl: 'lib'
});

require(["jquery", "jquery.mousewheel", "jquery.jscrollpane.min"], function($) {
*/
var data = null;
var thisNav = this;
    function Navigator(iData){
        data = iData;
        initTopNav();
        initSideBar(iData.sections);
        afterInit();
    }

//    <!--div id='navNotif' class='navElement'>
//        <a href='#'><img class='navIcon' src='img/notify.png'/></a>
//    </div-->


var initTopNav = function(){
        var topNav = $(document.createElement('div'));
        topNav.attr('id', 'nav');

        var navContainer = "<div id='navContainer'>"+
                "<div id='navSearch' class='navElement'><input name='search' type='text' placeholder='Search...'/><a href='#'><img class='navIcon' src='img/search.png'/></a></div>"+
                "<div id='navClient' class='navElement popup last'><a href='#'><img class='navIcon profile' src='img/david.png'/><img id='clientLogo' src='img/got-grease-logo.png'/></a></div>"+
            "</div>"+

            //TODO: Should technically be added in with initSideBar.
            "<span id='showMenu'><a href='#'><img class='iconShow' src='img/Expand.png'/></a></span>"+

            "<img id='logo' src='./img/Logo.png' alt='FoundOPS'/>"+
        "</div>";

        topNav.html(navContainer);
        $('body').prepend(topNav);
        $('#logo').dblclick(function(){
            window.location.href=window.location.href;
        });
    };

    var initSideBar = function(sections){
        //TODO: Lots of error checking.
        var sBarWrapper = $(document.createElement('div'));
        sBarWrapper.attr('id', 'sideBarWrapper');

        var sBar = $(document.createElement('div'));
        sBar.attr('id', 'sideBar');
        var expandButton = "<a href='#'>"+
                "<div id='slideMenu'><img class='iconExpand' src='img/Expand.png'/></div>"+
            "</a>";
        sBar.html(expandButton);

        function compareName(a,b) {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
        }

        sections.sort(compareName);
        sections.push({name: "Logout", url: "#logout", color: "black", iconUrl: "./img/logout.png"});
        var section;
        //var sBarElement = "";
        for(section in sections){
            var currentSection = sections[section];
            var name = currentSection.name;
            var color = currentSection.color;
            var iconUrl = currentSection.iconUrl;
            //TODO: Implement sprite selection.

            var bgX = 'center';
            var bgY = 'center';

            var anchorElement = $(document.createElement('a'));
            var hoverElement = $(document.createElement('div'));
            hoverElement.addClass('sideBarElement');
            var sBarElement = "<span class='icon' style = 'background: url(\""+iconUrl+"\") "+bgX+" "+bgY+" no-repeat'></span>"+
                "<span>" + name + "</span>";
            hoverElement.html(sBarElement);

            hoverElement.attr("color", color);

            anchorElement.append(hoverElement);

            sBar.append(anchorElement);
        }

        sBarWrapper.append(sBar);
        $('#nav').after(sBarWrapper);

        var originalImage = null;
        $(".sideBarElement").hover(function(){
            $(this).stop(true, true).addClass($(this).attr('color'), 100);
            var image = $(this).find(".icon:first").css('background-image').replace(/^url|[\(\)]/g, '');
            var extIndex = image.lastIndexOf('.');
            image = image.substring(0, extIndex) + "Color" + image.substring(extIndex);
            //console.log(image);
            $(this).find(".icon").css('background-image', 'url('+image+')');
        },function(){
            $(this).stop(true, true).removeClass($(this).attr('color'), 100);

                var image = $(this).find(".icon:first").css('background-image').replace(/^url|[\(\)]/g, '');
                image = image.replace('Color.', '.');

            $(this).find(".icon").css('background-image', 'url('+image+')');
        }
        );


    };

    var afterInit = function(){
        var sideBar = $("#sideBar");
        var sideBarDiv = $("#sideBar");
        var sideBarWrapperDiv = $("#sideBarWrapper");
        sideBarWrapperDiv.jScrollPane({
            horizontalGutter:0,
            verticalGutter:0,
            verticalDragMinHeight: 25,
            'showArrows': false
        });

        var sideBarScrollBar = sideBarWrapperDiv.data('jsp');
        //From jScrollPane examples: http://jscrollpane.kelvinluck.com/dynamic_height.html
        var throttleTimeout;
        $(window).bind('resize', function(){
                if ($.browser.msie) {
                    if (!throttleTimeout) {
                        throttleTimeout = setTimeout(
                            function(){
                                sideBarScrollBar.reinitialise();
                                throttleTimeout = null;
                            },50
                        );
                    }
                } else {
                    sideBarScrollBar.reinitialise();
                }
            }
        );

        /* Popup Constructor */
        function Popup() {
            var title = "";
            var content = "";
            var object = null;

            var lastNavClick = null;
            var offScreen = false;
            var carrotPos = "50%";
            var thisPopup = this;
            var currentIconTarget = null;

            this.history = [];
            $(".navElement").filter(".popup").click(function (e) {
                console.log("Parent: " + $(this));
                //if(this.hasClass("popup")){
                    thisPopup.toggleVisible(e, $(this));
                //}
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
                //console.log("Popup: " + $popup.text());

                if (popupDiv.length === 0) {
                    //console.log("Popup not initialized");
                    popupDiv = this.createPopup(icon);
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
                        this.hide();
                        lastNavClick = navElem.attr("id");
                        return;
                    }
                    //console.log("Clicked on different nav button!");
                    var thisPopup = this;
                    this.hide();
                    popupDiv.promise("fx").done(function () {
                        left = thisPopup.getLeft(icon, popupDiv);
                        thisPopup.populate(id);
                        popupDiv.css("left", left);
                        popupDiv.stop(false, true).fadeIn('fast');
                    });
                    lastNavClick = navElem.attr("id");
                    return;
                }

                left = this.getLeft(icon, popupDiv);
                popupDiv.css("left", left);
                popupDiv.css("top", $("nav").height());
                //console.log($(el).text());
                lastNavClick = navElem.attr("id");
                //console.log("current click: " + lastNavClick);
                this.populate(id);
                popupDiv.stop(false, true).fadeIn();
            };

            //Function returns the left offset of the popup and sets the carrot element's position.
            this.getLeft = function(iconTarget, popupDiv){
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

                //TODO: Create resize listener in popup constructor.
                //Sets global popup variables referenced in resize listener.
                offScreen = false;
                carrotPos = "50%";

                var carrot = $("#popupArrow");
                if((offset < 0) || (rightOffset > windowWidth)) {
                    //console.log("Offscreen popup.");
                    offset = (windowWidth - popupDiv.width()) / 2;
                    offScreen = true;

                    carrotPos = (x - offset);
                    //console.log("x: " + x);
                    //console.log("Carrot width: " + carrot.width());
                    //console.log("Popup offset: " + popupDiv.offset().left);
                    //console.log("Carrot position: " + carrotPos);
                }

                //Moves carrot on popup div.
                //console.log("Setting carrot pos.");
                carrot.css("left", carrotPos);

                //Returns left offset of popup from window.
                return offset;
            };

            // createPopup: Appends popup to the nav
            this.createPopup = function (icon) {
                //console.log("Creating popup.");

                //Creates popup div that will be populated in the future.
                var popupDiv = $(document.createElement("div"));
                popupDiv.attr("id", "popup");

                /*TODO: Change to document fragment? Might make action listener simpler/faster */
                var s = "<div id='popupArrow'></div>" +
                    "<div id='popupHeader'>" +
                    "<a href='#'><div id='popupBack'></div></a>" +
                    "<span id='popupTitle'></span>" +
                    "<a href='#'><div id='popupClose'></div></a>" +
                    "</div>" +
                    "<div id='popupContent'></div>" +
                    "</div>";
                popupDiv.html(s);
                popupDiv.css("display", "none");

                //Appends created div to page.
                //console.log("Appending: " + popupDiv);
                $("#nav").append(popupDiv);

                //Click listener for popup close button.
                $("#popupClose").click(function () {
                    //console.log("Close button clicked.");
                    //TODO: IMPLEMENT HIDE METHOD
                    thisPopup.history = [];
                    popupDiv.stop().fadeOut('fast');
                });

                $("#popupBack").click(function (e) {
                    //console.log("Back button clicked.");
                    //console.log(thisPopup.history.length);
                    var x = thisPopup.history.pop();
                    if(thisPopup.history.length<=0){
                        thisPopup.history = [];
                        popupDiv.stop().fadeOut('fast');
                        return;
                    }
                    //console.log(thisPopup.history.length);
                    //console.log("Popped: " + x.id);
                    thisPopup.setData(thisPopup.history[thisPopup.history.length-1]);

                });

                //Window resize listener to check if popup is off screen.
                $(window).on(
                    'resize',
                    function()
                    {
                        //console.log("Resize!");
                        var popupDiv = $("#popup");
                        if(popupDiv.is(":visible")){
                            var left = thisPopup.getLeft(currentIconTarget, popupDiv);
                            popupDiv.css("left", left);
                        }
                    }
                );

                //Click listener to detect clicks outside of popup
                $('html').on('click', function (e) {
                    var clicked = $(e.target);
                    //console.log("Clicked on: " + clicked.get(0).tagName+" "+clicked.attr('id'));
                    var popupLen = clicked.parents("#popup").length + clicked.is("#popup")?1:0;
                    var navLen = clicked.parents(".navElement").length + clicked.is(".navElement")?1:0;
                    var popupContentRow = clicked.parents(".popupContentRow").length;
                    //console.log(clicked.parents().length);
                    //console.log(clicked.parents()[0].outerHTML);
                    //TODO: Fix this jquery event bug.......
                    //console.log("pLen: " + popupLen + " navLen: "+navLen+" cLen: "+popupContentRow);
                    if (popupLen === 0 && navLen === 0 && popupContentRow === 0) {
                        //console.log("clicked outside: "+clicked.parents()[0].outerHTML);
                        thisPopup.hide();
                    }
                });
                $(document).on('click', '.popupContentRow a',
                    function(e){
                        //console.log($(e.target).parents().length);
                        //console.log($(e.target).parents()[0].outerHTML);

                        thisPopup.populate(this.innerHTML);
                    }
                );

                //Sets global popup object, object, with the created div.
                object = popupDiv;

                //Function also returns the popup div for ease of use.
                //console.log("Before createPopup return.");
                return popupDiv;
            };

            this.hide = function() {
                thisPopup.history = [];
                $("#popup").stop(false, true).fadeOut('fast');
            };

            //TODO: Error checking if id not found.
            //Public void function that populates setTitle and setContent with data found by id passed.
            this.populate = function(id){
                //console.log("Populating data.");
                var popupData = this.getData(id);
                if(popupData===null){
                    //console.log("ID not found.");
                    return;
                }
                this.history.push(popupData);
                //TODO: Parent bug still present; fix sometime.
                this.setData(popupData);
            };

            this.setData = function(data){
                var contArray = data.contents;
                //console.log("Content Array: " + contArray);
                //console.log("Length: " + c.length);

                //Push data to array. 4 Hide method calls.
                var popupContentDiv = $("#popupContent");
                var c = "";
                var i;

                popupContentDiv.html('');
                for (i=0; i< contArray.length; i+=1) {
                    //console.log("In loop.");
                    var lastElement = "";
                    if (i === contArray.length - 1) { lastElement = "last"; }
                    c = "<div class='popupContentRow " + lastElement + "'>" +
                        "<a href='#'>" +
                        contArray[i].name +
                        "</a></div>";
                    popupContentDiv.append(c);
                }

                //console.log("Setting title: " + title);
                //console.log("Setting content: " + c);
                this.setTitle(data.title);
                //this.setContent(c);

            };

            //Public setter function for private var title and sets title of the html popup element.
            this.setTitle = function(t){
                title = t;
                //console.log("Setting title: " + title);
                $("#popupTitle").html(title);
            };

            //Public setter function for private var content and sets content of the html popup element.
            this.setContent = function(cont){
                content = cont;
                //console.log("Setting content: " + content);
                $("#popupContent").html(content);
            };

            // Public getter function that returns a popup data object.
            // Returns: Popup data object if found, null if not.
            // Identifiers in object:
            //      id: Same as html id used if static
            //      title: Display text for popup header
            //      contents: Array of objects, included identifiers below
            //          name: Display text for links
            this.getData = function(id) {
                //console.log("Getting data.");

                //TODO: Implement dynamic data retrieval
                //Static data objects, will be removed in future iterations.
                var data = [
                    {
                        id: "navClient",
                        title: "User Name",
                        contents: [
                            {"name": "Settings"},
                            {"name": "Change Business"},
                            {"name": "Logout"}
                        ]
                    },
                    {
                        id: "navNotif",
                        title: "Businesses",
                        contents: [
                            {"name": "FoundOPS"},
                            {"name": "Got Grease"},
                            {"name": "AB Couriers"}
                        ]
                    },
                    {
                        id: "navSearch",
                        title: "Search",
                        contents: [
                            {"name": "I'm Feeling Lucky"},
                            {"name": "Advanced"}
                        ]
                    },
                    {
                        id: "Change Business",
                        title: "Businesses",
                        contents: [
                            {name: "FoundOPS"},
                            {name: "Got Grease"},
                            {name: "AB Couriers"}
                        ]
                    },
                    {
                        id: "FoundOPS",
                        title: "FoundOPS",
                        contents: [
                            {name: "Test 1"},
                            {name: "Test 2"},
                            {name: "Test 3"}
                        ]
                    }
                ];

                //Searches for a popup data object by the id passed, returns data object if found.
                var i;
                for(i=0; i<data.length; i+=1){
                    if(data[i].id===id){
                        //console.log("Data found.");
                        //console.log("DATA: " + data[i].id);
                        return data[i];
                    }
                }

                //Null result returned if popup data object is not found.
                //console.log("No data found, returning null.");
                return null;
            };
        }

        /*********************
         ** Event Listeners **
         *********************/
        //Initializes popup and sets listeners.
        var popup = new Popup();

        //Listens for clicks outside of elements
        $('body').on('click', function (e) {
            var clicked = $(e.target);
            //console.log("Clicked on: " + $clicked.html());
            var sideBarLen = clicked.parents("#sideBar").length;
            var showMenuLen = clicked.parents("#showMenu").length;

            //Detects clicks outside of the sideBar when shown.
            if ((!clicked.is("#sideBar")) && sideBarLen === 0 && showMenuLen === 0
                && $("#sideBar").offset().top > 0
                && $(document).width()<=650) {
                    toggleMenu();
            }

            //Detects clicks outside of the sideBar when expanded.
            var slideMenuLen = clicked.parents("#slideMenu").length;
            if ((!clicked.is("#sideBar")) && sideBarLen === 0 && slideMenuLen === 0
                && $("#sideBar").hasClass("expand")
                && $(document).width()>650) {
                slideMenu();
            }
        });

        //Listener for window resize to reset sideBar styles.
        $(window).resize(function() {
            //console.log("Browser resize event.");
            if($(window).width()<=650){
                sideBarDiv.css("width", "");
                if(sideBarDiv.hasClass("expand")){
                    sideBarDiv.removeClass("expand");
                    sideBarDiv.attr("style", "");
                    $("#sideBarWrapper").attr("style", "");

                    //console.log("Removed class: expand");
                    //console.log("Removed style.");
                }
            }else if($(window).width()>650){
                if(sideBarDiv.hasClass("hidden")){
                    sideBarDiv.removeClass("hidden");
                    sideBarDiv.attr("style", "");
                    $("#sideBarWrapper").attr("style", "");
                    if($(".iconShow").hasClass('rotateIcon')){
                        $(".iconShow").removeClass('rotateIcon');
                    }
                    //console.log("Removed class: hidden");
                    //console.log("Removed style.");
                }
            }
        });

        //Function toggles menu slide out.
        var slideMenu = function() {
            $(".iconExpand").toggleClass("flip");

            //console.log("Classes: " + $("#sideBar").attr("class"));
            //TODO: Change static 159px width to be dynamic.
            if(!sideBar.hasClass("expand")){
                $("#sideBar, #sideBarWrapper, .jspContainer")
                    .stop(true, false)
                    .animate(
                        {
                            width: '159px'
                        },
                        'fast',
                        function () {
                            //console.log("Animate completed.");
                        }
                    );
            } else {
                $("#sideBar, #sideBarWrapper, .jspContainer")
                    .stop(true, false)
                    .animate(
                        {
                            width: '55px'
                        },
                        'fast',
                        function () {
                            //console.log("Animate completed.");
                        }
                    );
            }
            sideBar.toggleClass("expand");
        };

        //Click listener in charge of expanding sideBar on slideMenu button click.
        $("#slideMenu").stop().click(
            function () {
                if(!sideBar.hasClass("hover")){
                    slideMenu();
                }
            }
        );

        //Hover listener that expands/contracts sideBar.
        $(".jspContainer, .jspVerticalBar").hover(
            function(){
                //console.log("Hovering!");
                hoverMenu();
            }
        );

        //Helper function detecting if menu is able to have a hover state.
        var hoverMenu = function() {
            if($(document).width()>650){
                sideBar.toggleClass("hover");
                slideMenu();
            }
        };

        //General function that toggles menu up, out of view.
        var toggleMenu = function() {
            //console.log("Toggle hidden.");
            $(".iconShow").toggleClass("rotateIcon");

            var offset = -1*(sideBar.offset().top + sideBar.outerHeight());
            if(sideBar.hasClass("hidden")){
                $("#sideBarWrapper").css('display', 'inline-block');
                sideBar.stop(false, true).animate(
                    {
                        top: 0
                    },
                    'fast',
                    function () {
                        //console.log("Animate completed. navHeight: "+navHeight);

                    }
                );

            } else {
                sideBar.stop(false, true).animate(
                    {
                        top: offset
                    },
                    'fast',
                    function () {
                        $("#sideBarWrapper").css('display', 'none');
                        //$("#sideBarWrapper").css("overflow", "hidden");
                    }
                );
            }

            sideBar.toggleClass("hidden");
            //console.log("Classes: " + $("#sideBar").attr("class"));
        };

        //Click listener that toggles menu visibility.
        $("#showMenu").stop(true, false).click(
            function () {
                toggleMenu();
            }
        );
    };
        /*************************
         ** End Event Listeners **
         *************************/
    //});