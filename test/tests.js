//region Tools Tests
describe("Tools", function () {
    describe("getDirection", function () {
        it("converts degrees to a compass direction", function () {
            expect(ops.tools.getDirection(488)).toEqual("SE");
        });
    });
    describe("formatDate", function () {
        it("convert a goog.date.UTCDateTime to 'mm-dd-yyyy'", function () {
            var date = new goog.date.UtcDateTime(2012, 5, 5);
            expect(ops.tools.formatDate(date)).toEqual("6-5-2012");
        });
    });
});
//endregion

//region Leaflet Tests
describe("Leaflet", function () {
    beforeEach(function () {
        $('#map').remove();
        $('body').append('<div id="map"></div>');
        $("#map").css("visibility", "hidden");
    });
    describe("setupMap", function () {
        it("should be loaded", function () {
            var map = ops.leaflet.setupMap();
            expect(map._zoom).toEqual(4);
            expect(map.options.center.lat).toEqual(40);
            expect(map.options.center.lng).toEqual(-89);
        });
    });
    describe("center", function () {
        it("should center/fit the map based on the given locations", function () {
            var map = ops.leaflet.setupMap();
            var p1 = new window.L.LatLng("40.1", "-85.1");
            var p2 = new window.L.LatLng("40.1", "-85.2");
            var p3 = new window.L.LatLng("40.2", "-85.1");
            var p4 = new window.L.LatLng("40.2", "-85.2");
            var locations = [p1, p2, p3, p4];
            ops.leaflet.center(map, locations);
            expect(map._zoom).toEqual(4);
            expect(map._animateToCenter.lat).toEqual(40.150000000000006);
            expect(map._animateToCenter.lng).toEqual(-85.15);
        });
    });
    describe("addPopup", function () {
        it("should add a popup to the given marker", function () {
            var map = ops.leaflet.setupMap();
            var p1 = new window.L.LatLng("40.1", "-85.1");
            var marker = new L.Marker(p1);
            var content = "<p>Opsly</p>";
            ops.leaflet.addPopup_(marker, content);
            map.addLayer(marker);
            expect(map._layers[15]._popup._content).toBeDefined();
        });
    });
    describe("getLatLng", function () {
        it("should create a new window.L.LatLng from an ops.models.Location", function () {
            var location = fakeDepots[0];
            var latLng = ops.leaflet.getLatLng(location);
            expect(latLng.lat).toEqual(40.460335);
        });
    })
    describe("drawDepots", function () {
        it("should return a layer group with depots", function () {
            var map = ops.leaflet.setupMap();
            var depots = ops.leaflet.drawDepots(map, fakeDepots);
            //using regex, checks that there is a depot icon on the map
            expect(map._panes.markerPane.innerHTML).toMatch(/depot\.png/);
        });
    });
    describe("drawResources", function () {
        it("should return a layer group with resources", function () {
            var map = ops.leaflet.setupMap();
            var resources = ops.leaflet.drawResources(map, fakeResources, routeColorSelector);
            //using regex, checks that there are 2 apple icons on the map
            expect(map._panes.markerPane.innerHTML).toMatch(/apple.*apple/g);
        });
    });
    describe("drawRoutes", function () {
        it("should return a layer group with routes", function () {
            var map = ops.leaflet.setupMap();
            var routes = ops.leaflet.drawRoutes(map, fakeRoutes, routeColorSelector, true);
            //using regex, checks that there are 4 divIcons on the map.
            //(each divIcon has a number class)
            expect(map._panes.markerPane.innerHTML).toMatch(/number.*number.*number.*number/g);
        });
    });
    describe("drawTrackPoints", function () {
        it("should return a layer group with TrackPoints", function () {
            var map = ops.leaflet.setupMap();
            var trackPoints = ops.leaflet.drawTrackPoints(map, fakeTrackpoints, fakeResources, routeColorSelector, routeOpacitySelector, 'f57f763f-87e1-47e0-98c8-f650b2c556dc');
            //using regex, checks that the map contains the polyline of trackpoints.
            //(in HTML, the polyline will be an SVG element. It also checks that the color string exists inside the SVG
            // to ensure it's the correct element)
            expect(map._objectsPane.innerHTML).toMatch(/svg.*194A91/g);
        });
    });
});
//endregion

//region Map Tests
//endregion