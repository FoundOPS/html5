// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(['db/services', 'tools', "parameters", "kendo"], function (dbservices, tools, parameters) {
    var session = new kendo.data.ObservableObject({});
    window.session = session;

//region public
    /**
     * Gets the current session information
     * @param {function({Object})} callback Invoked with the config when it is loaded
     */
    session.load = function (callback) {
        //if the _config is already loaded return it
        if (session._data) {
            callback(session._data);
            return;
        }

        //load the config
        dbservices.getSession(function (data) {
            session._data = data;

            //try to load the role from the query parameter
            //otherwise set it to the first loaded role
            if (!syncRoleId()) {
                session.setRole(data.roles[0]);
            }

            callback(session._data);
        });
    };

    //set the role
    session.setRole = function (role) {
        session.set("role", role);

        dbservices.setRoleId(role.id);

        //only set the parameter if a section is loaded
        var currentSection = parameters.getSection();
        if (!currentSection) {
            return;
        }

        parameters.setOne("roleId", role.id);
    };

    var roleFunctions = [];
    /**
     * A method which will set the RoleId initially and whenever it changes.
     * @param {function(roleId: string)} setProperty A function to set the value to the roleId
     */
    session.followRole = function (setProperty) {
        roleFunctions.push(setProperty);
        var role = session.get("role");
        if (role) {
            setProperty(role);
        }
    };

    /**
     * Extend moment with a function to adjust the timezone to the offset
     * @param offset in minutes
     * @return A moment offset by the TimeZone
     */
    moment.fn.timezoneOffset = function (offset) {
        var diff = this.zone() + offset;
        return this.clone().add('minutes', diff);
    };

    /**
     * Get now adjusted for the users time zone.
     * If there is no session data, it will return the computer's local date.
     * @return {moment}
     */
    session.now = function () {
        if (!session._data || !session._data.userTimeZone || !session._data.userTimeZoneOffsetMinutes) {
            return moment();
        }

        var result = moment().timezoneOffset(session._data.userTimeZoneOffsetMinutes);
        return result;
    };

    /**
     * Get the start of today adjusted for the users time zone.
     * If there is no session data, it will return the computer's local date.
     * @return {moment}
     */
    session.today = function () {
        return session.now().startOf('day');
    };

//endregion

    //sync the roleId parameter with the current role
    //returns true if the role was set
    var syncRoleId = function () {
        if (!session._data) {
            return false;
        }

        //only sync if a section is loaded
        var currentSection = parameters.getSection();
        if (!currentSection) {
            return;
        }

        var query = parameters.get();
        //if it did not change
        if (query.roleId === session.get("role.id")) {
            return false;
        }

        var role = _.find(session._data.roles, function (r) {
            return r.id === query.roleId;
        });
        //if the role was found, set it
        if (role) {
            session.setRole(role);
            return true;
        }
        //otherwise reset the parameter to the current roleId
        else {
            parameters.setOne("roleId", session.get("role.id"), true);
            return false;
        }
    };

    parameters.changed.add(function () {
        syncRoleId();
    });


    session.bind("change", function (e) {
        if (e.field === "role") {
            var role = session.get("role");
            if (role) {
                for (var i = 0; i < roleFunctions.length; i++) {
                    roleFunctions[i](role);
                }
            }
        }
    });

//    for debugging when the API is turned off
//    set static values set for config & selected role
//    session._data = {
//        "name": "Jonathan Perl",
//        "settingsUrl": "#view/personalSettings.html",
//        "logOutUrl": "../view/logout.html",
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
//                    "Support",
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
//                    "Support",
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
//                    "Support",
//                    "Locations",
//                    "Regions",
//                    "Services",
//                    "Vehicles"
//                ]
//            },
//            {
//                "id": "1",
//                "name": "Nero's Grease Recovery",
//                "type": "Mobile",
//                "sections": [
//                    "Routes"
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
//                "name": "Support",
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
//            },
//            {
//                "name": "Routes",
//                "color": "green",
//                "iconUrl": "img/routes.png",
//                "hoverIconUrl": "img/routesColor.png",
//                "isSilverlight": false
//            }
//        ]
//    };
//session._role = session._data.roles[0];

    return session;
});