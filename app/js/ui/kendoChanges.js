ops = {};
//This is a change to the kendo.all.js file.
//It is called when the current edited cell closes
ops.closeCell = function () {
    disableDefaultCheckboxes();
};