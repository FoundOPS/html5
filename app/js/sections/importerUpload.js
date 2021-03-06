'use strict';

define(["db/services", "widgets/selectBox"], function (dbServices) {
    var importerUpload = {};

    //checks for .csv file type
    var checkFileType = function (file) {
        if (!file.name.match(/(.*\.csv$)/)) {
            alert("Only .CSV files types allowed!");
            return false;
        }
        return true;
    };

    importerUpload.initialize = function () {
        //setup the FileReader on the fileUpload button
        //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
        var uploadButton = $("#importerUpload").find("#styledUploadBtn");
        uploadButton.fileReader({
            id: "fileReaderSWFObject",
            debugMode: false,
            multiple: false
        });

        //when new file is selected
        uploadButton.on('change', function (evt) {
            var csvFile = evt.target.files[0];
            //if file is a .csv
            if (checkFileType(csvFile)) {
                var reader = new FileReader();
                reader.onload = function () {
                    //after the csv file has been loaded, parse it
                    //TODO error checking
                    importerUpload.uploadedData = csv.parseRows(reader.result);
                };
            }
            //since the csv file has been selected, read it as text
            reader.readAsText(csvFile);
            $("#importerUpload").find("#fileName").text(csvFile.name);
            $("#importerUpload").find("#uploadBtn").removeAttr('disabled');
        });

        //get the available service templates
        dbServices.serviceTemplates.read().done(function (serviceTypes) {
            //create the service types dropdown
            $("#importerUpload").find("#serviceType").selectBox({
                data: serviceTypes,
                dataTextField: "Name",
                //listen to change event of the serviceType dropdown
                onSelect: function (selectedService) {
                    importerUpload.selectedService = selectedService;
                }
            });

            importerUpload.selectedService = serviceTypes[0];
        });
    };

    window.importerUpload = importerUpload;

    return importerUpload;
});