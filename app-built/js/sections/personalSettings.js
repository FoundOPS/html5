// Copyright 2012 FoundOPS LLC. All Rights Reserved.

define(["db/services","db/saveHistory","tools","widgets/imageUpload"],function(dbServices,saveHistory,tools){var personalSettings={},imageUpload,vm=kendo.observable();personalSettings.vm=vm,personalSettings.undo=function(state){vm.set("settings",state),personalSettings.save()},personalSettings.save=function(){personalSettings.validator.validate()&&personalSettings.validator2.validate()&&dbServices.updatePersonalSettings(vm.get("settings"))},personalSettings.initialize=function(){personalSettings.validator=$("#personalForm").kendoValidator().data("kendoValidator"),personalSettings.validator2=$("#timeZoneForm").kendoValidator().data("kendoValidator");var menu=$("#personal .settingsMenu");kendo.bind(menu),menu.kendoSettingsMenu({selectedItem:"Personal"}),saveHistory.saveInputChanges("#personal"),dbServices.getPersonalSettings(function(settings){personalSettings.settings=settings,vm.set("settings",settings),kendo.bind($("#personal"),vm),imageUpload.setImageUrl(vm.get("settings.ImageUrl")),dbServices.getTimeZones(function(timeZones){personalSettings.timeZones=timeZones,$("#TimeZone").kendoDropDownList({dataSource:personalSettings.timeZones,dataTextField:"DisplayName",dataValueField:"TimeZoneId"});if(!vm.get("settings.TimeZoneInfo")){var timezone=tools.getLocalTimeZone(),dropDownList=$("#TimeZone").data("kendoDropDownList");dropDownList.select(function(dataItem){return dataItem.DisplayName===timezone.DisplayName})}saveHistory.resetHistory()})}),imageUpload=$("#personalImageUpload").kendoImageUpload({uploadUrl:dbServices.API_URL+"settings/UpdateUserImage",imageWidth:200,containerWidth:500}).data("kendoImageUpload")},personalSettings.show=function(){saveHistory.setCurrentSection({page:"Personal Settings",save:personalSettings.save,undo:personalSettings.undo,state:function(){return vm.get("settings")}})},window.personalSettings=personalSettings})