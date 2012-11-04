jasmineui.loadUi("/app/navigator-test.html", function () {
    describe('routes', function () {
        it("should show a list of four routes", function () {
            runs(function () {
                //click the routes button
                var button = $(document).find('#sideBarSections a[href$="routes.html"]')[0];
                jasmineui.simulate(button, 'click');
            });
            runs(function () {
                //expect routes to show up

            });
        });
    });
});
