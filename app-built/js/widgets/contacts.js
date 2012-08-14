define(["jquery","lib/kendo.all","underscore"],function($){var kendo=window.kendo,mobile=kendo.mobile,ui=mobile.ui,Widget=ui.Widget,DATABINDING="dataBinding",DATABOUND="dataBound",elementTemplate='<div><p style="top:10px; margin-bottom: -5px;">Contacts</p><hr style="width:90%;"/></div>',listViewTemplate="<ul></ul>",emailTemplate='<a data-rel="external" href="mailto:${Data}">E-mail ${Label}<br/><p id="contactData">${Data}</p></a>',phoneTemplate='<a data-rel="external" href="tel:${Data}">Call ${Label}<br/><p id="contactData">${Data}</p></a>',websiteTemplate='<a data-rel="external" href="http://${Data}">Go to Website<br/><p id="contactData">${Data}</p></a>',Contacts=Widget.extend({init:function(element,options){var that=this;Widget.fn.init.call(that,element,options),that.render(options.contacts)},events:[DATABINDING,DATABOUND],items:function(){return this.element.children()},render:function(contacts){var that=this;that.trigger(DATABINDING),that.element.empty();var element=$(elementTemplate).appendTo(that.element);if(contacts){var emailContacts=[],phoneContacts=[],websiteContacts=[];_.each(contacts,function(value){switch(value.Type){case"Email Address":emailContacts.push(value);break;case"Phone Number":phoneContacts.push(value);break;case"Website":websiteContacts.push(value)}}),$(listViewTemplate).appendTo(element).kendoMobileListView({template:phoneTemplate,dataSource:phoneContacts,style:"inset"}),$(listViewTemplate).appendTo(element).kendoMobileListView({template:emailTemplate,dataSource:emailContacts,style:"inset"}),$(listViewTemplate).appendTo(element).kendoMobileListView({template:websiteTemplate,dataSource:websiteContacts,style:"inset"}),that.trigger(DATABOUND)}},options:{name:"Contacts"}});ui.plugin(Contacts),kendo.data.binders.widget.contacts=kendo.data.Binder.extend({init:function(element,bindings,options){kendo.data.Binder.fn.init.call(this,element,bindings,options)},refresh:function(e){var contacts=this.bindings.contacts.get();this.element&&this.element.render(contacts)}})})