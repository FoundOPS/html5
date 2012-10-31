jasmineui.loadUi("/app/navigator-test.html", function () {
//    jasmineui.inject(function () {
//        //some functions infinitely use setInterval (i think debounce on underscore) (todo try and reduce this)
//        //the async sensor will never have 0 intervals and will cause the test suite to timeout
//        delete jasmineui.asyncSensors["interval"];
//
//        console.log("");
//    });

    describe('navigator', function () {
        alert("HERE");
        it("should show the popup when the client icon is clicked", function () {
            console.log("Got here");
            alert("PLEASE");
        });
    });
});
