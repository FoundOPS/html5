fakeDepots = [{"AddressLineOne":"1305 Cumberland Ave","AddressLineTwo":"","City":"West Lafayette","ContactInfoSet":[],"latitude":"40.46033500","longitude":"-86.92984000","name":"Depot","State":"IN","ZipCode":"47906"}]

fakeResources = [{"accuracy":null,"collectedTimeStamp":"\/Date(1338941361550-0400)\/","heading":139,"id":"00000000-0000-0000-0000-000000000000","latitude":40.45535000,"longitude":-86.94060000,"routeId":"f57f763f-87e1-47e0-98c8-f650b2c556dc","source":"iPhone","speed":36.00000000,"employeeId":"ded264b5-523a-4107-a364-774cbc295cd1","entityName":"Jim Boliath","vehicleId":null},
                 {"accuracy":null,"collectedTimeStamp":"\/Date(1338941361547-0400)\/","heading":175,"id":"00000000-0000-0000-0000-000000000000","latitude":40.46000000,"longitude":-86.92115000,"routeId":"7c4d1de7-974a-46e1-8e56-b701bcb28f8c","source":"iPhone","speed":34.00000000,"employeeId":"d714da3e-2637-4f64-a397-3d1a9955de18","entityName":"Bob Black","vehicleId":null}]

fakeRoutes = [{"id":"f57f763f-87e1-47e0-98c8-f650b2c556dc","name":"North Side","routeDestinations":[
                  {"location":{"latitude":"40.42273300","longitude":"-86.90275800","name":"El Rodeo"},"orderInRoute":1},
                  {"location":{"latitude":"40.01214500","longitude":"-86.90382500","name":"Culver's"},"orderInRoute":2}]},
              {"Id":"7c4d1de7-974a-46e1-8e56-b701bcb28f8c","name":"Shelter Island","routeDestinations":[
                  {"location":{"latitude":"40.42208100","longitude":"-86.90356900","name":"Bruno's Pizza and Big O's Sports Room"},"orderInRoute":1},
                  {"location":{"latitude":"40.41773300","longitude":"-86.82418700","name":"Bob Evans Restaurant"},"orderInRoute":2}]}]

fakeTrackpoints = [{"accuracy":1,"collectedTimeStamp":"\/Date(1338886800000)\/","heading":null,"id":"ded264b5-523a-4107-a364-774cbc295cd1","latitude":40.599,"longitude":-86.9309,"routeId":"f57f763f-87e1-47e0-98c8-f650b2c556dc","source":null,"speed":null},
                   {"accuracy":1,"collectedTimeStamp":"\/Date(1338886830000)\/","heading":null,"id":"ded264b5-523a-4107-a364-774cbc295cd1","latitude":40.589,"longitude":-86.9299,"routeId":"f57f763f-87e1-47e0-98c8-f650b2c556dc","source":null,"speed":null}]

routeColorSelector = new ops.tools.ValueSelector(ops.ui.ITEM_COLORS);
routeOpacitySelector = new ops.tools.ValueSelector(ops.ui.ITEM_OPACITIES);