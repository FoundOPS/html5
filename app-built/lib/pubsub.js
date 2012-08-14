/*	

	jQuery pub/sub plugin by Peter Higgins (dante@dojotoolkit.org)

	Loosely based on Dojo publish/subscribe API, limited in scope. Rewritten blindly.

	Original is (c) Dojo Foundation 2004-2010. Released under either AFL or new BSD, see:
	http://dojofoundation.org/license for more information.

*/

(function(d){var cache={};d.publish=function(topic,args){cache[topic]&&d.each(cache[topic],function(){this.apply(d,args||[])})},d.subscribe=function(topic,callback){return cache[topic]||(cache[topic]=[]),cache[topic].push(callback),[topic,callback]},d.unsubscribe=function(handle){var t=handle[0];cache[t]&&d.each(cache[t],function(idx){this==handle[1]&&cache[t].splice(idx,1)})}})(jQuery)