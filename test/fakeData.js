// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific settings.
 */

"use strict";

define(['tools'], function (tools) {
    var fakeData = {};
    fakeData.depots = [
        {"AddressLineOne": "1305 Cumberland Ave", "AddressLineTwo": "", "City": "West Lafayette", "ContactInfoSet": [], "Latitude": "40.46033500", "Longitude": "-86.92984000", "Name": "Depot", "State": "IN", "ZipCode": "47906"}
    ];

    fakeData.resources = [
        {"Accuracy": null, "CollectedTimeStamp": "\/Date(1338941361550-0400)\/", "Heading": 139, "Id": "00000000-0000-0000-0000-000000000000", "Latitude": 40.45535000, "Longitude": -86.94060000, "RouteId": "f57f763f-87e1-47e0-98c8-f650b2c556dc", "Source": "iPhone", "Speed": 36.00000000, "EmployeeId": "ded264b5-523a-4107-a364-774cbc295cd1", "EntityName": "Jim Boliath", "VehicleId": null},
        {"Accuracy": null, "CollectedTimeStamp": "\/Date(1338941361547-0400)\/", "Heading": 175, "Id": "00000000-0000-0000-0000-000000000000", "Latitude": 40.46000000, "Longitude": -86.92115000, "RouteId": "7c4d1de7-974a-46e1-8e56-b701bcb28f8c", "Source": "iPhone", "Speed": 34.00000000, "EmployeeId": "d714da3e-2637-4f64-a397-3d1a9955de18", "EntityName": "Bob Black", "VehicleId": null}
    ];

    fakeData.routes = [
        {"Id": "f57f763f-87e1-47e0-98c8-f650b2c556dc", "Name": "North SIde", "RouteDestinations": [
            {"Location": {"Latitude": "40.42273300", "Longitude": "-86.90275800", "Name": "El Rodeo"}, "OrderInRoute": 1},
            {"Location": {"Latitude": "40.01214500", "Longitude": "-86.90382500", "Name": "Culver's"}, "OrderInRoute": 2}
        ]},
        {"Id": "7c4d1de7-974a-46e1-8e56-b701bcb28f8c", "Name": "Shelter Island", "RouteDestinations": [
            {"Location": {"Latitude": "40.42208100", "Longitude": "-86.90356900", "Name": "Bruno's Pizza and Big O's Sports Room"}, "OrderInRoute": 1},
            {"Location": {"Latitude": "40.41773300", "Longitude": "-86.82418700", "Name": "Bob Evans Restaurant"}, "OrderInRoute": 2}
        ]}
    ];

    fakeData.trackpoints = [
        {"Accuracy": 1, "CollectedTimeStamp": "\/Date(1338886800000)\/", "Heading": null, "Id": "ded264b5-523a-4107-a364-774cbc295cd1", "Latitude": 40.599, "Longitude": -86.9309, "RouteId": "f57f763f-87e1-47e0-98c8-f650b2c556dc", "Source": null, "Speed": null},
        {"Accuracy": 1, "CollectedTimeStamp": "\/Date(1338886830000)\/", "Heading": null, "Id": "ded264b5-523a-4107-a364-774cbc295cd1", "Latitude": 40.589, "Longitude": -86.9299, "RouteId": "f57f763f-87e1-47e0-98c8-f650b2c556dc", "Source": null, "Speed": null}
    ];

    fakeData.routeColorSelector = new tools.ValueSelector(ops.ui.ITEM_COLORS);
    fakeData.routeOpacitySelector = new tools.ValueSelector(ops.ui.ITEM_OPACITIES);

    return fakeData;
});