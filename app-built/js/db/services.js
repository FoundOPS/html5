//region Copyright 2012 FoundOPS LLC. All Rights Reserved.

define(["db/developer","tools","db/saveHistory"],function(developer,tools,saveHistory){var services={};$.support.cors=!0,$.ajaxSetup({xhrFields:{withCredentials:!0}}),services.Status={LOADING:0,LOADED:1};var apiUrl,mode=developer.CURRENT_DATA_SOURCE;mode===developer.DataSource.BROWSER_LOCALAPI?apiUrl="http://localhost:9711/api/":mode===developer.DataSource.ANDROID_LOCALAPI?apiUrl="http://10.0.2.2:9711/api/":mode===developer.DataSource.LIVE?apiUrl="http://api.foundops.com/api/":mode===developer.DataSource.TESTAPI&&(apiUrl="http://testapi.foundops.com/api/"),services.API_URL=apiUrl,services.ROOT_API_URL=apiUrl.replace("api/","");var roleIdFunctionQueue=[];return services.setRoleId=function(roleId){services.RoleId=roleId;for(var i in roleIdFunctionQueue)roleIdFunctionQueue[i]();roleIdFunctionQueue.length=0},services._getHttp=function(queryString,opt_params,opt_excludeRoleId,opt_convertItem){var getThenInvokeCallback=function(callback){var params=opt_params||{},invokeAjax=function(params){var url=services.API_URL+queryString;$.ajax({type:"GET",dataType:"JSONP",url:url,data:params}).success(function(response){var convertedData=response;opt_convertItem&&(convertedData=tools.convertArray(response,opt_convertItem)),callback!==null&&callback(convertedData)})};if(!opt_excludeRoleId){if(!services.RoleId){roleIdFunctionQueue.push(function(){params.roleId=services.RoleId.toString(),invokeAjax(params)});return}params.roleId=services.RoleId.toString()}invokeAjax(params)};return getThenInvokeCallback},services.getDepots=services._getHttp("routes/GetDepots",{},!1),services.getResourcesWithLatestPoints=services._getHttp("trackpoint/GetResourcesWithLatestPoints",{},!1),services.getRoutes=function(serviceDateUtc,callback){return services._getHttp("routes/GetRoutes",{serviceDateUtc:serviceDateUtc},!1)(callback)},services.getTrackPoints=function(serviceDateUtc,routeId,callback){return services._getHttp("trackPoint/GetTrackPoints",{routeId:routeId,serviceDateUtc:serviceDateUtc},!1)(callback)},services.postTrackPoints=function(trackPoints,callback){$.ajax({url:services.API_URL+"trackpoint/PostEmployeeTrackPoint",type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(trackPoints)}).success(function(response){callback(response)})},services.getServiceTypes=services._getHttp("service/GetServiceTypes",{},!1),services.getServiceDetails=function(serviceId,serviceDate,recurringServiceId,callback){return services._getHttp("service/GetServiceDetails",{serviceId:serviceId,serviceDate:tools.formatDate(serviceDate),recurringServiceId:recurringServiceId},!1)(function(data){var service=data[0];services.convertServiceDates(service),callback(service)})},services.convertServiceDates=function(service){service.Date=new Date(service.Date);for(var i=0;i<service.Fields.length;i++){var field=service.Fields[i];field.Type==="DateTimeField"&&(field.Earliest=new Date(field.Earliest),field.Latest=new Date(field.Latest),field.Value=new Date(field.Value))}},services.getTaskStatuses=function(callback){return services._getHttp("TaskStatuses/GetStatuses")(callback)},services.updateRouteTask=function(task){return saveHistory.linkNotification($.ajax({url:services.API_URL+"routes/UpdateRouteTask",type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(task)}))},services.updateService=function(service){return saveHistory.linkNotification($.ajax({url:services.API_URL+"service/UpdateService",type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(service)}))},services.deleteService=function(service){$.ajax({url:services.API_URL+"service/DeleteService",type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(service)})},services.getServiceColumns=services._getHttp("service/GetServiceColumns",{},!1),services.updateServiceColumns=function(serviceId,columns){$.ajax({url:services.API_URL+"service/UpdateServiceColumns?roleId="+services.RoleId+"&serviceId="+serviceId,type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(columns)})},services.createPassword=function(newPass,confirmPass){return saveHistory.linkNotification($.ajax({url:services.API_URL+"settings/CreatePassword?newPass="+newPass+"&confirmPass="+confirmPass,type:"POST"}))},services.getAllEmployeesForBusiness=services._getHttp("settings/GetAllEmployeesForBusiness",{},!1),services.getBusinessSettings=services._getHttp("settings/GetBusinessSettings",{},!1),services.getPersonalSettings=services._getHttp("settings/GetPersonalSettings",{},!1),services.updatePassword=function(oldPass,newPass,confirmPass){return saveHistory.linkNotification($.ajax({url:services.API_URL+"settings/UpdatePassword?oldPass="+oldPass+"&newPass="+newPass+"&confirmPass="+confirmPass,type:"POST"}))},services.getBusinessSettings=services._getHttp("settings/GetBusinessSettings",{},!1),services.updateBusinessSettings=function(settings){return saveHistory.linkNotification($.ajax({url:services.API_URL+"settings/UpdateBusinessSettings?roleId="+services.RoleId,type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(settings)}))},services.updatePersonalSettings=function(settings){return saveHistory.linkNotification($.ajax({url:services.API_URL+"settings/UpdatePersonalSettings?roleId="+services.RoleId,type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(settings)}))},services.getTimeZones=services._getHttp("settings/GetTimeZones",{},!1),services.authenticate=function(email,password,callback){return services._getHttp("auth/Login",{email:email,pass:password},!0,null)(callback)},services.getSession=services._getHttp("settings/GetSession",{},!0),services.logout=function(callback){return services._getHttp("auth/LogOut")(callback)},services.trackError=function(error,business,section){$.ajax({url:services.API_URL+"Error/Track?business="+business+"&section="+section,type:"POST",dataType:"json",contentType:"application/json",data:error}).success(function(response){callback(response)})},services.hookupDefaultComplete=function(dataSource){var onComplete=function(jqXHR,textStatus){textStatus==="success"?saveHistory.success():(dataSource.cancelChanges(),saveHistory.error(jqXHR.statusText))};dataSource.transport.options.create.complete=onComplete,dataSource.transport.options.update.complete=onComplete,dataSource.transport.options.destroy.complete=onComplete},services})