function __totango(id) {
    this.sid = id;
    this.track = function track(activity, module, org, user) {
        var account = this.getAccount(org);
        var org_name = null, org_fid = null, org_dn = null, attributes = null;
        org_name = encodeURIComponent(account.id);
        org_dn = encodeURIComponent(account.name);
        org_fid = encodeURIComponent(account.fid);
        attributes = (account.attributes || "");

        user = encodeURIComponent(user || this.getUser());
        activity = encodeURIComponent(activity);
        module = encodeURIComponent(module);

        var proto = (("https:" == document.location.protocol) ? "https://" : "http://");
        var img = new Image();
        img.src = proto + "sdr.totango.com/pixel.gif/?sdr_s=" + this.sid + "&sdr_o=" + org_name + "&sdr_ofid=" + org_fid + "&sdr_u=" + user	+ "&sdr_a=" + activity + "&sdr_m=" + module + "&sdr_odn=" + org_dn + attributes  + "&r=" + Math.random();
        this.savecookie("totango.org_attributes", "", 0);
        return img;
    }
    this.identify = function identify(org, user) {
        var account = this.getAccount(org);
        this.savecookie("totango.org_name", account.id, 1);
        this.savecookie("totango.user", user, 1);
        this.savecookie("totango.org_dn", account.name, 1);
        this.savecookie("totango.org_ofid", account.fid, 1);

        if (null != account.id && null != account.attributes && "" != account.attributes) {
            return this.track(null, null, account, user);
        } else if (null != account.attributes) {
            this.savecookie("totango.org_attributes", account.attributes, 180);
            return null;
        }
    }
    this.setAccountAttributes = function setAccountAttributes(org) {
        var account = this.getAccount(org);

        if (null != account.id && null != account.attributes && "" != account.attributes) {
            return this.track(null, null, account, null);
        } else {
            this.savecookie("totango.org_attributes", account.attributes, 1);
            return null;
        }
    }
    this.getAccount = function getAccount(org) {
        var org_name = null, org_fid = null, org_dn = null;
        var attributes = null;
        if ("object" == typeof org){
            for (attributeKey in org) {
                if (attributeKey == 'o' || attributeKey == 'id') {
                    org_name = org[attributeKey];
                } else if (attributeKey == 'ofid' || attributeKey == 'fid') {
                    org_fid = org[attributeKey];
                } else if (attributeKey == 'odn' || attributeKey == 'name') {
                    org_dn = org[attributeKey];
                } else if (attributeKey == 'attributes' ) {
                    if(null == attributes){
                        attributes = "";
                    }
                    attributes += org[attributeKey];
                }else if (attributeKey != 'attributes' ) {
                    if(null == attributes){
                        attributes = "";
                    }
                    attributes = '&sdr_o.' + encodeURIComponent(attributeKey) + "=" + encodeURIComponent(org[attributeKey])+ attributes;
                }
            }
        }else{
            org_name = org;
        }
        var cookieAttributes = this.getAttributesCookie();
        if(null != cookieAttributes && (cookieAttributes.indexOf(attributes) == -1))	{
            attributes = (attributes || "") + cookieAttributes;
        }

        var result = new Object();
        result.id = (org_name || this.getOrg());
        result.fid = (org_fid || this.getOrgId());
        result.name = (org_dn || this.getOrgDisplayName());
        result.attributes = attributes;
        return result;
    }
    this.getAttributesCookie = function getAttributesCookie() {
        return this.readcookie("totango.org_attributes");
    }
    this.getOrgId = function getOrgId() {
        return this.readcookie("totango.org_ofid");
    }
    this.getOrgDisplayName = function getOrgDisplayName() {
        return this.readcookie("totango.org_dn");
    }
    this.getOrg = function getOrg() {
        return this.readcookie("totango.org_name");
    }
    this.getUser = function getUser() {
        return this.readcookie("totango.user");
    }
    this.savecookie = function savecookie(name, value, days) {
        var date = new Date();
        date.setTime(date.getTime() + (((typeof (days) != "undefined") ? days : 3) * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
        document.cookie = name + "=" + value + expires + "; path=/";
    }
    this.readcookie = function readcookie(name) {
        var re = new RegExp("(?:^| )" + name + "=([^;]*)", "i");
        var matches = document.cookie.match(re);
        return (matches && matches.length == 2) ? matches[1] : null;
    }
    this.clear = function clear() {
        this.savecookie("totango.org_attributes","",0);
        this.savecookie("totango.org_dn","",0);
        this.savecookie("totango.org_name","",0);
        this.savecookie("totango.org_ofid","",0);
        this.savecookie("totango.user","",0);
    }
}