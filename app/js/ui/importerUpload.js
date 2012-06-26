'use strict';

define(["lib/csv" , "ui/importerSelect"], function (csv, select) {
    var upload = {};

    //TODO: try to use this
    function check_file(){
        var str = document.getElementById('fileToUpload').value.toUpperCase();
        var suffix = ".csv";
        if(!(str.indexOf(suffix, str.length - suffix.length) !== -1||
            str.indexOf(suffix2, str.length - suffix2.length) !== -1)){
            alert('File type not allowed,\nAllowed file: *.jpg,*.jpeg');
            document.getElementById('fileToUpload').value='';
        }
    }

    var parse = function (file) {
        var data = csv.parseRows(file);
        var newData = [];
        //turn the array sideways, ex [{1,2,3}, {4,5,6}] becomes [{1,4}, {2,5}, {3,6}]
        //this is all under assumption that all the arrays are the same size
        //http://stackoverflow.com/questions/5971389/convert-array-of-rows-to-array-of-columns
        for(var i = 0; i < data[0].length; i++){
            newData.push([data[0][i], data[1][i]]);
        }
        select.data = newData;
    };

    upload.initialize = function () {
        //setup the FileReader on the fileUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        $("#fileUpload").fileReader({
            id: "fileReaderSWFObject",
            filereader: "../../lib/filereader.swf",
            debugMode: false,
            multiple: false,
            accept: ".csv",
            label: ".csv"
        });

        $("#fileUpload").on('change', function (evt) {
            var csvFile = evt.target.files[0];

            var reader = new FileReader();
            reader.onload = function () {
                //after the csv file has been loaded, parse it
                //TODO error checking
                parse(reader.result);
            };

            //since the csv file has been selected, read it as text
            reader.readAsText(csvFile);
        });

        var list = [
            {Name: 'Septic Pumping'},
            {Name: 'WVO'},
            {Name: 'Grease Trap'}
        ]

        //create DropDownList from input HTML element
        $("#serviceType").kendoDropDownList({
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: list
        });

        //get a reference to the DropDownList
        var color = $("#serviceType").data("kendoDropDownList");
        color.select(0);
    };

    window.upload = upload;
});