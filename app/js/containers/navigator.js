"use strict";
//TODO: Fix hover state css/js aesthetics.
require.config({
    baseUrl: 'lib'
});

require(["jquery", "jquery.mousewheel", "jquery.jscrollpane.min"], function($) {
    /* Popup Constructor */
    function Popup(data) {
        var title = "";
        var content = "";
        var object = null;

        var lastNavClick = null;
        var offScreen = false;
        var carrotPos = "50%";
        var thisPopup = this;
        var currentIconTarget = null;

        var data = data;
        var history = [];

        //Static data objects, will be removed in future iterations.
        var menus = [
            {
                id: "navClient",
                title: data.name,
                contents: [
                    {"name": "Settings"},
                    {"name": "Change Business", id: "changeBusiness"},
                    {"name": "Logout"}
                ]
            }
        ];

        this.addMenu = function(id, title, contents){
            menus.push({'id': id, 'title':title, 'contents':contents});
        }

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

            //Sets popup variables referenced in resize listener.
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
            carrot.css("left", carrotPos);

            //Returns left offset of popup from window.
            return offset;
        };

        // createPopup: Appends popup to the nav
        this.createPopup = function (icon) {
            //Creates popup div that will be populated in the future.
            var popupDiv = $(document.createElement("div"));
            popupDiv.attr("id", "popup");

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
            $("#nav").append(popupDiv);

            //Click listener for popup close button.
            $("#popupClose").click(function () {
                thisPopup.hide();
            });

            $("#popupBack").click(function (e) {
                var x = history.pop();
                if(history.length<=0){
                    thisPopup.hide();
                    return;
                }
                thisPopup.setData(history[history.length-1]);
            });

            //Window resize listener to check if popup is off screen.
            $(window).on('resize', function(){
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
                var popupLen = clicked.parents("#popup").length + clicked.is("#popup")?1:0;
                var navLen = clicked.parents(".navElement").length + clicked.is(".navElement")?1:0;
                //Parent bug fixed. Was entirely the fault of the previous listener creation.
                if (popupLen === 0 && navLen === 0) {
                    thisPopup.hide();
                }
            });
            $(document).on('click', '.popupContentRow a',
                function(e){
                    //TODO: Fire event or change menu
                    var newId = $(this).parent().attr('id');
                    thisPopup.populate(newId);
                }
            );

            //Sets global popup object, object, with the created div.
            object = popupDiv;

            this.addMenu("changeBusiness", "Businesses", data.roles);

            //Function also returns the popup div for ease of use.
            return popupDiv;
        };

        this.hide = function() {
            history = [];
            $("#popup").stop(false, true).fadeOut('fast');
        };

        //Public void function that populates setTitle and setContent with data found by id passed.
        this.populate = function(id){
            var newMenu = this.getMenu(id);
            if(newMenu===null){
                //console.log("ID not found.");
                return;
            }
            history.push(newMenu);
            this.setData(newMenu);
        };

        this.setData = function(data){
            var contArray = data.contents;
            var c = "";
            var menuId = "";
            var i;
            //popupContentDiv.html('');
            for (var i=0; i<contArray.length; i++) {
                var lastElement = "";
                if (i === contArray.length - 1) { lastElement = "last"; }
                if(contArray[i].id!=undefined){menuId = "id = '"+contArray[i].id+"'";}
                c += "<div "+menuId+" class='popupContentRow " + lastElement + "'>" +
                    "<a href='#'>" +
                    contArray[i].name +
                    "</a></div>";
            }
            this.setTitle(data.title);
            this.setContent(c);
        };

        //Public setter function for private var title and sets title of the html popup element.
        this.setTitle = function(t){
            title = t;
            $("#popupTitle").html(title);
        };

        //Public setter function for private var content and sets content of the html popup element.
        this.setContent = function(cont){
            content = cont;
            var popupContentDiv = $("#popupContent");
            popupContentDiv.html(content);
        };

        // Public getter function that returns a popup data object.
        // Returns: Popup data object if found, null if not.
        // Identifiers in object:
        //      id: Same as html id used if static
        //      title: Display text for popup header
        //      contents: Array of objects, included identifiers below
        //          name: Display text for links
        this.getMenu = function(id) {
            //Searches for a popup data object by the id passed, returns data object if found.
            var i;
            for(i=0; i<menus.length; i+=1){
                if(menus[i].id===id){
                    return menus[i];
                }
            }

            //Null result returned if popup data object is not found.
            //console.log("No data found, returning null.");
            return null;
        };
    }

    function Navigator(data){
        initTopNav(data);
        initSideBar(data.sections);
        new Popup(data);
    }

    var initTopNav = function(data){
        var topNav = $(document.createElement('div'));
        topNav.attr('id', 'nav');

        var name = data.name;
        var avatarUrl = data.avatarUrl;
        var businessLogoUrl = data.businessLogoUrl;
        var navContainer = "<div id='navContainer'>"+
                "<div id='navSearch' class='navElement'><input name='search' type='text' placeholder='Search...'/><a href='#'><img class='navIcon' src='img/search.png'/></a></div>"+
                //    <!--div id='navNotif' class='navElement'>
                //        <a href='#'><img class='navIcon' src='img/notify.png'/></a>
                //    </div-->
                "<div id='navClient' class='navElement popup last'><a href='#'><img class='navIcon profile' src='"+avatarUrl+"'/><img id='clientLogo' src='"+businessLogoUrl+"'/></a></div>"+
            "</div>"+
            "<img id='logo' src='./img/Logo.png' alt='FoundOPS'/>"+
        "</div>";

        topNav.html(navContainer);
        $('body').prepend(topNav);
        $('#logo').dblclick(function(){
            window.location.href = window.location.href;
        });
    };

    var initSideBarScrollBar = function(){
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
    }

    var initSideBar = function(sections){
        //TODO: Lots of error checking.
        function toHoverImage(imgLoc, color){
            var extIndex = imgLoc.lastIndexOf('.');
            return imgLoc.substring(0, extIndex) + "Color" + imgLoc.substring(extIndex);
        }

        var sBarWrapper = $(document.createElement('div'));
        sBarWrapper.attr('id', 'sideBarWrapper');

        var sBar = $(document.createElement('div'));
        sBar.attr('id', 'sideBar');
        var expandButton = "<a href='#'>"+
                "<div id='slideMenu'><img class='iconExpand' src='img/Expand.png'/></div>"+
            "</a>";
        sBar.html(expandButton);

        sections.sort(function (a,b) {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
        });
        //Insert sections outside of complete alphabetical sort.
        sections.push({name: "Logout", url: "#logout", color: "black", iconUrl: "./img/logout.png"});
        var section;
        var sBarElement = "";
        for(section in sections){
            var currentSection = sections[section];
            var name = currentSection.name;
            var color = currentSection.color;
            var iconUrl = currentSection.iconUrl;
            //TODO: Implement sprite selection.
            var preloadHover = new Image();
            preloadHover.src = toHoverImage(iconUrl);
            var bgX = 'center';
            var bgY = 'center';

            sBarElement += "<a><div class='sideBarElement' color='"+color+"'><span class='icon' style = 'background: url(\""+iconUrl+"\") "+bgX+" "+bgY+" no-repeat'></span>"+
                "<span>" + name + "</span></div></a>";
        }
        sBar.append(sBarElement);

        sBarWrapper.append(sBar);
        $('#nav').after(sBarWrapper);

        //Add showMenuSpan to topNav.
        var showMenuSpan = $(document.createElement("div"));
        showMenuSpan.attr('id', 'showMenu');
        var showMenuSpanInner = "<a href='#'><img class='iconShow' src='img/Expand.png'/></a>";
        showMenuSpan.html(showMenuSpanInner);
        $('#navContainer').after(showMenuSpan);

        $(".sideBarElement").hover(function(){
            $(this).stop(true, true).addClass($(this).attr('color'), 100);
            var image = $(this).find(".icon:first").css('background-image').replace(/^url|[\(\)]/g, '');
            var hoverImg = toHoverImage(image);
            $(this).find(".icon").css('background-image', 'url('+hoverImg+')');
        },function(){
            $(this).stop(true, true).removeClass($(this).attr('color'), 100);
            var image = $(this).find(".icon:first").css('background-image').replace(/^url|[\(\)]/g, '');
            image = image.replace('Color.', '.');
            $(this).find(".icon").css('background-image', 'url('+image+')');
        });

        /** Initialize sidebar scrollbar **/
        initSideBarScrollBar();

        /** Sidebar event listeners **/
        var sideBarDiv = $("#sideBar");
        var sideBarWrapperDiv = $("#sideBarWrapper");
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
            if($(window).width()<=650){
                sideBarDiv.css("width", "");
                if(sideBarDiv.hasClass("expand")){
                    sideBarDiv.removeClass("expand");
                    sideBarDiv.attr("style", "");
                    $("#sideBarWrapper").attr("style", "");
                }
            }else if($(window).width()>650){
                if(sideBarDiv.hasClass("hidden")){
                    sideBarDiv.removeClass("hidden");
                    sideBarDiv.attr("style", "");
                    $("#sideBarWrapper").attr("style", "");
                    if($(".iconShow").hasClass('rotateIcon')){
                        $(".iconShow").removeClass('rotateIcon');
                    }
                }
            }
        });

        //Function toggles menu slide out.
        var slideMenu = function() {
            $(".iconExpand").toggleClass("flip");
            //TODO: Change static 159px width to be dynamic?
            if(!sideBarDiv.hasClass("expand")){
                $("#sideBar, #sideBarWrapper, .jspContainer")
                    .stop(true, false)
                    .animate({width: '159px'}, 'fast');
            } else {
                $("#sideBar, #sideBarWrapper, .jspContainer")
                    .stop(true, false)
                    .animate({width: '55px'}, 'fast');
            }
            sideBarDiv.toggleClass("expand");
        };

        //Helper function detecting if menu is able to have a hover state.
        var hoverMenu = function() {
            if($(document).width() > 650){
                sideBarDiv.toggleClass("hover");
                slideMenu();
            }
        };

        //Click listener in charge of expanding sideBar on slideMenu button click.
        $("#slideMenu").stop().click(
            function(){
                if(!sideBarDiv.hasClass("hover")){
                    slideMenu();
                }
            }
        );

        //Hover listener that expands/contracts sideBar.
        $("#sideBarWrapper").hover(
            function(){
                hoverMenu();
            }
        );

        //General function that toggles menu up, out of view.
        var toggleMenu = function() {
            $(".iconShow").toggleClass("rotateIcon");

            var offset = -1*(sideBarDiv.offset().top + sideBarDiv.outerHeight());
            if(sideBarDiv.hasClass("hidden")){
                sideBarWrapperDiv.css('display', 'inline-block');
                sideBarDiv.stop(false, true).animate(
                    {
                        top: 0
                    },
                    'fast'
                );
            } else {
                sideBarDiv.stop(false, true).animate(
                    {
                        top: offset
                    },
                    'fast',
                    function () {
                        $("#sideBarWrapper").css('display', 'none');
                    }
                );
            }
            sideBarDiv.toggleClass("hidden");
        };

        //Click listener that toggles menu visibility.
        $("#showMenu").stop(true, false).click(
            function(){
                toggleMenu();
            }
        );
    };

    /**  Config  **/
    var initData = {
        name: "Jordan Kelly",
        avatarUrl: "./img/david.png",
        businessLogoUrl: "./img/got-grease-logo.png",
        roles: [
            {name: "FoundOPS", id:"23144-24242-242442"},
            {name: "GotGrease", id:"95838-24242-242442"},
            {name: "AB Couriers", id:"64729-24242-242442"}
        ],
        sections: [
            {name: "Employees", url:"#Employees", color: "red", iconUrl: "img/employees.png"},
            {name: "Routes", url:"#Routes", color: "green", iconUrl: "./img/routes.png"},
            {name: "Regions", url:"#Regions", color: "orange", iconUrl: "./img/regions.png"},
            {name: "Vehicles", url:"#Vehicles", color: "red", iconUrl: "./img/vehicles.png"}
        ]
    };
    var navigationFrame = new Navigator(initData);
});