define(["jquery","ui/popup","lib/jquery.mousewheel","lib/jquery.jScrollPane","lib/kendo.all"],function($,Popup){function Navigator(conf){config=conf,this.sideBarElementCount=0,this.isCoverWindowButtonEnabled=!1;var thisNavigator=this,initTopNav=function(config){var topNav=$(document.createElement("div"));topNav.attr("id","nav");var navTemplateHtml=$("#navTemplate").html(),navTemplate=kendo.template(navTemplateHtml),businessLogoEnabled=!0,businessLogoUrl=config.roles[0].businessLogoUrl;typeof businessLogoUrl=="undefined"&&(businessLogoEnabled=!1,businessLogoUrl="");var params=[config.avatarUrl,businessLogoUrl];topNav.html(navTemplate(params)),businessLogoEnabled||(topNav.find("#navClient .navIcon").css("border","0"),topNav.find("#clientLogo").css("display","none")),$("body").prepend(topNav),$("#logo").dblclick(function(){var url=window.location.href,index=url.indexOf("#");index>0&&(url=url.substring(0,index)),window.location.href=url})},initSideBarScrollBar=function(){var sideBarWrapperInnerDiv=$("#sideBarInnerWrapper");sideBarWrapperInnerDiv.jScrollPane({horizontalGutter:0,verticalGutter:0,verticalDragMinHeight:25,showArrows:!1});var sideBarScrollBar=sideBarWrapperInnerDiv.data("jsp"),throttleTimeout;$(window).bind("resize",function(){$.browser.msie?throttleTimeout||(throttleTimeout=setTimeout(function(){sideBarScrollBar.reinitialise(),throttleTimeout=null},50)):sideBarScrollBar.reinitialise()}),sideBarScrollBar.reinitialise()},getSection=function(sections,name){var section;for(section in sections)if(sections[section].name===name)return sections[section];return null},getRole=function(roles,name){var role;for(role in roles)if(roles[role].name===name)return roles[role];return null},setSideBarSections=function(config,availableSections){$(".sideBarElement").off();var section,sBar=$("#sideBar"),sBarElement="";thisNavigator.sideBarElementCount=0;for(section in availableSections){var currentSection=getSection(config.sections,availableSections[section]),href="";typeof currentSection.url!="undefined"&&(href="href='"+currentSection.url+"'");var name=currentSection.name,color=currentSection.color,iconUrl=currentSection.iconUrl,hoverIconUrl=currentSection.hoverIconUrl;$("<img/>").src=hoverIconUrl;var bgX="center",bgY="center",sideBarElementTemplateHtml=$("#sideBarElementTemplate").html(),sideBarElementTemplate=kendo.template(sideBarElementTemplateHtml),templateData={href:href,color:color,iconUrl:iconUrl,hoverIconUrl:hoverIconUrl,bgX:bgX,bgY:bgY,name:name};sBarElement+=sideBarElementTemplate(templateData),thisNavigator.sideBarElementCount++}$("#sideBarSections").html(sBarElement),$(".sideBarElement").on({"touchstart mouseenter":function(){$(this).stop(!0,!0).addClass($(this).attr("data-color"));var hoverImg=$(this).attr("data-hoverIconUrl");$(this).find(".icon").css("background-image","url("+hoverImg+")")},"touchend mouseleave mouseup":function(){$(this).stop(!0,!0).removeClass($(this).attr("data-color"));var image=$(this).attr("data-iconUrl");$(this).find(".icon").css("background-image","url("+image+")")},click:function(){var name=$(this).find(".sectionName:first").text(),section=getSection(config.sections,name);$(this).trigger("sectionSelected",section),$("#sideBar").hasClass("cover")&&closeCoverWindow()}})},slideMenuOpen=function(){$("#sideBarWrapper, #sideBarInnerWrapper, #sideBarWrapper .jspContainer, #sideBar").stop(!0,!1).animate({width:"200px"},"fast"),$(".iconExpand").addClass("flip")},slideMenuClosed=function(){$("#sideBarWrapper, #sideBarInnerWrapper, #sideBarWrapper .jspContainer, #sideBar").stop(!0,!1).animate({width:"55px"},"fast"),$(".iconExpand").removeClass("flip")},coverWindow=function(){var sideBarDiv=$("#sideBar");sideBarDiv.removeClass("hover"),sideBarDiv.removeClass("expand"),$("#sideBarWrapper").stop(!1,!0).animate({width:"100%"},"fast"),$("#sideBarInnerWrapper, #sideBarWrapper .jspContainer, #sideBar").stop(!1,!0).animate({width:"200px"},"fast"),sideBarDiv.addClass("cover"),$(".iconExpand").addClass("flip")},closeCoverWindow=function(){slideMenuClosed(),$("#sideBar").removeClass("cover"),$(".iconExpand").removeClass("flip")};Navigator.prototype.coverWindow=coverWindow,Navigator.prototype.closeCoverWindow=closeCoverWindow;var initSideBar=function(config){var slideMenuTimeout=null,sections=config.sections,sBarWrapper=$(document.createElement("div"));sBarWrapper.attr("id","sideBarWrapper");var sBarInnerWrapper=$(document.createElement("div"));sBarInnerWrapper.attr("id","sideBarInnerWrapper");var sBar=$(document.createElement("div"));sBar.attr("id","sideBar");var expandTemplateHtml=$("#expandTemplate").html(),expandTemplate=kendo.template(expandTemplateHtml);sBar.html(expandTemplate),sBar.append("<div id='sideBarSections'></div>"),sBarInnerWrapper.append(sBar),sBarWrapper.append(sBarInnerWrapper),typeof config.coverWindow!="undefined"&&config.coverWindow==1&&($(sBarInnerWrapper).after("<div id='coverWindowButton'>Cover Window</div>"),thisNavigator.isCoverWindowButtonEnabled=!0,console.log("It's enabled")),$("#nav").after(sBarWrapper),setSideBarSections(config,config.roles[0].sections),$(document).ready(function(){if($(window).width()<=800){sBar.addClass("hidden");var offset=-1*(sBar.offset().top+sBar.outerHeight());sBar.css("top",offset)}});var showMenuTemplateHtml=$("#showMenuTemplate").html(),showMenuTemplate=kendo.template(showMenuTemplateHtml);$("#navContainer").after(showMenuTemplate),initSideBarScrollBar();var sideBarDiv=$("#sideBar"),sideBarWrapperDiv=$("#sideBarWrapper");$(document).on("click touchend",function(e){var clicked=$(e.target),sideBarLen=clicked.parents("#sideBar").length+clicked.is("#sideBar")?1:0,showMenuLen=clicked.parents("#showMenu").length+clicked.is("#showMenu")?1:0;sideBarLen===0&&showMenuLen===0&&!$("#sideBar").hasClass("hidden")&&$(document).width()<=800&&toggleMenu();var sideBarWrapperLen=clicked.parents("#sideBarWrapper").length+clicked.is("#sideBarWrapper")?1:0,slideMenuLen=clicked.parents("#slideMenu").length+clicked.is("#slideMenu")?1:0;sideBarWrapperLen===0&&slideMenuLen===0&&$("#sideBar").hasClass("expand")&&$(document).width()>800&&slideMenuClosed()}),$(window).resize(function(){if($(window).width()<=800){sideBarDiv.css("width",""),sideBarDiv.removeClass("hover"),$(".iconExpand").removeClass("flip"),sideBarDiv.hasClass("cover")&&(sideBarDiv.removeClass("cover"),sideBarDiv.attr("style",""),$("#sideBarWrapper").attr("style",""),$("#sideBarInnerWrapper").attr("style",""));if(!sideBarDiv.hasClass("shown")){$("#sideBarWrapper").css("width",""),sideBarDiv.addClass("hidden");if(sBar.offset().top>=0){var offset=-1*(sBar.offset().top+sBar.outerHeight());sBar.css("top",offset)}$("#sideBarWrapper").css("visibility","hidden"),$(".iconShow").removeClass("rotateIcon")}sideBarDiv.hasClass("expand")&&(sideBarDiv.removeClass("expand"),sideBarDiv.attr("style",""),$("#sideBarInnerWrapper").attr("style",""))}else if($(window).width()>800){if(sideBarDiv.hasClass("hidden")||sideBarDiv.hasClass("shown"))sideBarDiv.removeClass("hidden"),sideBarDiv.removeClass("shown"),sideBarDiv.attr("style",""),$("#sideBarWrapper").attr("style",""),$("#sideBarInnerWrapper").attr("style",""),$(".iconShow").removeClass("rotateIcon");sideBarDiv.hasClass("hover")&&(slideMenuClosed(),sideBarDiv.removeClass("hover"))}}),$("#slideMenu").stop().click(function(){sideBarDiv.hasClass("hover")?(slideMenuClosed(),sideBarDiv.removeClass("hover"),sideBarDiv.removeClass("expand")):sideBarDiv.hasClass("expand")?(slideMenuClosed(),sideBarDiv.removeClass("expand")):sideBarDiv.hasClass("cover")?(slideMenuClosed(),sideBarDiv.removeClass("cover")):(sideBarDiv.addClass("expand"),slideMenuOpen())}),$("#coverWindowButton").stop().click(function(){sideBarDiv.hasClass("cover")?closeCoverWindow():coverWindow()}),$("#sideBarWrapper").hover(function(){$(document).width()>800&&!sideBarDiv.hasClass("expand")&&!sideBarDiv.hasClass("cover")&&(sideBarDiv.addClass("hover"),slideMenuOpen())},function(){if($(document).width()<=800)return;sideBarDiv.hasClass("expand")&&(slideMenuClosed(),sideBarDiv.removeClass("expand")),sideBarDiv.hasClass("hover")&&(slideMenuClosed(),sideBarDiv.removeClass("hover"))});var toggleMenu=function(){$(".iconShow").toggleClass("rotateIcon");if(sideBarDiv.hasClass("hidden"))sideBarWrapperDiv.css("visibility","visible"),sideBarDiv.stop(!1,!0).animate({top:0},"fast"),$("#sideBarInnerWrapper").data("jsp").reinitialise(),sideBarDiv.removeClass("hidden"),sideBarDiv.addClass("shown");else{var offset=-1*(sideBarDiv.offset().top+sideBarDiv.outerHeight());sideBarDiv.stop(!1,!0).animate({top:offset},"fast",function(){$("#sideBarWrapper").css("visibility","hidden")}),sideBarDiv.addClass("hidden"),sideBarDiv.removeClass("shown")}};$("#showMenu").stop(!0,!1).click(function(){toggleMenu()})},getBusiness=function(name,config){var roles=config.roles,role;for(role in roles)if(roles[role].name===name)return roles[role];return null},changeBusiness=function(clicked,config){var name=clicked.text(),business=getBusiness(name,config);if(business===null){console.log("Business not found!");return}thisNavigator.changeBusinessLogo(business.businessLogoUrl),setSideBarSections(config,business.sections),$("#sideBarInnerWrapper").data("jsp").reinitialise()};Navigator.prototype.changeBusiness=changeBusiness,this.changeAvatar=function(imgLoc){$(".profile").attr("src",imgLoc)},this.changeBusinessLogo=function(businessLogoUrl){var businessLogoEnabled=!0;typeof businessLogoUrl=="undefined"&&(businessLogoEnabled=!1,businessLogoUrl="");var clientLogoDiv=$("#clientLogo");clientLogoDiv.attr("src",businessLogoUrl);var navClientIconDiv=$("#navClient .navIcon");businessLogoEnabled?(navClientIconDiv.css("border",""),clientLogoDiv.css("display","")):(navClientIconDiv.css("border","0"),clientLogoDiv.css("display","none"))};var initPopup=function(config){$("#navClient").popup({id:"navClient",title:config.name,contents:[{name:"Settings",url:config.settingsUrl},{name:"Change Business",id:"changeBusiness"},{name:"Log Out",url:config.logOutUrl}]});var changeBusinessMenu={id:"changeBusiness",title:"Businesses",contents:config.roles};$("#navClient").popup("addMenu",changeBusinessMenu),$(document).on("popup.created",function(){$("#popupContentWrapper").jScrollPane({horizontalGutter:0,verticalGutter:0,showArrows:!1})}),$(document).on("popup.setContent popup.visible popup.resize",function(e){$("#popupContentWrapper").data("jsp").reinitialise()}),$(document).on("popupEvent",function(e,data){$(data).attr("id")==="navClient"&&config.roles.length<=1&&$("#changeBusiness").css("display","none");var name=$(data).text(),role=getRole(config.roles,name);role!==null&&$(e.target).trigger("roleSelected",role),$("#popup").children("#currentPopupAction").text()==="changeBusiness"&&changeBusiness($(e.target),config)})};initTopNav(config),initSideBar(config),initPopup(config),this.closePopup=$(document).popup("closePopup"),this.hideSearch=function(){$("#navSearch").hide()},this.showSearch=function(){$("#navSearch").show()}}var config=null;return Navigator})