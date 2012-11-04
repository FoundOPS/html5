jasmineui.loadUi("/app/navigator-test.html", function () {
    describe('navigator', function () {
        it("should show the popup when the icon is clicked", function () {
            runs(function () {
                var button = document.getElementById('navClient');
                jasmineui.simulate(button, 'click');
            });
            runs(function () {
                setTimeout(function () {
                    expect(document.getElementById("popupWrapper")).toBeVisible();
                }, 1500);
            });
        });
    });
});
