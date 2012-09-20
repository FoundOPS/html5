var getBrowser = function () {
    var agt=navigator.userAgent.toLowerCase();
    if (agt.indexOf("opera") != -1) return 'Opera';
    if (agt.indexOf("chrome") != -1) return 'Chrome';
    if (agt.indexOf("firefox") != -1) return 'Firefox';
    if (agt.indexOf("safari") != -1) return 'Safari';
    if (agt.indexOf("msie") != -1) return 'Internet Explorer';
    if (agt.indexOf("netscape") != -1) return 'Netscape';
    if (agt.indexOf("mozilla/5.0") != -1) return 'Mozilla';
    if (agt.indexOf('\/') != -1){
        if (agt.substr(0,agt.indexOf('\/')) != 'mozilla'){
            return navigator.userAgent.substr(0,agt.indexOf('\/'));
        } else {
            return 'Netscape';
        }
    } else if (agt.indexOf(' ') != -1){
        return navigator.userAgent.substr(0,agt.indexOf(' '));
    } else {
        return navigator.userAgent;
    }
};

var getBrowserVersion = function () {
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName  = navigator.appName;
    var fullVersion  = ''+parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion,10);
    var nameOffset,verOffset,ix;

    // In Opera, the true version is after "Opera" or after "Version"
    if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset+6);
        if ((verOffset=nAgt.indexOf("Version"))!=-1)
            fullVersion = nAgt.substring(verOffset+8);
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
        browserName = "Microsoft Internet Explorer";
        fullVersion = nAgt.substring(verOffset+5);
    }
    // In Chrome, the true version is after "Chrome"
    else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset+7);
    }
    // In Safari, the true version is after "Safari" or after "Version"
    else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset+7);
        if ((verOffset=nAgt.indexOf("Version"))!=-1)
            fullVersion = nAgt.substring(verOffset+8);
    }
    // In Firefox, the true version is after "Firefox"
    else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset+8);
    }
    // In most other browsers, "name/version" is at the end of userAgent
    else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) <
        (verOffset=nAgt.lastIndexOf('/')) )
    {
        browserName = nAgt.substring(nameOffset,verOffset);
        fullVersion = nAgt.substring(verOffset+1);
        if (browserName.toLowerCase()==browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }
    // trim the fullVersion string at semicolon/space if present
    if ((ix=fullVersion.indexOf(";"))!=-1)
        fullVersion=fullVersion.substring(0,ix);
    if ((ix=fullVersion.indexOf(" "))!=-1)
        fullVersion=fullVersion.substring(0,ix);

    majorVersion = parseInt(''+fullVersion,10);
    return majorVersion;
};

var getPlatform = function () {
    var agent = navigator.userAgent;
    var platform = navigator.platform;
    //TODO: check if Opera Mini and Opera Mobi work
    if(agent.match(/Windows NT 5.1/)){
        platform = "Windows XP";
    }else if(agent.match(/Windows NT 6.1/)){
        platform = "Windows 7";
    }else if(agent.match(/Windows/)){
        platform = "Windows";
    }else if(agent.match(/Mac/)){
        platform = "Mac";
    }else if(agent.match(/Android/)){
        platform = "Android";
    }else if(agent.match(/iPhone/)){
        platform = "iPhone";
    }else if(agent.match(/iPad/)){
        platform = "iPad";
    }else if(agent.match(/iPod/)){
        platform = "iPod";
    }else if(agent.match(/webOS/)){
        platform = "webOS";
    }else if(agent.match(/IEMobile/)){
        platform = "IEMobile";
    }else if(agent.match(/BlackBerry/)){
        platform = "BlackBerry";
    }
    return platform;
};

var getMobileVersion = function () {
    var version = "";
    var agent = navigator.userAgent;
    if(agent.match(/Android/)){
        version = agent.match(/Android\s(.*);/)[1];
        version = version.match(/(.*);/)[1];
    }

    return version;
};