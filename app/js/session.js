// Copyright 2012 FoundOPS LLC. All Rights Reserved.

'use strict';

define(function () {
    var session = {};

    /**
     * The current user's role type.
     * This should be set from the navigator when it initializes and whenever a different role is selected.
     * @type {String}
     */
    session.RoleType = "Administrator";

    return session;
});