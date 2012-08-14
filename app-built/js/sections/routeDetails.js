// Copyright 2012 FoundOPS LLC. All Rights Reserved.

define(["jquery","db/services","db/models","db/saveHistory","lib/kendo.all"],function($,dbServices,models,saveHistory){var routeDetails={},vm=kendo.observable(),serviceDate,intervalId=null,trackPointsToSend=[];window.routeDetails=routeDetails,routeDetails.vm=vm,routeDetails.CONFIG={TRACKPOINT_COLLECTION_FREQUENCY_SECONDS:1,ACCURACY_THRESHOLD:50};var addPushTrackPoints=function(routeId){var onSuccess=function(position){var collectedTime=moment.utc().toDate(),newTrackPoint=new models.TrackPoint(position.coords.accuracy,collectedTime,position.coords.heading,position.coords.latitude,position.coords.longitude,routeId,"Mobile",position.coords.speed);trackPointsToSend.push(newTrackPoint),dbServices.postTrackPoints(trackPointsToSend,function(data){data&&(trackPointsToSend=[])})},onError=function(error){switch(error.code){case error.PERMISSION_DENIED:alert("You must accept the Geolocation request to enable mobile tracking.");break;case error.POSITION_UNAVAILABLE:alert("Location information is unavailable at this time.");break;case error.TIMEOUT:console.log("The Geolocation request has timed out. Please check your internet connectivity.");break;default:console.log("Geolocation information is not available at this time. Please check your Geolocation settings.")}vm.endRoute()};navigator.geolocation.getCurrentPosition(onSuccess,onError,{enableHighAccuracy:!0})};$.subscribe("selectedRoute",function(data){vm.set("selectedRoute",data),vm.set("routeDestinationsSource",new kendo.data.DataSource({data:vm.get("selectedRoute.RouteDestinations")}))});var initialized=!1;routeDetails.show=function(){saveHistory.close();if(initialized)return;if(!vm.get("routeDestinationsSource")){application.navigate("view/routes.html");return}initialized=!0,vm.selectRouteDestination=function(e){vm.set("selectedDestination",e.dataItem),localStorage.setItem("selectedDestination",vm.get("selectedDestination.Id")),$.publish("selectedDestination",[vm.get("selectedDestination")]),application.navigate("view/routeDestinationDetails.html")},vm.set("startVisible",!0),vm.set("endVisible",!1),vm.startRoute=function(){vm.set("startVisible",!1),vm.set("endVisible",!0),serviceDate=new Date,intervalId=window.setInterval(function(){addPushTrackPoints(routes.vm.get("selectedRoute").Id)},routeDetails.CONFIG.TRACKPOINT_COLLECTION_FREQUENCY_SECONDS*1e3)},vm.endRoute=function(){vm.set("startVisible",!0),vm.set("endVisible",!1),clearInterval(intervalId),trackPointsToSend=[]},kendo.bind($("#routeDetails"),vm,kendo.mobile.ui)}})