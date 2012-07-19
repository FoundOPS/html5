// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(['db/services'], function (dbservices) {
    var session = {};

    window.session = session;

    /**
     * The selected role
     */
    session.getRole = function () {
        return session._role;
    };

    session.setRole = function (role) {
        return session._role = role;
    };

    /**
     * Gets the current session information
     * @param {function({Object})} callback Invoked with the config when it is loaded
     */
    session.get = function (callback) {
        //if the _config is already loaded return it
        if (session._data) {
            callback(session._data);
            return;
        }

        //load the config
        dbservices.getSession(function (data) {
            session._data = data;
            session._role = data.roles[0];

            callback(session._data);
        });
    };

//    //for debugging when the API is turned off
//    //set static values set for config & selected role
//    session._data = {
//        "name": "Jonathan Perl",
//        "settingsUrl": "#view/personalSettings.html",
//        "logOutUrl": "Account/LogOut",
//        "avatarUrl": "img/emptyPerson.png",
//        "roles": [
//            {
//                "id": "50f2551f-d3fd-4372-b5ed-b85f2cda95bb",
//                "name": "AB Couriers",
//                "type": "Administrator",
//                "sections": [
//                    "Clients",
//                    "Dispatcher",
//                    "Employees",
//                    "Feedback and Support",
//                    "Locations",
//                    "Regions",
//                    "Services",
//                    "Vehicles"
//                ]
//            },
//            {
//                "id": "8db0dfbc-210c-4117-a010-511cb1afbcff",
//                "name": "FoundOPS",
//                "sections": [
//                    "Business Accounts"
//                ]
//            },
//            {
//                "id": "b042f3e3-99e4-463f-92cd-aa39f1667279",
//                "name": "Generic Oil Collector",
//                "type": "Administrator",
//                "sections": [
//                    "Clients",
//                    "Dispatcher",
//                    "Employees",
//                    "Feedback and Support",
//                    "Locations",
//                    "Regions",
//                    "Services",
//                    "Vehicles"
//                ]
//            },
//            {
//                "id": "9fda11d1-428f-4f60-b6e1-9e31528c75b7",
//                "name": "GotGrease?",
//                "type": "Administrator",
//                "businessLogoUrl": "./img/got-grease-logo.png",
//                "sections": [
//                    "Clients",
//                    "Dispatcher",
//                    "Employees",
//                    "Feedback and Support",
//                    "Locations",
//                    "Regions",
//                    "Services",
//                    "Vehicles"
//                ]
//            }
//        ],
//        "sections": [
//            {
//                "name": "Business Accounts",
//                "color": "black",
//                "iconUrl": "img/businessAccounts.png",
//                "hoverIconUrl": "img/businessAccountsColor.png",
//                "isSilverlight": true
//            },
//            {
//                "name": "Clients",
//                "color": "blue",
//                "iconUrl": "img/clients.png",
//                "hoverIconUrl": "img/clientsColor.png",
//                "isSilverlight": true
//            },
//            {
//                "name": "Dispatcher",
//                "color": "green",
//                "iconUrl": "img/dispatcher.png",
//                "hoverIconUrl": "img/dispatcherColor.png",
//                "isSilverlight": true
//            },
//            {
//                "name": "Employees",
//                "color": "red",
//                "iconUrl": "img/employees.png",
//                "hoverIconUrl": "img/employeesColor.png",
//                "isSilverlight": true
//            },
//            {
//                "name": "Feedback and Support",
//                "color": "blue",
//                "iconUrl": "img/uservoice.png",
//                "hoverIconUrl": "img/uservoiceColor.png"
//            },
//            {
//                "name": "Locations",
//                "color": "orange",
//                "iconUrl": "img/locations.png",
//                "hoverIconUrl": "img/locationsColor.png",
//                "isSilverlight": true
//            },
//            {
//                "name": "Regions",
//                "color": "orange",
//                "iconUrl": "img/regions.png",
//                "hoverIconUrl": "img/regionsColor.png",
//                "isSilverlight": true
//            },
//            {
//                "name": "Services",
//                "color": "green",
//                "iconUrl": "img/services.png",
//                "hoverIconUrl": "img/servicesColor.png",
//                "isSilverlight": true
//            },
//            {
//                "name": "Vehicles",
//                "color": "red",
//                "iconUrl": "img/vehicles.png",
//                "hoverIconUrl": "img/vehiclesColor.png",
//                "isSilverlight": true
//            }
//        ]
//    };
//    session._role = session._data.roles[0];

    return session;
});