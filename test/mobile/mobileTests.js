'use strict';

define(function (require) {
    var main = require('main');

    describe("Kendo", function () {
        it("Should be initialized.", function () {
            expect(kendo).toBeDefined();
        });
    });
    describe("RequireJS", function () {
        it("Should be initialized.", function () {
            expect(require).toBeDefined();
        });
    });
    describe("Main", function () {
        it("Should have acessible variables.", function () {
            expect(window.initialized).toBeDefined();
        });
        it("Should have accessible objects.", function () {
            expect(window.main.onBack).toBeDefined();
        });
    });
    describe("Routes", function () {
        it("Should be initialized.", function () {
            expect(window.routes).toBeDefined();
        });
    });
    describe("Route Destinations", function () {
        it("Should be initialized.", function () {
            expect(window.routeDetails).toBeDefined();
        });
    });
    describe("Route Destination Details", function () {
        it("Should be initialized.", function () {
            expect(window.routeDestinationDetails).toBeDefined();
        });
    });
    describe("Route Task", function () {
        it("Should be initialized.", function () {
            expect(window.routeTask).toBeDefined();
        });
    });
});