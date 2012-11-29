'use strict';

define(["jquery", "lib/csv", "db/services", "widgets/selectBox", "jui", "jfilereader", "lib/swfobject"], function ($, csv, dbServices) {
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
        importerUpload.uploadedData = data;

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
        $("#importerUpload #styledUploadBtn").fileReader({
            id: "fileReaderSWFObject",
            filereader: "lib/filereader.swf",
            debugMode: false,
            multiple: false
        });

        $("#importerUpload #styledUploadBtn").on('change', function (evt) {
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
            $('#importerUpload #fileName').text(csvFile.name);
            $('#importerUpload #uploadBtn').removeAttr('disabled');
        });

//        $("#importerUpload #styledUploadBtn").on("click", function () {
//            $("#importerUpload #fileUpload").fileReader().start();
//        });

        //listen to change event of the serviceType dropdown
        var onSelect = function (selectedService) {
            importerUpload.selectedService = {Id: selectedService.value, Name: selectedService.name};
        };

        dbServices.serviceTemplates.read().done(function (serviceTypes) {
            //create the service types dropdown
            $("#importerUpload #serviceType").selectBox({data: serviceTypes, dataTextField: "Name", onSelect: onSelect});

            importerUpload.selectedService = serviceTypes[0];
        });
    };

    window.importerUpload = importerUpload;

    return importerUpload;
});