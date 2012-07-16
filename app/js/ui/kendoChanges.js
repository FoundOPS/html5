ops = {};
//This is a change to the kendo.all.js file.
//It is called when the current edited cell closes
ops.closeCell = function () {
    disableDefaultCheckboxes();
};
//in kendo.all.min.js, replace 'text:"Delete"' and 'text:"Edit"' with 'text:""'
//in kendo.default.min.css, change image references to be ../img/