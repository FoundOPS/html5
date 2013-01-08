jasmineui.loadUi("../../index.html", function () {
    describe('navigator', function () {
        it("should show the popup when the icon is clicked", function () {
            runs(function () {
                var button = document.getElementById('navClient');
                jasmineui.simulate(button, 'click');
            });
            runs(function () {
                expect(document.getElementById("popupWrapper")).toBeVisible();
            });
        });
    });
});