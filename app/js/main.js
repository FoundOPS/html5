require.config({
    baseUrl: 'js',
    paths: {
        lib: "../lib"
    }
});

require(["containers/navigator", "lib/kendo.all.min"], function (Navigator) {
    var initData = {
        name: "Jordan Kelly",
        avatarUrl: "./img/david.png",
        businessLogoUrl: "./img/got-grease-logo.png",
        roles: [
            {name: "FoundOPS", id: "23144-24242-242442"},
            {name: "GotGrease", id: "95838-24242-242442"},
            {name: "AB Couriers", id: "64729-24242-242442"}
        ],
        sections: [
            {name: "Employees", url: "#Employees", color: "red", iconUrl: "img/employees.png"},
            {name: "Routes", url: "#Routes", color: "green", iconUrl: "./img/routes.png"},
            {name: "Regions", url: "#Regions", color: "orange", iconUrl: "./img/regions.png"},
            {name: "Vehicles", url: "#Vehicles", color: "red", iconUrl: "./img/vehicles.png"}/*,
             {name:"Logout", url:"#logout", color:"black", iconUrl:"./img/logout.png"}*/
        ]
    };

    //setup the navigator
    var n = new Navigator(initData);
    n.hideSearch();

    //setup the application
    new kendo.mobile.Application($("#content"), { initial: "views/testContent.html"});
});