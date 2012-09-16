// Copyright 2012 FoundOPS LLC. All Rights Reserved.

define(["tools","db/session","db/services"],function(tools,session,dbServices){var kendoTools={};kendoTools.storeConfiguration=function(grid,id){var saveConfiguration=function(){kendoTools._saveConfigurations(grid.columns,id)};grid.bind("columnReorder",saveConfiguration),grid.bind("columnResize",saveConfiguration),grid.bind("columnShow",saveConfiguration),grid.bind("columnHide",saveConfiguration)},kendoTools._saveConfigurations=_.debounce(function(gridColumns,id){var columnConfiguration={Id:id,Columns:[]},order=0;_.each(gridColumns,function(gridColumn){var storedColumn={};storedColumn.Name=gridColumn.field,storedColumn.Width=gridColumn.width,storedColumn.Order=order,order++,storedColumn.Hidden=gridColumn.hidden,columnConfiguration.Columns.push(storedColumn)});var newConfigurations=_.reject(kendoTools._columnConfigurations,function(config){return config.Id===id});newConfigurations.push(columnConfiguration),kendoTools._columnConfigurations=newConfigurations,dbServices.updateColumnConfigurations(newConfigurations)},300),kendoTools.configureColumns=function(gridColumns,id){var configuration=_.find(kendoTools._columnConfigurations,function(configuration){return configuration.Id===id}),storedColumns=[];configuration&&(storedColumns=configuration.Columns),_.each(gridColumns,function(column){var storedColumn=_.find(storedColumns,function(col){return col.Name===column.field});storedColumn&&(storedColumn.Width.indexOf("px")===-1&&(storedColumn.Width+="px"),column.width=storedColumn.Width,column.hidden=storedColumn.Hidden,column.order=storedColumn.Order)});var storedCols=_.pluck(storedColumns,"Name"),gridCols=_.pluck(gridColumns,"field");return(_.difference(storedCols,gridCols).length>0||_.difference(gridCols,storedCols).length>0)&&kendoTools._saveConfigurations(gridColumns,id),gridColumns=_.sortBy(gridColumns,function(column){return"order"in column?parseInt(column.order):100}),gridColumns},session.followRole(function(){dbServices.getColumnConfigurations(function(configurations){kendoTools._columnConfigurations=configurations})}),kendoTools.toCSV=function(data,fileName,humanize,ignore){var csv="";ignore||(ignore=[]),ignore=_.union(ignore,["_events","idField","_defaultId","constructor","init","get","_set","wrap","bind","one","first","trigger","unbind","uid","dirty","id","parent"]);if(_.any(data)){var firstRow=_.first(data),firstValue=!0;_.each(firstRow,function(value,key){if(_.include(ignore,key))return;humanize&&(key=key.split("_").join(" ").replace(/([A-Z])/g," $1")),key=key.replace(/"/g,'""'),key=$.trim(key),firstValue||(csv+=","),csv+='"'+key+'"',firstValue=!1}),csv+="\n"}return _.each(data,function(row){firstValue=!0,_.each(row,function(value,key){if(_.include(ignore,key))return;value===null?value="":value instanceof Date?value=moment(value).format("MM/D/YYYY"):value!==undefined?value=value.toString():value="",value=value.replace(/"/g,'""'),firstValue||(csv+=","),csv+='"'+value+'"',firstValue=!1}),csv+="\n"}),csv};var filterMatchRegEx=/^f_(lt|lte|eq|neq|gt|gte|startswith|endswith|contains|doesnotcontain)_.*$/,filterName=function(parameter){var matches=parameter.match(filterMatchRegEx);return matches===null?null:parameter.substring(3+matches[1].length)},filterOperator=function(parameter){var matches=parameter.match(filterMatchRegEx);return matches===null?null:matches[1]};return kendoTools.addFilterEvent=function(dataSource){dataSource.originalFilter=dataSource.filter;var filtered=_.debounce(function(args){dataSource.trigger("filtered",args)},200);dataSource.filter=function(){var filter=dataSource.originalFilter.apply(dataSource,arguments);return arguments.length>0&&filtered(arguments),filter}},kendoTools.updateHashToFilters=function(section,dataSource){var filterSet=dataSource.filter().filters,currentParams=tools.getParameters(),otherKeys=_.filter(_.keys(currentParams),function(name){return filterName(name)===null}),query=_.pick(currentParams,otherKeys);_.each(filterSet,function(filter){filter.filters&&(filter=filter.filters);var type,val=filter.value;val instanceof Date?(type="d",val=val.toDateString()):typeof val=="number"?type="n":type="s";var key="f_"+filter.operator+"_"+filter.field;query[key]=val+"$"+type}),main.setHash(section,query)},kendoTools.updateFiltersToHash=function(dataSource,parameters,processFilters){if(!dataSource)return;var filterSet=[];_.each(parameters,function(value,parameter){var name=filterName(parameter);if(name===null)return;var filter=value.split("$"),formattedValue;filter[1]==="d"?formattedValue=new Date(filter[0]):filter[1]==="n"?formattedValue=parseFloat(filter[0]):formattedValue=filter[0];var operator=filterOperator(parameter);filterSet.push({field:name,operator:operator,value:formattedValue})});if(processFilters){var newFilterSet=processFilters(filterSet);if(newFilterSet){dataSource.filter(newFilterSet);return}}var existing=dataSource.filter();existing||(existing={}),existing.filters&&(existing=existing.filters);var same=_.isEqual(filterSet,existing);same||dataSource.filter(filterSet)},kendoTools})