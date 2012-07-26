define(["tools", "ui/notifications", "db/services", "jquery", "lib/kendo.all", "lib/jquery-ui-1.8.21.core.min",
    "lib/jquery.FileReader", "lib/swfobject", "lib/jquery.form"], function (tools, notifications, dbServices, $) {
    // shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        upload = {};

    var ImageUpload = Widget.extend({
        // method called when a new widget is created
        init: function (element, options) {
            //base call to initialize widget
            Widget.fn.init.call(this, element, options);

            ImageUpload.fn.options.uploadUrl = options.uploadUrl;
            ImageUpload.fn.options.imageWidth = options.imageWidth;
            ImageUpload.fn.options.containerWidth = options.containerWidth;

            //append the image elements
            var _imageElements = $('<img id="cropbox"/>' +
                '<a id="imageUploadButton" class="k-button k-button-icontext"><span class="k-icon k-image"></span>Upload Image</a>' +
                '<form id="imageUploadForm" enctype="multipart/form-data" method="POST">' +
                '<input type="hidden" id="imageFileName" name="imageFileName"/>' +
                '<input type="hidden" id="imageData" name="imageData"/>' +
                '</form>');

            //keep track of if a new image has been selected
            upload.newImage = false;
            upload.form = $(_imageElements[2]);
            upload.fileName = $(upload.form[0][0]);
            upload.imageButton = $(_imageElements[1]);
            upload.imageData = $(upload.form[0][1]);
            upload.cropbox = $(_imageElements[0])
                //TODO: make sure this is getting called
                .on("load", function () {
                    ImageUpload.fn._load();
                });

            //setup the FileReader on the imageUpload button
            //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
            upload.imageButton.fileReader();
            upload.imageButton.on('change', function (evt) {
                ImageUpload.fn._changeImage(evt);
            });

            this.element.append(_imageElements);
        },

        _addAjaxForm: function () {
            //setup the form
            upload.form.ajaxForm({
                //from http://stackoverflow.com/questions/8151138/ie-jquery-form-multipart-json-response-ie-tries-to-download-response
                dataType: "text",
                contentType: "multipart/form-data",
                url: ImageUpload.fn.options.uploadUrl,
                success: function (response) {
                    var url = response.replace(/['"]/g, '');
                    ImageUpload.fn.setImageUrl(url);
                },
                error: function () {
                    notifications.error("Image");
                }});
        },

        cancel: function () {
            //clear the new image data
            upload.imageData[0].value = "";
            upload.cropbox.css("width", upload.imageWidth);
            upload.cropbox.css("height", upload.imageHeight);
            tools.resizeImage(upload.cropbox, ImageUpload.fn.options.imageWidth, ImageUpload.fn.options.containerWidth);
        },

        _changeImage: function (evt) {
            var reader = new FileReader();
            reader.onload = ImageUpload.fn._fileLoaded;

            var file = evt.target.files[0];
            //check that the file is an image
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                notifications.error("File Type");
                return;
            }
            //check that the image is no larger than 10MB
            if (file.size > 5000000) {
                notifications.error("File Size");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);
            //set the form value
            upload.fileName.val(file.name);
            tools.resizeImage(upload.cropbox, ImageUpload.fn.options.imageWidth, ImageUpload.fn.options.containerWidth);
        },

        _fileLoaded: function (evt) {
            var imageData = evt.target.result;

            if (imageData == null)
                return;

            //set the source of the image element to be the newly uploaded image
            upload.cropbox.attr("src", imageData);

            //set a hidden form to the file image's data (because we stole it with FileReader)
            upload.imageData.val(imageData);

            //show the image
            upload.cropbox.css("width", "auto").css("height", "auto").css("margin-left", "0px");

            //set so that the save changes event will also save the image
            upload.newImage = true;

            tools.resizeImage(upload.cropbox, ImageUpload.fn.options.imageWidth, ImageUpload.fn.options.containerWidth);

            upload.cropbox.css("visibility", "visible");
        },

        hideImage: function () {
            upload.cropbox.css("visibility", "hidden").css("width", "0px").css("height", "0px");
        },

        _load: function () {
            tools.resizeImage(upload.cropbox, ImageUpload.fn.options.imageWidth, ImageUpload.fn.options.containerWidth);
            if (!upload.newImage) {
                upload.imageWidth = upload.cropbox[0].width;
                upload.imageHeight = upload.cropbox[0].height;
            }
        },

        setImageUrl: function (url) {
            upload.cropbox.attr("src", url);
        },

        setUploadUrl: function (url) {
            ImageUpload.fn.options.uploadUrl = url;

            ImageUpload.fn._addAjaxForm();
        },

        submitForm: function () {
            //check if image has been changed and changes have not been canceled
            if (upload.newImage && upload.imageData[0].value != "") {
                upload.form.submit();
            }
        },

        options: new kendo.data.ObservableObject({
            name: "ImageUpload",
            uploadUrl: "",
            imageWidth: 0,
            containerWidth: 0
        })
    });

    ui.plugin(ImageUpload);

    return ImageUpload.fn;
});