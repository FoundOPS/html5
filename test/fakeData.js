// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold developer specific settings.
 */

"use strict";

define(['tools', 'ui/ui'], function (tools, ui) {
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
            {
                "Client": {"Name": "Arctic White Soft Serve Ice", "ContactInfoSet": []},
                "Location": {"Latitude": "40.42273300", "Longitude": "-86.90275800", "Name": "El Rodeo"},
                "RouteTasks": [{"Id": "9dfe5de0-e84f-48ec-8d9e-175b36ab6f36", "Name": "Economy"}],
                "OrderInRoute": 1
            },
            {
                "Client": {"Name": "Arctic White Soft Serve Ice", "ContactInfoSet": []},
                "Location": {"Latitude": "40.01214500", "Longitude": "-86.90382500", "Name": "Culver's"},
                "RouteTasks": [{"Id": "39c05d25-7b5d-4682-b778-6ebfe17d3ac7", "Name": "Hydrojetting"}],
                "OrderInRoute": 2
            }
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

    fakeData.taskFields = [
        {
            "Id": "1fae727e-5871-405f-9b8e-dc00a7d2240a",
            "Name": "Container Replacement",
            "ServiceDate": "2012-07-03T00:00:00",
            "ClientId": "cf52ac99-a2e1-406a-b134-f4d0777ffb41",
            "ServiceProviderId": "62047896-b2a1-49e4-ba10-72f0667b1db0",
            "Fields": [
                {
                    "IsMultiLine": true,
                    "Id": "ed9d7fa0-a1c9-4caa-9534-50576db56cc1",
                    "Type": "TextBoxField",
                    "Name": "Notes",
                    "Required": false,
                    "ParentFieldId": "02690a4a-5ede-4feb-ac30-5ab2af175025",
                    "ServiceTemplateId": "1fae727e-5871-405f-9b8e-dc00a7d2240a"
                },
                {
                    "AllowMultipleSelection": false,
                    "TypeInt": 0,
                    "Options": [
                        {"Id": "c870ed62-db4c-48f9-9f50-52a9beede901", "Name": "15 Feet", "IsChecked": false, "OptionsFieldId": "68056cb2-cbaa-47f4-a863-de9e80c1a61e", "Index": 2},
                        {"Id": "f5d0fc5a-e5ab-4917-8c66-7acabb6640a9", "Name": "10 Feet", "IsChecked": false, "OptionsFieldId": "68056cb2-cbaa-47f4-a863-de9e80c1a61e", "Index": 1},
                        {"Id": "bea617e4-ad1c-4ff2-83f9-d52aa3c9cc32", "Name": "5 Feet", "IsChecked": false, "OptionsFieldId": "68056cb2-cbaa-47f4-a863-de9e80c1a61e", "Index": 0}
                    ],
                    "Id": "68056cb2-cbaa-47f4-a863-de9e80c1a61e",
                    "Type": "OptionsField", "Name": "Hose Length",
                    "Required": false,
                    "ParentFieldId": "59770c1e-b5a1-441f-b2e8-94f07a44e4e6",
                    "ServiceTemplateId": "105349a4-f564-441a-b7a8-d18bf58ce01e"
                }
            ]
        }
    ];

    fakeData.routeColorSelector = new tools.ValueSelector(ui.ITEM_COLORS);
    fakeData.routeOpacitySelector = new tools.ValueSelector(ui.ITEM_OPACITIES);

    return fakeData;
});