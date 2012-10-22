describeUi("navigator", "/html5/navigator.html", function () {

    it("should show the popup when the client icon is clicked", function () {
        var win, field, button;
        document.ready( function () {
            runs(function() {
                field = document.getElementById('navClient');
                button = document.getElementById('navClient');
                expect(document.getElementById("popupWrapper").style.visibility.toEqual("hidden"));
                simulate(button, 'click');
            });
            runs(function () {
                expect(document.getElementById("popupWrapper").style.visibility.toEqual("visible"));
            });
        });
    });
});
