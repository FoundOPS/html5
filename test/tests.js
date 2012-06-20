'use strict';

define(['tools', 'ui/leaflet', '../../test/fakeData', 'ui/ui', 'db/services'], function (tools, leaflet, data, ui, services) {
//region Tools Tests
//    describe("Tools", function () {
//        describe("getDirection", function () {
//            it("should convert degrees to a compass direction", function () {
//                expect(tools.getDirection(488)).toEqual("SE");
//            });
//        });
//        describe("formatDate", function () {
//            it("should convert a Date to 'mm-dd-yyyy'", function () {
//                var date = new Date(2012, 5, 5);
//                expect(tools.formatDate(date)).toEqual("6-5-2012");
//            });
//        });
//        describe("dateEqual", function () {
//            it("should check if two dates(without the time) are equal'", function () {
//                var date1 = new Date(2012, 6, 5, 5, 20, 5, 5);
//                var date2 = new Date(2012, 6, 5, 5, 21, 5, 5);
//                expect(tools.dateEqual(date1, date2)).toBeTruthy();
//            });
//        });
//        describe("newGuid", function () {
//            it("should create a new GUID", function () {
//                //expect("3df4").toMatch(/^(?:[0-9A-Za-z]{4})$/);
//                expect(tools.newGuid()).toMatch(/^(?:[0-9A-Za-z]{8})-(?:[0-9A-Za-z]{4})-(?:[0-9A-Za-z]{4})-(?:[0-9A-Za-z]{4})-(?:[0-9A-Za-z]{12})$/);
//            });
//            it("should create a unique GUID", function () {
//                var guid1 = tools.newGuid();
//                var guid2 = tools.newGuid();
//                expect(guid1).not.toEqual(guid2);
//            });
//        });
//    });
//endregion

//region Leaflet Tests
//    describe("Leaflet", function () {
//        beforeEach(function () {
//            setFixtures('<div id="map"></div>');
//        });
//        describe("setup the map", function () {
//            it("should load the map", function () {
//                var map = leaflet.setupMap();
//                expect(map._zoom).toEqual(4);
//                expect(map.options.center.lat).toEqual(40);
//                expect(map.options.center.lng).toEqual(-89);
//            });
//        });
//        describe("center the map", function () {
//            it("should center/fit the map based on the given locations", function () {
//                var map = leaflet.setupMap();
//                var p1 = new window.L.LatLng("40.1", "-85.1");
//                var p2 = new window.L.LatLng("40.1", "-85.2");
//                var p3 = new window.L.LatLng("40.2", "-85.1");
//                var p4 = new window.L.LatLng("40.2", "-85.2");
//                var locations = [p1, p2, p3, p4];
//                leaflet.center(map, locations);
//                expect(map._zoom).toEqual(4);
//                expect(map._animateToCenter.lat).toEqual(40.150000000000006);
//                expect(map._animateToCenter.lng).toEqual(-85.15);
//            });
//        });
//        describe("adding a Popup to a marker", function () {
//            it("should add a popup to the given marker", function () {
//                var map = leaflet.setupMap();
//                var p1 = new window.L.LatLng("40.1", "-85.1");
//                var marker = new L.Marker(p1);
//                var content = "<p>Opsly</p>";
//                leaflet.addPopup_(marker, content);
//                map.addLayer(marker);
//                expect(map._layers[15]._popup._content).toBeDefined();
//            });
//        });
//        describe("get LatLng from location", function () {
//            it("should create a new window.L.LatLng from a location", function () {
//                var location = data.depots[0];
//                var latLng = leaflet.getLatLng(location);
//                expect(latLng.lat).toEqual(40.460335);
//            });
//        });
//        describe("drawing depots", function () {
//            it("should return a layer group with depots", function () {
//                var map = leaflet.setupMap();
//                var depots = leaflet.drawDepots(map, data.depots);
//                //using regex, checks that there is a depot icon on the map
//                expect(map._panes.markerPane.innerHTML).toMatch(/depot\.png/);
//            });
//        });
//        describe("drawing resources", function () {
//            it("should return a layer group with resources", function () {
//                var map = leaflet.setupMap();
//                var resources = leaflet.drawResources(map, data.resources, data.routeColorSelector);
//                //using regex, checks that there are 2 apple icons on the map
//                expect(map._panes.markerPane.innerHTML).toMatch(/apple.*apple/g);
//            });
//            describe("adding a click handler to the marker", function () {
//                it("should select a route when a resource is clicked on", function () {
//                    var callback = jasmine.createSpy();
//                    var map = leaflet.setupMap();
//                    var resources = leaflet.drawResources(map, data.resources, data.routeColorSelector, callback);
//                    map._panes.markerPane.lastChild.click();
//                    expect(callback).toHaveBeenCalledWith("7c4d1de7-974a-46e1-8e56-b701bcb28f8c");
//                });
//            });
//        });
//        describe("drawing routes", function () {
//            it("should return a layer group with routes", function () {
//                var map = leaflet.setupMap();
//                var routes = leaflet.drawRoutes(map, data.routes, data.routeColorSelector, true);
//                //using regex, checks that there are 4 divIcons on the map.
//                //(each divIcon has a number class)
//                expect(map._panes.markerPane.innerHTML).toMatch(/number.*number.*number.*number/g);
//            });
//            describe("adding a click handler to the marker", function () {
//                it("should select a route when a destination is clicked on", function () {
//                    var callback = jasmine.createSpy();
//                    var map = leaflet.setupMap();
//                    var resources = leaflet.drawRoutes(map, data.routes, data.routeColorSelector, true, callback);
//                    map._panes.markerPane.lastChild.click();
//                    expect(callback).toHaveBeenCalledWith("7c4d1de7-974a-46e1-8e56-b701bcb28f8c");
//                });
//            });
//        });
//        describe("drawing trackPoints", function () {
//            it("should return a layer group with TrackPoints", function () {
//                var map = leaflet.setupMap();
//                var trackPoints = leaflet.drawTrackPoints(map, data.trackpoints, data.resources, data.routeColorSelector, data.routeOpacitySelector, 'f57f763f-87e1-47e0-98c8-f650b2c556dc');
//                //using regex, checks that the map contains the polyline of trackpoints.
//                //(in HTML, the polyline will be an SVG element. It also checks that the color string exists inside the SVG
//                // to ensure it's the correct element)
//                expect(map._objectsPane.innerHTML).toMatch(/svg.*194A91/g);
//            });
//        });
//    });
//endregion

//region Map Tests
//    describe("Map", function () {
//        beforeEach(function () {
//            setFixtures('<div id="map"></div>');
//        });
//        describe("on initialization", function () {
//            it("should create a map and set the date", function () {
//                map.selectedRouteId = "f57f763f-87e1-47e0-98c8-f650b2c556dc";
//                initialize();
//                expect(map.innerHTML).not.toEqual("");
//                expect(setDate).toHaveBeenCalledWith(new Date());
//                $('#map').click();
//                expect(map.selectedRouteId).toBeFalsy();
//            });
//        });
//        describe("the role (id) is set", function () {
//            var roleId = "B6C0AA05-3947-4AE5-8C08-840132ACF5C2";
//            window.map.setRoleId(roleId);
//            it("should set the role id", function () {
//                expect(services.setRoleId).toEqual(roleId);
//            });
//            it("should load and draw depots", function () {
//                expect(getDepots).toHaveBeenCalled();
//            });
//            it("should load and draw routes", function () {
//                expect(getRoutes).toHaveBeenCalled();
//            });
//            it("should load and draw resources", function () {
//                expect(getResources).toHaveBeenCalled();
//            });
//        });
//        describe("a route is selected", function () {
//            it("should set the selected routeId, clear old trackpoints, and draw new trackpoints", function () {
//                var selectedRouteId = "7c4d1de7-974a-46e1-8e56-b701bcb28f8c";
//                var routeId = "f57f763f-87e1-47e0-98c8-f650b2c556dc";
//                var trackPointsGroup = new window.L.LayerGroup();
//                setSelectedRoute("f57f763f-87e1-47e0-98c8-f650b2c556dc");
//                expect(removeLayer).toHaveBeenCalledWith(trackPointsGroup);
//                expect(selectedRouteId).toEqual(routeId);
//                expect(drawTrackpoints).toHaveBeenCalledWith(routeId);
//            });
//        });
//        describe("the date is set", function () {
//            it("should set the selected date, and clear and redraw all objects", function () {
//                var selectedDate = new Date(2012,6,13);
//                var date = new Date();
//                var resourcesGroup = new window.L.LayerGroup();
//                var routesGroup = new window.L.LayerGroup();
//                var trackPointsGroup = new window.L.LayerGroup();
//                var center = false;
//                setDate(date);
//                expect(selectedDate).toEqual(date);
//                expect(removeLayer).toHaveBeenCalledWith(resourcesGroup);
//                expect(removeLayer).toHaveBeenCalledWith(routesGroup);
//                expect(removeLayer).toHaveBeenCalledWith(trackPointsGroup);
//                expect(center).toBeTruthy();
//                expect(getRoutes).toHaveBeenCalled();
//                expect(getResources).toHaveBeenCalled();
//            });
//        });
//        describe("removing a layer", function () {
//            it("should remove a layer from the map", function () {
//                var layer = new window.L.LayerGroup();
//                var map = leaflet.setupMap();
//                map.addLayer(layer);
//                removeLayer(layer);
//                expect(map._layers[43]).not.toBeDefined();
//            });
//        });
//        describe("drawResources", function () {
//            it("should call draw methods for resources and trackpoints", function () {
//                var resources = data.resources;
//                drawResources();
//                expect(routeTrackPoints).toContain(resources[0]);
//                expect(leaflet.drawResources).toHaveBeenCalled();
//                if (selectedRouteId) {
//                    expect(leaflet.drawTrackPoints).toHaveBeenCalled();
//                }
//            });
//        });
//        describe("drawTrackpoints", function () {
//            it("should get the trackpoints and call their draw method", function () {
//                var routeId = "f57f763f-87e1-47e0-98c8-f650b2c556dc";
//                var routeId2 = "f57f763f-87e1-47e0-98c8-f650b2c556dc";
//                //call drawTrackpoints when routeTrackPoints has trackpoints
//                var routeTrackPoints = data.trackpoints[routeId];
//                drawTrackpoints(routeId);
//                if(routeTrackPoints){
//                    expect(services.getTrackPoints).not.toHaveBeenCalled();
//                }else{
//                    expect(services.getTrackPoints).toHaveBeenCalled();
//                }
//                //call drawTrackpoints when routeTrackPoints is empty
//                var routeTrackPoints = data.trackpoints[routeId2];
//                drawTrackpoints(routeId);
//                expect(leaflet.drawTrackPoints).toHaveBeenCalled();
//                if(routeTrackPoints){
//                    expect(services.getTrackPoints).not.toHaveBeenCalled();
//                }else{
//                    expect(services.getTrackPoints).toHaveBeenCalled();
//                }
//                //check that the trackpoints were drawn
//                expect(leaflet.drawTrackPoints).toHaveBeenCalled();
//            });
//        });
//        describe("getting the depots", function () {
//            it("should get the depots and call their draw method", function () {
//                services.RoleId = "3959D9BF-66EA-41FD-90F2-7AD58A18DF2A";
//                getDepots();
//                expect(removeLayer).toHaveBeenCalled();
//                expect(services.getDepots).toHaveBeenCalled();
//            });
//        });
//        describe("getting the resources", function () {
//            it("should get the resources and call their draw method", function () {
//            services.RoleId = "3959D9BF-66EA-41FD-90F2-7AD58A18DF2A";
//            var selectedDate = new Date();
//            getResources();
//            expect(services.getResourcesWithLatestPoints).toHaveBeenCalled();
//        });
//        describe("getting the routes", function () {
//            it("should get the routes and call their draw method", function () {
//                services.RoleId = "3959D9BF-66EA-41FD-90F2-7AD58A18DF2A";
//                getRoutes();
//                expect(services.getRoutes).toHaveBeenCalled();
//            });
//        });
//    });
//endregion

//region Servcice Tests
    describe("Service", function () {
        beforeEach(function () {
            services.setRoleId('2B1F25C6-213A-44F4-AAF5-622113577FD4');
        });
//        describe("getting routes", function () {
//            it("should get the routes data from the API", function () {
//                var date = tools.formatDate(new Date());
//                var routes;
//                runs(function () {
//                    services.getRoutes(date, function (loadedRoutes) {
//                        routes = loadedRoutes;
//                    });
//                });
//                waits(2000);
//                runs(function () {
//                    var route = routes[0].Id;
//                    expect(route).toBeDefined();
//                });
//            });
//        });
//        describe("getting resources", function () {
//            it("should get the resources data from the API", function () {
//                var resources;
//                runs(function () {
//                    services.getResourcesWithLatestPoints(function (resourcesWithLatestPoints) {
//                        resources = resourcesWithLatestPoints;
//                    });
//                });
//                waits(2000);
//                runs(function () {
//                    var resourceName = resources[0].EntityName;
//                    expect(resourceName).toBeDefined();
//                });
//            });
//        });
//        describe("getting depots", function () {
//            it("should get the depots data from the API", function () {
//                var depots;
//                runs(function () {
//                    services.getDepots(function (loadedDepots) {
//                        depots = loadedDepots;
//                    });
//                });
//                waits(2000);
//                runs(function () {
//                    var depotName = depots[0].Name;
//                    expect(depotName).toBeDefined();
//                });
//            });
//        });
//        describe("getting trackpoints", function () {
//            it("should get the trackpoints data from the API", function () {
//                var trackpoints;
//                var routeId = '82a14c51-815e-43cd-937e-0883538af357';
//                var date = tools.formatDate(new Date());
//                runs(function () {
//                    services.getTrackPoints(date, routeId, function (loadedTrackpoints) {
//                        trackpoints = loadedTrackpoints;
//                    });
//                });
//                waits(8000);
//                runs(function () {
//                    var trackpointId = trackpoints[0].Id;
//                    expect(trackpointId).toBeDefined();
//                });
//            });
//        });
        describe("posting trackpoints", function () {
            it("should post trackpoints to the API", function () {
                var trackpointsPosted;
                var trackpoints = data.trackpoints;
                var routeId = 'f57f763f-87e1-47e0-98c8-f650b2c556dc';
                runs(function () {
                    services.postTrackPoints(trackpoints, routeId, function () {
                        trackpointsPosted = true;
                    });
                });
                waits(3000);
                runs(function () {
                    expect(trackpointsPosted).toBeTruthy();
                });
            });
        });
    });
//endregion
});