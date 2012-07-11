"use strict";

define(["jquery", "lib/jquery.mousewheel", "lib/jquery.jScrollPane", "lib/kendo.all.min"], function ($) {
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
                    {"name": "Settings", url: data.settingsUrl},
                    {"name": "Change Business", id: "changeBusiness"},
                    {"name": "Logout", url: data.logoutUrl}
                ]
            }
        ];

        this.addMenu = function (id, title, contents) {
            menus.push({'id': id, 'title': title, 'contents': contents});
        };

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
                //initPopupScrollBar();
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
                    this.hidePopup();
                    lastNavClick = navElem.attr("id");
                    return;
                }
                //console.log("Clicked on different nav button!");
                var thisPopup = this;
                this.hidePopup();
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

        /** Initializes scrollbar for sidebar navigation **/
        var initPopupScrollBar = function () {
            var popupContentDiv = $("#popupContent");
            popupContentDiv.jScrollPane({
                horizontalGutter: 0,
                verticalGutter: 0,
                'showArrows': false
            });
            popupContentDiv.data('jsp').reinitialise();
        };


        // createPopup: Appends popup to the nav
        this.createPopup = function () {
            //Creates popup div that will be populated in the future.
            var popupDiv = $(document.createElement("div"));
            popupDiv.attr("id", "popupWrapper");

            var s = "<div id='popup'>" +
                "<div id='currentPopupAction' style='display: none;'></div>" +
                "<div id='popupArrow'></div>" +
                "<div id='popupHeader'>" +
                    "<a id='popupBack'></a>" +
                    "<span id='popupTitle'></span>" +
                    "<a id='popupClose'></a>" +
                    "</div>" +
                    "<div id='popupContent'></div>" +
                "</div></div>";
            popupDiv.html(s);
            popupDiv.css("display", "none");

            //Appends created div to page.
            popupDiv.insertAfter("#nav");

            //Click listener for popup close button.
            $("#popupClose").click(function () {
                thisPopup.hidePopup();
            });

            $("#popupBack").click(function () {
                history.pop();
                if (history.length <= 0) {
                    thisPopup.hidePopup();
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
            $('html').on('click touchend', function (e) {
                var clicked = $(e.target);
                //TODO: Return if not visible.
                var popupLen = clicked.parents("#popup").length + clicked.is("#popup") ? 1 : 0;
                var navLen = clicked.parents(".navElement").length + clicked.is(".navElement") ? 1 : 0;
                if (popupLen === 0 && navLen === 0) {
                    thisPopup.hidePopup();
                }
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
                        if(thisPopup.getAction()==="changeBusiness"){
                            thisPopup.changeBusiness($(this));
                        }
                    }

                    var keepOpen = thisPopup.populate(newId);

                    if(!keepOpen)
                        thisPopup.hidePopup();
                });

            //Sets global popup object, object, with the created div.
            object = popupDiv;

            this.addMenu("changeBusiness", "Businesses", data.roles);

            //Function also returns the popup div for ease of use.
            return popupDiv;
        };

        this.hidePopup = function () {
            history = [];
            $("#popup").stop(false, true).fadeOut('fast');
        };

        //Public void function that populates setTitle and setContent with data found by id passed.
        this.populate = function (id) {
            var newMenu = this.getMenu(id);
            if (newMenu === null) {
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
            var popupContentDiv = $("#popupContent");
            popupContentDiv.html(content);
            //popupContentDiv.data('jsp').getContentPane().html(content);
            //popupContentDiv.data('jsp').reinitialise();
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

        this.getBusiness = function(name){
            //console.log("name: "+name);
            var roles = data.roles;
            var role;

            for(role in roles){
                //console.log(roles[role]);
                if(roles[role].name === name)return roles[role];
            }
            return null;
        };

        this.changeBusiness = function(clicked){
            var businessId = clicked.attr("id");
            var name = clicked.html();
            var business = this.getBusiness(name);
            if(business===null){
                console.log("Business not found!");
                return;
            }
            this.changeBusinessLogo(business);
            setSideBarSections(data, business.sections);
        };

        this.changeBusinessLogo = function(business){
            $("#clientLogo").attr('src', business.businessLogoUrl);
            console.log("Logo: "+business.businessLogoUrl);
        };
    }

    /**
     * Initializes the navigator
     * @param config Example below
     * {
     * name: "Jordan Kelly",
     * avatarUrl: ".\img\jordan.jpg",
     * businessLogoUrl: ".\img\myBusiness.jpg",
     * roles: [{name: "FoundOPS", id:"23144-24242-242442"},
     *         {name: "GotGrease", id:"Afsafsaf-24242-242442"},
     *         {name: "AB Couriers", id:"Dagag-24242-242442"}],
     * sections: [{name: "Employees", url:"#Employees", iconUrl: ".\img\employees.jpg"},
     *            {name: "Logout", url:"#Logout", iconUrl: ".\img\logout.jpg"}
     *            {name: "Regions", url:"#Regions", iconUrl: ".\img\regions.jpg"},
     *            {name: "Vehicles", url:"#Vehicles", iconUrl: ".\img\vehicles.jpg"}];
     * };
     * @constructor
     */
    function Navigator(config) {
        initTopNav(config);
        initSideBar(config);
        this.popup = new Popup(config);
    }

    /** Initializes top navigation **/
    var initTopNav = function (config) {
        var topNav = $(document.createElement('div'));
        topNav.attr('id', 'nav');

        var navTemplateHtml = $("#navTemplate").html();
        var navTemplate = kendo.template(navTemplateHtml);
        var params = [config.avatarUrl, config.roles[0].businessLogoUrl];
        topNav.html(navTemplate(params));

        $('body').prepend(topNav);

        //refresh the page when the user double clicks on the corner logo
        $('#logo').dblclick(function () {
            var url = window.location.href;
            //remove the hash
            var index = url.indexOf('#');
            if (index > 0) {
                url = url.substring(0, index);
            }
            window.location.href = url;
        });

        $(document).on("popupEvent", function(e, data){
            //console.log(data);
            if(($(data).attr("id") === "navClient") && config.roles.length<=1){
                $("#changeBusiness").css("display", "none");
            }
            var name = $(data).html();
            var role = getRole(config.roles, name);
            if(role!==null){
                $(this).trigger("roleSelected", role);
            }
        });

        Navigator.prototype.hideSearch = function () {
            $("#navSearch").hide();
        };

        Navigator.prototype.showSearch = function () {
            $("#navSearch").show();
        };
    };

    /** Initializes scrollbar for sidebar navigation **/
    var initSideBarScrollBar = function () {
        var sideBarWrapperDiv = $("#sideBarWrapper");
        sideBarWrapperDiv.jScrollPane({
            horizontalGutter: 0,
            verticalGutter: 0,
            verticalDragMinHeight: 25,
            'showArrows': false
        });

        var sideBarScrollBar = sideBarWrapperDiv.data('jsp');
        //From jScrollPane examples: http://jscrollpane.kelvinluck.com/dynamic_height.html
        var throttleTimeout;
        $(window).bind('resize', function () {
                if ($.browser.msie) {
                    if (!throttleTimeout) {
                        throttleTimeout = setTimeout(
                            function () {
                                sideBarScrollBar.reinitialise();
                                throttleTimeout = null;
                            }, 50
                        );
                    }
                } else {
                    sideBarScrollBar.reinitialise();
                }
            }
        );
    };

    /**
     * Converts an image url to its colored version, for the hover url
     * Ex. dispatcher.png -> dispatcherColor.png
     */
//    function toHoverImage(imgLoc) {
//        var extIndex = imgLoc.lastIndexOf('.');
//        return imgLoc.substring(0, extIndex) + "Color" + imgLoc.substring(extIndex);
//    }

    var getSection = function(sections, name){
        var section;
        for(section in sections){
            //console.log("Sections: " + sections[section]);
            if(sections[section].name === name){
                return sections[section];
            }
        }
        return null;
    };

    var getRole = function(roles, name){
        var role;
        for(role in roles){
            //console.log("Roles: " + roles[role].name);
            if(roles[role].name === name){
                return roles[role];
            }
        }
        return null;
    };

    var setSideBarSections = function(config, availableSections){
        var section;
        var sBar = $("#sideBar");
        var sBarElement = "";
        //initialize the sections on the sidebar
        for (section in availableSections) {
            console.log(section);
            var currentSection = getSection(config.sections, availableSections[section]);//config.sections[section];
            var href = currentSection.url;
            var name = currentSection.name;
            var color = currentSection.color;
            var iconUrl = currentSection.iconUrl;
            var iconHoverUrl = currentSection.iconHoverUrl;
            //TODO: Implement sprite selection.
            $('<img/>').src = iconHoverUrl;//toHoverImage(iconUrl);
            //Default values unless sprite.
            var bgX = 'center';
            var bgY = 'center';

            var sideBarElementTemplateHtml = $("#sideBarElementTemplate").html();
            var sideBarElementTemplate = kendo.template(sideBarElementTemplateHtml);
            var templateData = {
                href: href,
                color: color,
                iconUrl: iconUrl,
                iconHoverUrl: iconHoverUrl,
                bgX: bgX,
                bgY: bgY,
                name: name
            };
            sBarElement += sideBarElementTemplate(templateData);
        }
        $("#sideBarSections").html(sBarElement);
    };

    /** Initializes sidebar navigation **/
    var initSideBar = function (config) {
        //TODO: Error checking?
        var slideMenuTimeout = null;
        var sections = config.sections;

        //setup the sidebar wrapper (for the scrollbar)
        var sBarWrapper = $(document.createElement('div'));
        sBarWrapper.attr('id', 'sideBarWrapper');

        //setup the sidebar (the place for buttons)
        var sBar = $(document.createElement('div'));
        sBar.attr('id', 'sideBar');

        //extract the template from the html
        var expandTemplateHtml = $("#expandTemplate").html();
        var expandTemplate = kendo.template(expandTemplateHtml);
        sBar.html(expandTemplate);
        sBar.append("<div id='sideBarSections'></div>");
        sBarWrapper.append(sBar);
        $('#nav').after(sBarWrapper);

        setSideBarSections(config, config.roles[0].sections);

        //Add showMenuSpan to topNav.
        var showMenuTemplateHtml = $("#showMenuTemplate").html();
        var showMenuTemplate = kendo.template(showMenuTemplateHtml);
        $('#navContainer').after(showMenuTemplate);

        $(document).on("touchstart mouseenter", ".sideBarElement", function(){
                $(this).stop(true, true).addClass($(this).attr('data-color'));
                //var image = $(this).find(".icon:first").css('background-image').replace(/^url|[\(\)]/g, '');
                var hoverImg = $(this).attr("data-iconHoverUrl");//getSection(config.sections, $(this).find(".sectionName").html()).iconHoverUrl;//toHoverImage(image);
                $(this).find(".icon").css('background-image', 'url(' + hoverImg + ')');
        });
        $(document).on("touchend mouseleave mouseup", ".sideBarElement", function(){
                $(this).stop(true, true).removeClass($(this).attr('data-color'));
                var image = $(this).attr("data-iconUrl");//getSection(config.sections, $(this).find(".sectionName").html()).iconUrl;//$(this).find(".icon:first").css('background-image').replace(/^url|[\(\)]/g, '');
                //image = image.replace('Color.', '.');
                $(this).find(".icon").css('background-image', 'url(' + image + ')');
        });

        /** Initialize sidebar scrollbar **/
        initSideBarScrollBar();

        /** Sidebar event listeners **/
        var sideBarDiv = $("#sideBar");
        var sideBarWrapperDiv = $("#sideBarWrapper");
        //Listens for clicks outside of elements
        $(document).on('click touchend', function (e) {
            var clicked = $(e.target);
            //console.log("Clicked on: " + clicked.html());
            var sideBarLen = clicked.parents("#sideBar").length + clicked.is("#sideBar") ? 1 : 0;
            var showMenuLen = clicked.parents("#showMenu").length + clicked.is("#showMenu") ? 1 : 0;

            //Detects clicks outside of the sideBar when shown.
            if (sideBarLen === 0 && showMenuLen === 0 && !$("#sideBar").hasClass("hidden") && $(document).width() <= 800) {
                toggleMenu();
            }

            var sideBarWrapperLen = clicked.parents("#sideBarWrapper").length + clicked.is("#sideBarWrapper") ? 1 : 0;
            //Detects clicks outside of the sideBar when expanded.
            var slideMenuLen = clicked.parents("#slideMenu").length + clicked.is("#slideMenu") ? 1 : 0;
            if (sideBarWrapperLen === 0 && slideMenuLen === 0 && $("#sideBar").hasClass("expand") && $(document).width() > 800) {
                slideMenuClosed();
            }
        });

        //Listener for window resize to reset sideBar styles.
        $(window).resize(function () {
            if ($(window).width() <= 800) {
                sideBarDiv.css("width", "");
                sideBarDiv.removeClass("hover");
                if (sideBarDiv.hasClass("expand")) {
                    sideBarDiv.removeClass("expand");
                    sideBarDiv.attr("style", "");
                    $("#sideBarWrapper").attr("style", "");
                }
                if (!sideBarDiv.hasClass("hidden")) {
                    $(".iconShow").addClass('rotateIcon');
                }
            } else if ($(window).width() > 800) {
                if (sideBarDiv.hasClass("hidden")) {
                    sideBarDiv.removeClass("hidden");
                    sideBarDiv.attr("style", "");
                    $("#sideBarWrapper").attr("style", "");
                    //$(".iconShow").removeClass('rotateIcon');
                }
                if (sideBarDiv.hasClass("hover")) {
                    slideMenuClosed();
                    sideBarDiv.removeClass("hover");
                }
            }
        });

        var slideMenuOpen = function () {
            $("#sideBar, #sideBarWrapper, #sideBarWrapper .jspContainer")
                .stop(true, false)
                .animate({width: '159px'}, 'fast');
            $(".iconExpand").addClass("flip");
        };

        var slideMenuClosed = function () {
            //clearTimeout(slideMenuTimeout);
            $("#sideBar, #sideBarWrapper, #sideBarWrapper .jspContainer")
                .stop(true, false)
                .animate({width: '55px'}, 'fast');
            $(".iconExpand").removeClass("flip");
        };

        /* Explanation of hover/click states.
         onhoverin:
         addClass hover
         if no expand -> slideIn
         //if expand, slideIn has fired, so do nothing.

         onhoverout:
         if expand -> slideOut, removeClass expand
         else if hover -> slideOut, removeClass hover

         onClick:
         if hover -> slideOut, removeClass hover
         else if expand -> slideOut, removeClass expand
         */

        //Click listener in charge of expanding sideBar on slideMenu button click.
        $("#slideMenu").stop().click(
            function () {
                if (sideBarDiv.hasClass("hover")) {
                    slideMenuClosed();
                    sideBarDiv.removeClass("hover");
                    sideBarDiv.removeClass("expand");
                } else if (sideBarDiv.hasClass("expand")) {
                    slideMenuClosed();
                    sideBarDiv.removeClass("expand");
                } else {
                    sideBarDiv.addClass("expand");
                    //clearTimeout(slideMenuTimeout);
                    slideMenuOpen();
                }
            }
        );

        //Hover listener that expands/contracts sideBar.
        $("#sideBarWrapper").hover(
            //Hover In
            function () {
                if ($(document).width() > 800 && !sideBarDiv.hasClass("expand")) {
                    //slideMenuTimeout = setTimeout(function(){
                        sideBarDiv.addClass("hover");
                        slideMenuOpen();
                    //}, 2000);
                }
            },
            //Hover Out
            function () {
                if ($(document).width() <= 800)return;
                if (sideBarDiv.hasClass("expand")) {
                    slideMenuClosed();
                    sideBarDiv.removeClass("expand");
                }
                if (sideBarDiv.hasClass("hover")) {
                    //TODO: Fix redundancy
                    slideMenuClosed();
                    sideBarDiv.removeClass("hover");
                    //sideBarDiv.removeClass("expand");
                }
            }
        );

        //General function that toggles menu up, out of view.
        //TODO: Get rotation to work on default android 2.3 browser http://jsfiddle.net/KrRsy/
        var toggleMenu = function () {
            $(".iconShow").toggleClass("rotateIcon");
            var offset = -1 * (sideBarDiv.offset().top + sideBarDiv.outerHeight());
            if (sideBarDiv.hasClass("hidden")) {
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
            function () {
                toggleMenu();
            }
        );

        $(document).on('click', ".sideBarElement", function(){
            var name = $(this).find(".sectionName:first").html();
            var section = getSection(config.sections, name);
            $(this).trigger("sectionSelected", section);
        });
    };

    return Navigator;
});