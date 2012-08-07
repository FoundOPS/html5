"use strict";

define(["containers/navigator", "lib/kendo.all","lib/userVoice"], function (Navigator) {
    var config = {
        "name": "Jonathan Perl",
        "settingsUrl": "#view/personalSettings.html",
        "logOutUrl": "../Account/LogOut",
        "avatarUrl": "/app/img/emptyPerson.png",
        "roles": [
            {
                "id": "50f2551f-d3fd-4372-b5ed-b85f2cda95bb",
                "name": "AB Couriers",
                "type": "Administrator",
                "sections": [
                    "Clients",
                    "Dispatcher",
                    "Employees",
                    "Support",
                    "Locations",
                    "Regions",
                    "Services",
                    "Vehicles"
                ]
            },
            {
                "id": "8db0dfbc-210c-4117-a010-511cb1afbcff",
                "name": "FoundOPS",
                "sections": [
                    "Business Accounts"
                ]
            },
            {
                "id": "b042f3e3-99e4-463f-92cd-aa39f1667279",
                "name": "Generic Oil Collector",
                "type": "Administrator",
                "sections": [
                    "Clients",
                    "Dispatcher",
                    "Employees",
                    "Support",
                    "Locations",
                    "Regions",
                    "Services",
                    "Vehicles"
                ]
            },
            {
                "id": "9fda11d1-428f-4f60-b6e1-9e31528c75b7",
                "name": "GotGrease?",
                "type": "Administrator",
                "businessLogoUrl": "/app/img/got-grease-logo.png",
                "sections": [
                    "Clients",
                    "Dispatcher",
                    "Employees",
                    "Support",
                    "Locations",
                    "Regions",
                    "Services",
                    "Vehicles"
                ]
            }
        ],
        "sections": [
            {
                "name": "Business Accounts",
                "color": "black",
                "iconUrl": "/app/img/businessAccounts.png",
                "hoverIconUrl": "/app/img/businessAccountsColor.png",
                "isSilverlight": true
            },
            {
                "name": "Clients",
                "color": "blue",
                "iconUrl": "/app/img/clients.png",
                "hoverIconUrl": "/app/img/clientsColor.png",
                "isSilverlight": true
            },
            {
                "name": "Dispatcher",
                "color": "green",
                "iconUrl": "/app/img/dispatcher.png",
                "hoverIconUrl": "/app/img/dispatcherColor.png",
                "isSilverlight": true
            },
            {
                "name": "Employees",
                "color": "red",
                "iconUrl": "/app/img/employees.png",
                "hoverIconUrl": "/app/img/employeesColor.png",
                "isSilverlight": true
            },
            {
                "name": "Support",
                "color": "blue",
                "iconUrl": "/app/img/uservoice.png",
                "hoverIconUrl": "/app/img/uservoiceColor.png"
            },
            {
                "name": "Locations",
                "color": "orange",
                "iconUrl": "/app/img/locations.png",
                "hoverIconUrl": "/app/img/locationsColor.png",
                "isSilverlight": true
            },
            {
                "name": "Regions",
                "color": "orange",
                "iconUrl": "/app/img/regions.png",
                "hoverIconUrl": "/app/img/regionsColor.png",
                "isSilverlight": true
            },
            {
                "name": "Services",
                "color": "green",
                "iconUrl": "/app/img/services.png",
                "hoverIconUrl": "/app/img/servicesColor.png",
                "isSilverlight": true
            },
            {
                "name": "Vehicles",
                "color": "red",
                "iconUrl": "/app/img/vehicles.png",
                "hoverIconUrl": "/app/img/vehiclesColor.png",
                "isSilverlight": true
            }
        ]
    };

    var navigator = new Navigator(config);
    navigator.hideSearch();
    //navigator.changeAvatar("test.jpg");
    describe("Navigator initialization: ", function () {
        describe("The top navigation initialised and", function() {
            it("has the nav div initialised", function(){
                var nav = $("#nav").length;
                expect(nav).not.toEqual(0);
            });

            if($(window).width()>800){
                it("has the logo onscreen and visible on large view", function(){
                    var isLogoVisible = $("#logo").is(":visible");
                    expect(isLogoVisible).toBe(true);
                });
            }
        });
        describe("The sidebar is initialised and", function() {
            it("has sidebar icons visible", function(){
                //$(".sideBarElement").first().hide();
                var sideBarElementCount = $(".sideBarElement").length;
                var visibleSideBarElementCount = $(".sideBarElement:visible").length;
                expect(sideBarElementCount).toEqual(visibleSideBarElementCount);

                var internalSideBarElementCount = navigator.sideBarElementCount;
                expect(sideBarElementCount).toEqual(internalSideBarElementCount);
                //console.log(navigator.sideBarElementCount);


                $("#navClient").trigger("click");
                $("#changeBusiness").trigger("click");
                var lastPopupContent = $("#popupContent").children("a").eq(1);
                navigator.changeBusiness(lastPopupContent, config);

                //console.log(navigator.sideBarElementCount);
            });
            it("has the expandMenuButton visible on large view / hidden on small view", function(){
                //TODO: Push the slideMenu visibility onto expandMenuButton.
                var isExpandMenuButtonVisible = $("#slideMenu").is(":visible");
                //console.log(isExpandMenuButtonVisible);
                //TODO: Check child divs?
                var isLargeView = false;
                if($(window).width()>800){
                    isLargeView = true;
                }
                expect(isExpandMenuButtonVisible).toBe(isLargeView);
            });
            describe("on event:", function(){
                if($(window).width()>800){
                    it("hover, sidebar has hover class on large view only.", function(){
                        $("#sideBarSections").trigger("mouseenter");
                        var hasClassHover = $("#sideBar").hasClass("hover");
                        expect(hasClassHover).toBeTruthy();

                        $("#sideBarSections").trigger("mouseout");
                        hasClassHover = $("#sideBar").hasClass("hover");
                        expect(hasClassHover).toBeFalsy();
                    });
                    it("expand, sidebar has expand class on large view only.", function(){
                        //TODO: Change slideMenu listener to expandMenuButton.
                        $("#slideMenu").trigger("click");
                        var hasClassExpand = $("#sideBar").hasClass("expand");
                        expect(hasClassExpand).toBeTruthy();

                        $("#slideMenu").trigger("click");
                        hasClassExpand = $("#sideBar").hasClass("expand");
                        expect(hasClassExpand).toBeFalsy();
                    });
                    it("cover, sidebar has cover class on large view only.", function(){
                        //TODO: Check if coverButton is enabled and compare it to existing/visible.
                        var isCoverWindowButtonVisible = $("#coverWindowButton").is(":visible");
                        var isCoverWindowButtonEnabled = navigator.isCoverWindowButtonEnabled;
                        expect(isCoverWindowButtonVisible).toBe(isCoverWindowButtonEnabled);

                        if(!isCoverWindowButtonEnabled)return;

                        $("#coverWindowButton").trigger("click");
                        var hasClassCover = $("#sideBar").hasClass("cover");
                        expect(hasClassCover).toBeTruthy();

                        $("#coverWindowButton").trigger("click");
                        hasClassCover = $("#sideBar").hasClass("cover");
                        expect(hasClassCover).toBeFalsy();
                    });
                }
                if($(window).width()<=800){
                    it("shown, sidebar has shown class on small view only", function(){
                        $("#showMenu").trigger("click");
                        var hasClassShown = $("#sideBar").hasClass("shown");
                        var hasClassHidden = $("#sideBar").hasClass("hidden");
                        expect(hasClassShown).toBeTruthy();
                        expect(hasClassHidden).toBeFalsy();

                        $("#showMenu").trigger("click");
                        hasClassShown = $("#sideBar").hasClass("shown");
                        hasClassHidden = $("#sideBar").hasClass("hidden");
                        expect(hasClassShown).toBeFalsy();
                        expect(hasClassHidden).toBeTruthy();
                    });
                }
            });
        });
    });

    describe("Popup initialised:", function(){
        it("has the popupWrapper div created", function(){});
        it("has the content correctly initialised", function(){});
        it("behaves correctly on menu item click", function(){});
    });
});