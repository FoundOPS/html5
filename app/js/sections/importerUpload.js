'use strict';

define(["lib/csv", "db/services", "lib/jquery-ui-1.8.21.core.min", "lib/jquery.FileReader", "lib/swfobject"], function (csv, dbServices) {
    var importerUpload = {};

    //checks for .csv file type
    var checkFileType = function (file){
        if(!file.name.match(/(.*\.csv$)/)){
            alert("Only .CSV files types allowed!");
            return false;
        }
        return true;
    };

    var parse = function (file) {
        var data = csv.parseRows(file);
        //save this data for later use
        importerUpload.oldData = data;
        //turn the array sideways, ex [{1,2,3}, {4,5,6}] becomes [{1,4}, {2,5}, {3,6}]
        //this is all under assumption that all the arrays are the same size
        //http://stackoverflow.com/questions/5971389/convert-array-of-rows-to-array-of-columns
        var newData = [];
        for(var i = 0; i < data[0].length; i++){
            newData.push([data[0][i], data[1][i]]);
        }
        importerUpload.data = newData;
    };

    importerUpload.initialize = function () {
        //setup the FileReader on the fileUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        $("#fileUpload").fileReader({
            id: "fileReaderSWFObject",
            filereader: "../../lib/filereader.swf",
            debugMode: false,
            multiple: false
        });

        $("#fileUpload").on('change', function (evt) {
            var csvFile = evt.target.files[0];
            //if file is a .csv
            if(checkFileType(csvFile)){
                var reader = new FileReader();
                reader.onload = function () {
                    //after the csv file has been loaded, parse it
                    //TODO error checking
                    parse(reader.result);
                };
            }
            //since the csv file has been selected, read it as text
            reader.readAsText(csvFile);
            $('#fileName').text(csvFile.name);
            $('#uploadBtn').removeAttr('disabled');
        });

        dbServices.getServiceTypes(function (serviceTypes) {
            //create the service types dropdown
            importerUpload.serviceTypeDropDown = $("#serviceType").kendoDropDownList({
                dataTextField: "Name",
                dataValueField: "Id",
                dataSource: serviceTypes
            }).data("kendoDropDownList");

            importerUpload.selectedService = importerUpload.serviceTypeDropDown._current[0].innerText;
        });

        //listen to change event of the serviceType dropdown
        $("#serviceType").on("change", function () {
            importerUpload.selectedService = importerUpload.serviceTypeDropDown._current[0].innerText;
        });
    };

    window.importerUpload = importerUpload;

    return importerUpload;
});