//CONSTANTS

//A flag set to true when debuging in a browser.
var DEBUG = true;

//The API url.
var APIURL;

if (DEBUG)
    APIURL = "http://localhost:9711";
else
    APIURL = "http://api.foundops.com";

//COMMON FUNCTIONS

//slices the variables out of the URL and returns an array of all the variables
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}