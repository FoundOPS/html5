'use strict';

describe("Initialization", function () {
    it("RequireJS should be initialized.", function () {
        expect(require).toBeDefined();
    });
    it("Kendo should be initialized.", function () {
        expect(kendo).toBeDefined();
    });
    it("Routes should be initialized.", function () {
        expect(window.routes).toBeDefined();
    });
    it("Route details hould be initialized.", function () {
        expect(window.routeDetails).toBeDefined();
    });
    it("Route destination details hould be initialized.", function () {
        expect(window.routeDestinationDetails).toBeDefined();
    });
    it("Route tasks should be initialized.", function () {
        expect(window.routeTask).toBeDefined();
    });
});
