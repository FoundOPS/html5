if(!UserVoice)var UserVoice={};(!UserVoice||!UserVoice.showPopupWidget)&&function(){function getDocumentHeight(){var D=document;return Math.max(Math.max(D.body.scrollHeight,D.documentElement.scrollHeight),Math.max(D.body.offsetHeight,D.documentElement.offsetHeight),Math.max(D.body.clientHeight,D.documentElement.clientHeight))}var base64Encode=function(input){function uTF8Encode(string){string=string.replace(/\x0d\x0a/g,"\n");var output="";for(var n=0;n<string.length;n++){var c=string.charCodeAt(n);c<128?output+=String.fromCharCode(c):c>127&&c<2048?(output+=String.fromCharCode(c>>6|192),output+=String.fromCharCode(c&63|128)):(output+=String.fromCharCode(c>>12|224),output+=String.fromCharCode(c>>6&63|128),output+=String.fromCharCode(c&63|128))}return output}var keyString="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",output="",chr1,chr2,chr3,enc1,enc2,enc3,enc4,i=0;input=uTF8Encode(input);while(i<input.length)chr1=input.charCodeAt(i++),chr2=input.charCodeAt(i++),chr3=input.charCodeAt(i++),enc1=chr1>>2,enc2=(chr1&3)<<4|chr2>>4,enc3=(chr2&15)<<2|chr3>>6,enc4=chr3&63,isNaN(chr2)?enc3=enc4=64:isNaN(chr3)&&(enc4=64),output=output+keyString.charAt(enc1)+keyString.charAt(enc2)+keyString.charAt(enc3)+keyString.charAt(enc4);return output},jsonStringify=null;(function(){function f(n){return n<10?"0"+n:n}function quote(string){return escapable.lastIndex=0,escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c=="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];value&&typeof value=="object"&&typeof value.toJSON=="function"&&(value=value.toJSON(key)),typeof rep=="function"&&(value=rep.call(holder,key,value));switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value)return"null";gap+=indent,partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1)partial[i]=str(i,value)||"null";return v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]",gap=mind,v}if(rep&&typeof rep=="object"){length=rep.length;for(i=0;i<length;i+=1)k=rep[i],typeof k=="string"&&(v=str(k,value),v&&partial.push(quote(k)+(gap?": ":":")+v))}else for(k in value)Object.hasOwnProperty.call(value,k)&&(v=str(k,value),v&&partial.push(quote(k)+(gap?": ":":")+v));return v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}",gap=mind,v}}typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;jsonStringify=function(value,replacer,space){var i;gap="",indent="";if(typeof space=="number")for(i=0;i<space;i+=1)indent+=" ";else typeof space=="string"&&(indent=space);rep=replacer;if(!replacer||typeof replacer=="function"||typeof replacer=="object"&&typeof replacer.length=="number")return str("",{"":value});throw new Error("JSON.stringify")}})(),window.requestAnimationFrame||(window.requestAnimationFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(callback,element){window.setTimeout(callback,1e3/60)}}());var Wiggly=function(el){this.el=el,this.cancel=!1,this.running=!1};Wiggly.prototype.animate=function(opts,callback){function animate(){if(self.cancel)return;if(elapsed<duration)requestAnimationFrame(animate),draw();else{for(var i=0,al=animations.length;i<al;i++)self.el.style[anim.prop]=[anim.finish,"px"].join("");typeof callback=="function"&&callback()}}function draw(){start=start||+(new Date),now=+(new Date),elapsed=now-start;for(var i=0,al=animations.length;i<al;i++){var anim=animations[i],current=Math.round(easeOut(elapsed,0,anim.distance,duration));anim.current=anim.reverse?anim.start-current:anim.start+current,self.el.style[anim.prop]=[anim.current,"px"].join("")}}function easeOut(t,b,c,d){return-c*(t/=d)*(t-2)+b}this.stop(),this.cancel=!1,this.running=!0;var self=this,duration=opts.duration||1e3;delete opts.duration;var start,now,elapsed=0,animations=[];for(var key in opts){var animStart=self.el.style[key]?parseInt(self.el.style[key]):0,finish=parseInt(opts[key]),anim={prop:key,start:animStart,current:animStart,finish:finish,distance:Math.abs(finish-animStart),reverse:animStart>finish};animations.push(anim)}animate()},Wiggly.prototype.stop=function(){this.running&&(this.cancel=!0)};var isIe=!!/msie (\d+\.\d+);/.test(navigator.userAgent.toLowerCase()),isIe6=new Number(RegExp.$1)==6,isIeQuirks=isIe&&document.compatMode&&document.compatMode=="BackCompat",isTouch="ontouchstart"in window,log=function(){typeof console!="undefined"&&typeof console.log!="undefined"&&typeof console.log.apply!="undefined"&&console.log.apply(console,arguments)},append=function(original){var i,l,key;for(i=1,l=arguments.length;i<l;i++){var extended=arguments[i]||{};for(key in extended)original[key]=extended[key]}return original},render=function(template,params){return template.replace(/\#\{([^{}]*)\}/g,function(a,b){var r=params[b];return typeof r=="string"||typeof r=="number"?r:a})},insertHtml=function(html){var dummy=document.createElement("div");return dummy.innerHTML=html,document.body.insertBefore(dummy.firstChild,document.body.firstChild),document.body.firstChild},htmlentities=function(str){return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")},toQueryString=function(params){var pairs=[];for(key in params)params[key]!=null&&params[key]!=""&&typeof params[key]!="function"&&pairs.push([key,params[key]].join("="));return pairs.join("&")},includeCss=function(cssString){var styleElement=document.createElement("style");styleElement.type="text/css",styleElement.media="screen",styleElement.styleSheet?styleElement.styleSheet.cssText=cssString:styleElement.appendChild(document.createTextNode(cssString)),document.getElementsByTagName("head")[0].appendChild(styleElement)},includePrintCss=function(){var cssString="#uvTab {display:none !important;}",styleElement=document.createElement("style");styleElement.type="text/css",styleElement.media="print",styleElement.styleSheet?styleElement.styleSheet.cssText=cssString:styleElement.appendChild(document.createTextNode(cssString)),document.getElementsByTagName("head")[0].appendChild(styleElement)},htmlElement=function(){return document.getElementsByTagName("html")[0]},addClassToElement=function(element,className){element.className+=(element.className?" ":"")+className},removeClassFromElement=function(element,className){element.className=element.className.replace(new RegExp("(^|\\s+)"+className+"(\\s+|$)","g")," ")},pageDimensions=function(){var de=document.documentElement,width=window.innerWidth||de&&de.clientWidth||document.body.clientWidth,height=window.innerHeight||de&&de.clientHeight||document.body.clientHeight;return{width:width,height:height}},elementDimensions=function(element){var display=element.display;if(display!="none"&&display!=null)return{width:element.offsetWidth,height:element.offsetHeight};var els=element.style,originalVisibility=els.visibility,originalPosition=els.position,originalDisplay=els.display;els.visibility="hidden",els.position="absolute",els.display="block";var originalWidth=element.clientWidth,originalHeight=element.clientHeight;return els.display=originalDisplay,els.position=originalPosition,els.visibility=originalVisibility,{width:originalWidth,height:originalHeight}},getScrollTop=function(){var scrollTop;return typeof window.pageYOffset=="number"?scrollTop=window.pageYOffset:document.body&&document.body.scrollTop?scrollTop=document.body.scrollTop:document.documentElement&&document.documentElement.scrollTop&&(scrollTop=document.documentElement.scrollTop),scrollTop},referrer=function(){var ref=window.location.href;return ref.indexOf("?")!=-1&&(ref=ref.substring(0,ref.indexOf("?"))),encodeURIComponent(ref)},prepareOptions=function(options){var defaultOptions={key:"foundops",host:"foundops.uservoice.com",widget_key:"maYU4J6kwoDHUUVx1RbXA"},clientOptions={mode:"full",tab:{position:"middle-right",label:"feedback & support",link_color:"ffffff",inverted:!1,enabled:!1,color:"333335"}};return defaultOptions=append(defaultOptions,typeof clientOptions=="object"?clientOptions:{}),options=append(defaultOptions,typeof uvOptions!="undefined"?uvOptions:{},options||{}),options.params=options.params||{},options.sso&&(options.params.sso=options.sso),options.sess&&(options.params.sess=options.sess),options.custom_fields&&(options.params.custom_fields=options.custom_fields),options.default_mode&&(options.params.default_mode=options.default_mode),options.params.referrer=referrer(),options.params.custom_fields&&typeof options.params.custom_fields=="object"&&(options.params.custom_fields=encodeURIComponent(base64Encode(jsonStringify(options.params.custom_fields)))),options.tab=options.tab||{},options.tab=append({enabled:!0,position:"bottom-right",color:"CC6D00",label:"feedback &amp; support",inverted:!1},options.tab),options.locale&&(options.params.locale=options.locale),options},Tab={template:'<div id="uvTab" style="#{tabStyle}"><a id="uvTabLabel" style="background-color: transparent; #{linkStyle}" href="javascript:return false;"><img src="#{imgSrc}" alt="#{label}" style="border:0; background-color: transparent; padding:0; margin:0;" /></a></div>',show:function(opts){this.setOptions(opts),this.element&&this.element.parentNode.removeChild(this.element);if(this.options.enabled){var tab=this,img=new Image;img.onload=function(){tab.createElement()},img.src=tab.options.imgSrc,includePrintCss()}},createElement:function(){var tab=this,el=tab.element=insertHtml(render(tab.template,tab.options)),a=el.getElementsByTagName("a")[0];tab.animator=new Wiggly(el),tab.dimensions=elementDimensions(el),tab.rotation&&(el.style.marginTop=["-",Math.round(tab.dimensions.height/2),"px"].join("")),el.style[tab.margin]=["-",tab.rotation?tab.dimensions.width:tab.dimensions.height,"px"].join(""),el.style.display="block",a.onmouseover=a.onfocus=function(e){this.widgetInited||(Widget.init(),this.widgetInited=!0)},a.onclick=function(e){return e&&e.preventDefault(),Widget.show(),!1},isTouch&&tab.bindTouchEvents(),tab.animateOn(!1)},animateOn:function(short,callback){var tab=this;short?tab.element.style[tab.margin]="0px":tab.maximize()},minimize:function(callback){var anim={duration:200};anim[this.margin]=["-",this.dimensions.width-34,"px"].join(""),this.animator.animate(anim,callback)},maximize:function(callback){var anim={duration:200};anim[this.margin]="0px",this.animator.animate(anim,callback)},setOptions:function(opts){opts=prepareOptions(opts).tab;var posArray=/([^\-]+)-([^\-]+)/.exec(opts.position),verticalPos=posArray[1],horizontalPos=posArray[2],rotation=posArray[1]==="middle"?90:0,tabStyle=["tab-",opts.inverted?"light-":"dark-",opts.position].join(""),linkStyle=rotation?"link-vertical":"link-horizontal",assetHost=["https:"==document.location.protocol?"https://":"http://","widget.uservoice.com"].join(""),image=[assetHost,"/dcache/widget/feedback-tab.png?t=",encodeURIComponent(opts.label),"&c=",opts.inverted?encodeURIComponent(opts.color):"ffffff","&r=",encodeURIComponent(rotation),opts.inverted?"&i=yes":""].join(""),bgImage=opts.position.replace(/middle-/,"").replace(/(bottom|top)-(right|left)/,"horizontal");bgImage=[assetHost,"/images/clients/widget2/tab-",bgImage,opts.inverted?"-light":"-dark",".png"].join(""),opts.bgImage=bgImage,opts.imgSrc=image,opts.label=htmlentities(opts.label),tabStyle=tabCss[tabStyle],linkStyle=tabCss[linkStyle];if(isIe6||isIeQuirks)tabStyle+="position:absolute !important;",verticalPos==="top"?tabStyle+="top: expression(((document.documentElement.scrollTop || document.body.scrollTop) + (!this.offsetHeight && 0)) + 'px');":verticalPos==="middle"?tabStyle+="top: expression(((document.documentElement.scrollTop || document.body.scrollTop) + ((((document.documentElement.clientHeight || document.body.clientHeight) + (!this.offsetHeight && 0)) / 2) >> 0)) + 'px');":verticalPos==="bottom"&&(tabStyle+="top: expression(((document.documentElement.scrollTop || document.body.scrollTop) + (document.documentElement.clientHeight || document.body.clientHeight) - this.offsetHeight) + 'px');");opts.tabStyle=render(tabStyle,opts),opts.linkStyle=render(linkStyle,opts),this.options=opts,this.rotation=rotation,verticalPos==="bottom"?this.margin="marginBottom":verticalPos==="top"?this.margin="marginTop":horizontalPos==="right"?this.margin="marginRight":this.margin="marginLeft"},bindTouchEvents:function(){function onTouchStart(event){tab.element.style.display="none"}function onTouchEnd(event){tab.element.style.display="block"}function onScroll(event){clearTimeout(timer),timer=setTimeout(function(){tab.element.style.bottom="auto",tab.element.style.top=getTop()},100)}var top,tab=this,pos=/([^\-]+)-([^\-]+)/.exec(tab.options.position),timer,getTop;pos=pos&&pos[1]||"bottom",pos==="top"?getTop=function(){return window.pageYOffset+"px"}:pos==="middle"?getTop=function(){return Math.round(window.pageYOffset+window.innerHeight/2-tab.dimensions.width/2)+"px"}:getTop=function(){return window.pageYOffset+window.innerHeight-tab.dimensions.height+"px"},document.addEventListener("touchstart",onTouchStart,!1),document.addEventListener("touchend",onTouchEnd,!1),window.addEventListener("scroll",onScroll,!1),onScroll()}},assetHost=["https:"==document.location.protocol?"https://":"http://","widget.uservoice.com"].join(""),Widget={iframeTemplate:'<iframe id="uvw-dialog-iframe" src="#{url}?#{query}" frameBorder="0" name="uvw-iframe" style="display: block; background: #FAFBFC; border: none; -moz-border-radius: 3px; -webkit-border-radius: 3px; height: 100%; padding: none; position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%;"></iframe>',dialogTemplate:'<div class="uvOverlay1" id="#{overlay_id}" style="position: relative; visibility:hidden; z-index: 100003;"><div id="#{overlay_background_id}" style="background: #000; -ms-filter: alpha(opacity=75); filter: alpha(opacity=75); opacity: .75; position: fixed; top: 0; right: 0; bottom: 0; left: 0;"></div><div class="uvOverlay2" style="height: 100%; overflow: auto; position: fixed; top: 0; right: 0; bottom: 0; left: 0;"><div class="uvOverlay3" style="height: 100%; min-height: 550px; min-width: 900px; position: relative; width: 100%;"><div id="#{dialog_id}" style="-webkit-box-shadow: rgba(0,0,0,.5) 0 5px 5px; height: 500px; margin: -250px 0 0 -444px; position: absolute; top: 50%; left: 50%; width: 888px;"><div onclick="return UserVoice.hidePopupWidget();" id="#{dialog_close_id}" title="Close Dialog" style="z-index: 100004; background: transparent url('+assetHost+'/images/clients/widget2/close.png) 0 0 no-repeat; height: 48px; margin: 0; padding: 0; position: absolute; top: -22px; right: -24px; width: 48px;"><button style="background: none; border: none; -moz-box-shadow: none; -webkit-box-shadow: none; box-shadow: none; cursor: pointer; height: 30px; margin: 6px 0 0 9px; padding: 0; width: 30px; text-indent: -9000px;">Close Dialog</button></div>'+'<div id="#{dialog_content_id}" style="position:static; width:100%; height:100%"></div>'+'<a id="#{dialog_powered_by_id}" href="http://uservoice.com/?utm_campaign=Powered By&amp;utm_medium=widget2&amp;utm_source=foundops.uservoice.com" target="_blank" style="background: url('+assetHost+'/images/clients/widget2/powered_by.png) 0 0 no-repeat; font-size: 11px; height: 20px; position: absolute; bottom: -25px; right: 10px; text-indent: -9000px; width: 150px;">Powered by UserVoice</a>'+"</div></div></div></div>",dialog_id:"uvw-dialog",dialog_close_id:"uvw-dialog-close",dialog_powered_by_id:"uvw-dialog-powered-by",dialog_content_id:"uvw-dialog-content",overlay_id:"uvw-overlay",overlay_background_id:"uvw-overlay-background",show:function(opts){isIe6||isTouch||isIeQuirks?(this.options=prepareOptions(opts),popupUrl=this.url(),newwindow=window.open(popupUrl,"uservoice_widget","height=500,width=888,resizable=yes,scrollbars=1")):(this.init(opts),this.pokeWidgetLocationViaHash("opened"),this.overlay.style.visibility="visible",this.overlay.style.display="block",this.dialog.focus(),addClassToElement(htmlElement(),"uvw-dialog-open"))},hide:function(){this.pokeWidgetLocationViaHash(),this.overlay&&(this.overlay.style.display="none"),removeClassFromElement(htmlElement(),"uvw-dialog-open")},pokeWidgetLocationViaHash:function(kind){kind=kind||"reset";var widgetWindow=frames["uvw-iframe"];try{widgetWindow.location.href=[this.iframeSrc,(+(new Date)).toString()+kind].join("#")}catch(e){}},init:function(opts){this.options=prepareOptions(opts),this.overlay||(includeCss(dialogCss),this.overlay=insertHtml(render(this.dialogTemplate,this)));if(!this.dialog||this.dialog.getAttribute("data-widget-key")!=this.options.widget_key){var iframeOptions={url:this.url(),query:toQueryString(this.options.params)},iframeHtml=render(this.iframeTemplate,iframeOptions);this.iframeSrc=[iframeOptions.url,iframeOptions.query].join("?"),this.dialogContent=document.getElementById(this.dialog_content_id),this.dialogContent.innerHTML=iframeHtml,this.dialog=document.getElementById(this.dialog_id),this.dialog.setAttribute("data-widget-key",this.options.widget_key)}},positionDialog:function(){var dialogDimensions=elementDimensions(this.overlay),pageDims=pageDimensions(),elementStyle=this.overlay.style;elementStyle.width="auto",elementStyle.height="auto",elementStyle.left=(pageDims.width-dialogDimensions.width)/2+"px";var computedHeight=(pageDims.height-dialogDimensions.height)/2;elementStyle.top=Math.max(computedHeight,55)+"px"},url:function(){var url;return"https:"==document.location.protocol&&this.options.key!=null?url="https://"+this.options.key+".uservoice.com/clients/widgets/"+this.options.widget_key+".html":url="http://"+this.options.host+"/clients/widgets/"+this.options.widget_key+".html",url}},tabCss={"link-vertical":"display: block;padding: 39px 5px 10px 5px;text-decoration: none;","tab-dark-middle-left":"background: red url(#{bgImage}) 50% 0 no-repeat;border: 1px solid #FFF;border-left: none;-moz-border-radius: 0 4px 4px 0;-webkit-border-radius: 0 4px 4px 0;border-radius: 0 4px 4px 0;-moz-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;left: 0;top: 50%;z-index: 9999;background-color: ##{color};","tab-dark-bottom-left":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid #FFF;border-bottom: none;-moz-border-radius: 4px 4px 0 0;-webkit-border-radius: 4px 4px 0 0;border-radius: 4px 4px 0 0;-moz-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;left: 10px;bottom: 0;z-index: 9999;background-color: ##{color};","tab-light-top-right":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid red;border-top: none;-moz-border-radius: 0 0 4px 4px;-webkit-border-radius: 0 0 4px 4px;border-radius: 0 0 4px 4px;-moz-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;right: 10px;top: 0;z-index: 9999;background-color: ##{color};border-color: ##{color};","link-horizontal":"display: block;padding: 6px 10px 2px 42px;text-decoration: none;","tab-dark-middle-right":"background: red url(#{bgImage}) 50% 0 no-repeat;border: 1px solid #FFF;border-right: none;-moz-border-radius: 4px 0 0 4px;-webkit-border-radius: 4px 0 0 4px;border-radius: 4px 0 0 4px;-moz-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;right: 0;top: 50%;z-index: 9999;background-color: ##{color};","tab-light-middle-left":"background: red url(#{bgImage}) 50% 0 no-repeat;border: 1px solid red;border-left: none;-moz-border-radius: 0 4px 4px 0;-webkit-border-radius: 0 4px 4px 0;border-radius: 0 4px 4px 0;-moz-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;left: 0;top: 50%;z-index: 9999;background-color: ##{color};border-color: ##{color};","tab-light-top-left":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid red;border-top: none;-moz-border-radius: 0 0 4px 4px;-webkit-border-radius: 0 0 4px 4px;border-radius: 0 0 4px 4px;-moz-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;left: 10px;top: 0;z-index: 9999;background-color: ##{color};border-color: ##{color};","tab-dark-top-right":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid #FFF;border-top: none;-moz-border-radius: 0 0 4px 4px;-webkit-border-radius: 0 0 4px 4px;border-radius: 0 0 4px 4px;-moz-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;right: 10px;top: 0;z-index: 9999;background-color: ##{color};","tab-dark-bottom-right":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid #FFF;border-bottom: none;-moz-border-radius: 4px 4px 0 0;-webkit-border-radius: 4px 4px 0 0;border-radius: 4px 4px 0 0;-moz-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;right: 10px;bottom: 0;z-index: 9999;background-color: ##{color};","tab-light-bottom-left":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid red;border-bottom: none;-moz-border-radius: 4px 4px 0 0;-webkit-border-radius: 4px 4px 0 0;border-radius: 4px 4px 0 0;-moz-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;left: 10px;bottom: 0;z-index: 9999;background-color: ##{color};border-color: ##{color};","tab-light-bottom-right":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid red;border-bottom: none;-moz-border-radius: 4px 4px 0 0;-webkit-border-radius: 4px 4px 0 0;border-radius: 4px 4px 0 0;-moz-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;right: 10px;bottom: 0;z-index: 9999;background-color: ##{color};border-color: ##{color};","tab-light-middle-right":"background: red url(#{bgImage}) 50% 0 no-repeat;border: 1px solid red;border-right: none;-moz-border-radius: 4px 0 0 4px;-webkit-border-radius: 4px 0 0 4px;border-radius: 4px 0 0 4px;-moz-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.9) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;right: 0;top: 50%;z-index: 9999;background-color: ##{color};border-color: ##{color};","tab-dark-top-left":"background: red url(#{bgImage}) 0 50% no-repeat;border: 1px solid #FFF;border-top: none;-moz-border-radius: 0 0 4px 4px;-webkit-border-radius: 0 0 4px 4px;border-radius: 0 0 4px 4px;-moz-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;-webkit-box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;box-shadow: inset rgba(255,255,255,.25) 1px 1px 1px, rgba(0,0,0,.5) 0 1px 2px;font: normal normal bold 14px/1em Arial, sans-serif;position: fixed;left: 10px;top: 0;z-index: 9999;background-color: ##{color};"},dialogCss="    html.uvw-dialog-open object,    html.uvw-dialog-open iframe,    html.uvw-dialog-open embed {      visibility: hidden;    }    html.uvw-dialog-open iframe#uvw-dialog-iframe {      visibility: visible;    }    ";UserVoice.showPopupWidget=function(opts){Widget.show(opts)},UserVoice.hidePopupWidget=function(){return Widget.hide(),!1},UserVoice.showTab=function(opts){}}()