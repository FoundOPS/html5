jasmineui.loadUi("/app/navigator-test.html", function () {
    describe('Routes section', function () {
        var routeLinks = "#routes-listview li a", destinationLinks = "#routeDestinations-listview li a";

        beforeEach(function () {
            TestTools.selectSection("routes");
        });

        it("lists routes", function () {
            runs(function () {
                TestTools.expectItem(routeLinks);
            });
        });

        describe("after choosing a route", function () {
            beforeEach(function () {
                runs(function () {
                    TestTools.selectItem(routeLinks);
                });
            });

            it("lists destinations", function () {
                runs(function () {
                    TestTools.expectItem(destinationLinks);
                });
            });

            it("shows status colors", function () {
                //check there is a color element equal to the status color
                runs(function () {
                    var colorDivs = destinationLinks + " .taskStatusColorImg";
                    TestTools.expectItem(colorDivs);

                    var backgroundColors = $.makeArray($(colorDivs).map(function () {
                        return $(this).css("background-color");
                    }));

                    expect(backgroundColors.length > 0).toBeTruthy();
                });
            });
        });

        describe("after choosing a destination", function () {
            beforeEach(function () {
                runs(function () {
                    TestTools.selectItem(routeLinks);

                    setTimeout(function () {
                        TestTools.selectItem(destinationLinks);
                    }, 750);
                });
            });

            it("shows contact info", function () {
                runs(function () {
                    //check the location has a header and paragraph with text
                    expect($(".locationInfo h1")).not.toHaveText(/^$/);
                    expect($(".locationInfo p")).not.toHaveText(/^$/);

                    var contacts = ".contactList li span";

                    //check there is a Phone Number, Email Address, and Website
                    expect($(contacts + ".Phone")).toExist();
                    expect($(contacts + ".Email")).toExist();
                    expect($(contacts + ".Website")).toExist();
                });
            });

            describe("after clicking navigate", function () {
                it("opens google maps", function () {
                    runs(function () {
                        TestTools.clickItem("#directionsButton");

                        //TODO figure out how to check if a window opened
                    });
                });
            });
        });
    });
});