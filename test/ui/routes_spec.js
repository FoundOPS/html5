//jasmineui.require(['asyncSensor'], function (asyncSensor) {
//    setInterval(function () {
//        asyncSensor.updateSensor('pageChanged', false);
//    }, 3000);
//});

jasmineui.loadUi("/app/navigator-test.html", function () {
    describe('Routes section', function () {
        var routeLinks = "#routes-listview li a", destinationLinks = "#routeDestinations-listview li a";

        beforeEach(function () {
            var button = $('#sideBarSections a[href$="routes.html"]').get(0);
            jasmineui.simulate(button, 'click');
        });

        describe("after choosing a route", function () {
            it("lists routes", function () {
                //check there is at least one route that showed up
                expect($(routeLinks).size() > 0).toBeGreaterThan(0);
//                console.log($(routeLinks).size());
            });

//            it("lists route destinations", function () {
//            waitsFor(function () {
//                return false;
//            }, 3000);

//            runs(function () {
//                var button = $(routeLinks).get(0);
//                jasmineui.simulate(button, 'click');
//
//                _.delay(function () {
//                    console.log($(destinationLinks));
//                }, 2000);
//            });
//
//            runs(function () {
//                //check there is at least one destination that showed up
//                //expect($(destinationLinks).size()).toBeGreaterThan(0);
//            });
//            });

//            it("shows status colors", function () {
//                var tools = new TestTools();
//
//                runs(function () {
//                    tools.choose("routes");
//                });
//
//                runs(function () {
//                    tools.click(routeLinks);
//                });
//
//                runs(function () {
//                    tools.click(destinationLinks);
//                });
//
//                runs(function () {
////                    //check there is a color element equal to the status color
////                    _.delay(function () {
////                        debugger;
////                    }, 1000);
//                });
//            });
        });
//
//
//       describe("after choosing a route destination", function () {
//            it("shows route details", function () {
//
//            });
//
//            it("shows contact info", function () {
//                //expect a phone link
//                //expect a email link
        //           });
//
//            describe("after clicking navigate", function () {
//                it("opens google maps", function () {
//
//                });
//            });
        //       });
    });
});
