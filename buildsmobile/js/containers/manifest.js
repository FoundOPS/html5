// Copyright 2012 FoundOPS LLC. All Rights Reserved.

require.config({waitSeconds:10,paths:{lib:"../lib",js:"../js"}}),require(["jquery","lib/jquery.qrcode.min","js/developer"],function($,qr,developer){$("#qrcode").qrcode({text:"geo:40.71872,-73.98905,100",width:96,height:96})})