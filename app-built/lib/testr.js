/**
 * testr.js 1.0.2
 * https://www.github.com/mattfysh/testr.js
 * Distributed under the MIT license
 */

var testr,define;(function(){function isArray(a){return toString.call(a)=="[object Array]"}function isObject(o){return typeof o=="object"&&!isArray(o)}function deepCopy(src){var tgt=isObject(src)?{}:[];return each(src,function(val,key){tgt[key]=isArray(val)||isObject(val)?deepCopy(val):val}),tgt}function each(items,callback){if(!items)return;if(typeof items.length=="number")for(var i=0;i<items.length;i+=1)callback(items[i],i);else if(isObject(items))for(var prop in items)items.hasOwnProperty(prop)&&callback(items[prop],prop)}function normalize(path,contextReq){return path.indexOf("!")===-1?contextReq(path):(path=path.split("!"),path[1]&&(path[1]=contextReq.toUrl(path[1]).substring(baseUrl.length)),path.join("!"))}function buildModule(moduleName,stubs,useExternal,subject){var depModules=[],exports={},moduleDef,factory,deps,contextReq,getModule=function(depName){return stubs&&stubs[depName]||buildModule(depName,stubs,useExternal)};moduleDef=!subject&&useExternal&&moduleMap["stub/"+moduleName+".stub"]||moduleMap[moduleName];if(!moduleDef)try{return require(moduleName)}catch(e){throw new Error("module has not been loaded: "+moduleName)}return factory=moduleDef.factory,deps=moduleDef.deps,contextReq=moduleDef.require,subject&&each(stubs,function(stub,path){var nPath=normalize(path,contextReq);nPath!==path&&(stubs[nPath]=stub,delete stubs[path])}),each(deps,function(dep){dep=="exports"?dep=exports:dep==="require"?dep=function(path){return getModule(normalize(path,contextReq))}:dep=getModule(dep),depModules.push(dep)}),typeof factory!="function"?deepCopy(factory):factory.apply(exports,depModules)||exports}var version="1.0.2",origDefine=define,cjsRequireRegExp=/require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,noop=function(){},moduleMap=window.mm={},pluginPaths={},baseUrl=require.toUrl(".").replace(/\.$/,""),config={autoLoad:!1};define=function(){function trojan(contextReq,module){var offset=2,deps=[].slice.call(arguments,offset);if(!module||pluginPaths[module.id])return typeof factory=="function"?factory.apply(null,deps):factory;each(pluginLocs,function(loc){var path=depPaths[loc+offset];deps[loc]=normalize(path,contextReq)}),each(exportsLocs,function(loc){deps[loc]="exports"}),each(requireLocs,function(loc){deps[loc]="require"}),moduleMap[module.id]={factory:factory,deps:wrap?["require","exports"]:deps,require:contextReq};if(module.uri.indexOf("./stub")===0)return;return config.autoLoad&&require({context:module.id,baseUrl:".",deps:["stub/"+module.id+".stub","spec/"+module.id+".spec"]}),module.id}var args=[].slice.call(arguments),factory=args.pop(),deps=args.pop(),name=args.pop(),depPaths=["require","module"],extractedPaths=[],pluginLocs=[],exportsLocs=[],requireLocs=[],wrap=!deps&&typeof factory=="function",defineArgs;typeof deps=="string"&&(name=deps,deps=[]),each(deps,function(path,index){path.indexOf("!")>-1?(pluginPaths[path.split("!")[0]]=!0,pluginLocs.push(index)):path==="exports"?exportsLocs.push(index):path==="require"&&requireLocs.push(index),depPaths.push(path)}),deps||factory.toString().replace(cjsRequireRegExp,function(match,dep){extractedPaths.push(dep)}),!extractedPaths.length,defineArgs=[depPaths.concat(extractedPaths),trojan],name&&defineArgs.unshift(name),origDefine.apply(null,defineArgs),name&&require([name])},define.amd=origDefine.amd,testr=function(moduleName,stubs,useExternal){if(typeof moduleName!="string")throw Error("module name must be a string");if(!useExternal&&typeof stubs=="boolean")useExternal=stubs,stubs={};else if(stubs&&!isObject(stubs))throw Error("stubs must be given as an object");return buildModule(moduleName,stubs,useExternal,!0)},testr.config=function(userConfig){each(userConfig,function(val,key){config[key]=val})},testr.version=version})()