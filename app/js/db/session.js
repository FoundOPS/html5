// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(['developer', 'db/services', "tools/parameters", "kendo"], function (developer, dbServices, parameters) {
    var session = new kendo.data.ObservableObject({});
    window.session = session;

    //region private

    /**
     * Sets the role on the session observable and calls and waiting roleFunctions
     * @param role
     */
    var setRole = function (role) {
        session.set("role", role);

        for (var i = 0; i < roleFunctions.length; i++) {
            roleFunctions[i](role);
        }
    };

    //sync the role with the roleId parameter
    parameters.roleId.changed.add(function (roleId) {
        var role = _.find(session._data.roles, function (r) {
            return r.id === roleId;
        });

        if (!role || session.get("role.id") === role.id) {
            return;
        }

        setRole(role);
    });

    //endregion

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

        //load the session data
        dbServices.sessions.read().done(function (data) {
            session._data = data;
            session.set("user", data.name);
            session.set("email", data.email);

            //try to load the role from the query parameter
            var roleId = parameters.get().roleId;
            var role = _.find(session._data.roles, function (r) {
                return r.id === roleId;
            });

            //if the role cannot be found from the parameter, set it to the first loaded role
            if (!role) {
                role = data.roles[0];
                //setRole will be called due to parameters.roleId.changed
                parameters.setOne("roleId", role.id, true);
            } else {
                setRole(role);
            }

            callback(session._data);
        });
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
     * @return {A}
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
//    session._role = session._data.roles[0];

    return session;
});