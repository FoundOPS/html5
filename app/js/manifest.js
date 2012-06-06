'use strict';

// Copyright 2012 FoundOPS LLC. All Rights Reserved.

/**
 * @fileoverview Class to hold mobile models/logic.
 */
goog.provide('ops.manifest');

$(document).ready(function () {
    $('#qrcode').qrcode({
        text:"geo:40.71872,-73.98905,100",
        width:96,
        height:96
    });
});