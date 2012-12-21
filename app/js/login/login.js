//Enables accessing data from external resources.
$.support.cors = true;

var appLocation = "http://app.foundops.com";


//Serves as a dual purpose ajax call that either logs a user in or checks whether a user is logged in and acts accordingly.
var login = function (url, requestType, loginType) {
    if (localStorage.getItem("loggedIn") === "true" || url !== "") {
        $.ajax({
            type: requestType,
            dataType:'JSON',
            url:'http://api.foundops.com/api/sessions' + url,
            tryCount:0,
            retryLimit:2,
            timeout:1667, // 5/3 of a second so total time will be 5 seconds because of automatic retry.
            success:function (response) {
                if (response) {
                    //Save the application's login state.
                    localStorage.setItem("loggedIn", true);
                    window.location.href = appLocation; //Grunt replaces appLocation on build.
                } else if (loginType !== "startUpCheck") {
                    alert("Login information is incorrect.\nPlease try again.");
                }
            },
            error:function (jqXHR, textStatus, errorThrown) {
                // In case of timeout, retry call up to the amount of times specified by the retryLimit.
                if (textStatus === 'timeout') {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //Try again
                        $.ajax(this);
                    } else if (this.tryCount = this.retryLimit && loginType === "userLogin") {
                        alert("Your login request has timed out. Please check your network settings or internet connectivity.");
                    }
                } else {
                    console.log(jqXHR);
                    console.log(textStatus);
                    console.log(errorThrown);
                }
            }
        });
    }
};

// Stores a user's email address in local storage if he or she has turned on the Remember Me option.
// Forgets him/her otherwise.
var rememberMe = function () {
    if ($(".on").hasClass("active")) {
        localStorage.setItem("rememberMe", true);
        localStorage.setItem("email", $("#EmailAddress").val());
    } else {
        localStorage.setItem("rememberMe", false);
        localStorage.removeItem("email");
    }
};
// Changes the styles of the Remember Me buttons to reflect the user's selection.
var toggleRememberMe = function (state) {
    if (state === "on") {
        $(".on").addClass("active");
        $(".off").removeClass("active");
        rememberMe();
    } else {
        $(".on").removeClass("active");
        $(".off").addClass("active");
        rememberMe();
    }
};

$(document).ready(function () {
    //Check if user is remembered.
    if (localStorage.getItem("rememberMe") === "true") {
        $("#EmailAddress").val(localStorage.getItem("email"));
        toggleRememberMe("on");
    }
    //Check if user is already logged in.
    login("", "GET", "startUpCheck");
});

//Overrides the submit event of the login form to make an ajax call instead.
$("#loginForm").submit(function (e) {
    e.preventDefault();
    rememberMe();
    login('?email=' + $("#EmailAddress").val() + '&pass=' + $("#Password").val(), "PUT", "userLogin");
});

// Listeners that change styles to show Login button press animation.
$("#submit").mousedown(function (e) {
    $("#submit").toggleClass("buttonClicked");
}).mouseup(function (e) {
        $("#submit").toggleClass("buttonClicked");
    });

document.getElementById("submit").addEventListener('touchstart', function (e) {
    $("#submit").toggleClass("buttonClicked");
})
document.getElementById("submit").addEventListener('touchend', function (e) {
    $("#submit").toggleClass("buttonClicked");
})
document.getElementById("submit").addEventListener('touchcancel', function (e) {
    $("#submit").toggleClass("buttonClicked");
});