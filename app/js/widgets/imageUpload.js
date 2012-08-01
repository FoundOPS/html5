define(["tools", "ui/saveHistory", "db/services", "jquery", "lib/kendo.all", "lib/jquery-ui-1.8.21.core.min",
    "lib/jquery.FileReader", "lib/swfobject", "lib/jquery.form"], function (tools, saveHistory, dbServices, $) {
    // shorten references to variables. this is better for uglification
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        template =
            '<img class="imageupload-cropbox"/>' +
                '<a class="k-button k-button-icontext imageupload-button"><span class="k-icon k-image"></span>Upload Image</a>' +
                '<form enctype="multipart/form-data" method="POST">' +
                '<input type="hidden" name="imageFileName"/>' +
                '<input type="hidden" name="imageData"/>' +
                '</form>';

    var ImageUpload = Widget.extend({
        init: function (element, options) {
            var that = this, templateElement, form, imageUploadButton;

            Widget.fn.init.call(that, element, options);

            templateElement = $(template);

            that.cropBox = $(templateElement[0]);
            that.form = $(templateElement[2]);
            that.imageFileNameField = templateElement.find("input[name=imageFileName]");
            that.imageDataField = templateElement.find("input[name=imageData]");

            //track if the image has changed
            that.newImage = false;

            that.cropBox.on("load", function () {
                tools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
            });

            //setup the FileReader on the imageUpload button
            //this will enable the flash FileReader polyfill from https://github.com/Jahdrien/FileReader
            imageUploadButton = $(templateElement[1]);
            imageUploadButton.fileReader();
            imageUploadButton.on('change', function (evt) {
                that._changeImage(evt);
            });

            that.element.append(templateElement);
        },
        cancel: function () {
            var that = this;
            //clear the new image data
            that.imageDataField.val("");
            if (that.imageUrl) {
                that.setImageUrl(that.imageUrl);
            }
            that.newImage = false;
            tools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
        },

        _changeImage: function (evt) {
            var that = this;

            var reader = new FileReader();
            reader.onload = function (evt) {
                var imageData = evt.target.result;

                if (imageData === null) {
                    return;
                }

                //set the source of the image element to be the newly uploaded image
                that.cropBox.attr("src", imageData);

                //set the form's imageData to the file image's data
                that.imageDataField.val(imageData);

                //show the image
                that.cropBox.css("visibility", "visible").css("width", "auto").css("height", "auto");

                //set so that the save changes event will also save the image
                that.newImage = true;
                tools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
                saveHistory.save();
            };

            var file = evt.target.files[0];
            //check that the file is an image
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                saveHistory.error("File Type");
                return;
            }
            //check that the image is no larger than 10MB
            if (file.size > 5000000) {
                saveHistory.error("File Size");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);

            //set the form value
            that.imageFileNameField.val(file.name);
            tools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
        },

        setUploadUrl: function (url) {
            this.options.uploadUrl = url;
        },

        submitForm: function () {
            var that = this;
            //check if image has been changed, and image data was set
            if (that.newImage && that.imageDataField.val() !== "") {
                that.form.ajaxSubmit({
                    //from http://stackoverflow.com/questions/8151138/ie-jquery-form-multipart-json-response-ie-tries-to-download-response
                    dataType: "text",
                    contentType: "multipart/form-data",
                    url: that.options.uploadUrl,
                    success: function (response) {
                        //get rid of the quotes, then set the image url
                        var url = response.replace(/['"]/g, '');
                        that.setImageUrl(url);
                        that.newImage = false;
                    },
                    error: function () {
                        saveHistory.error("Image");
                    }
                });
            }
        },
        setImageUrl: function (imageUrl) {
            //store the current image url
            this.imageUrl = imageUrl;
            this.cropBox.attr("src", imageUrl);
        },
        options: new kendo.data.ObservableObject({
            name: "ImageUpload",
            uploadUrl: "",
            imageWidth: 200,
            containerWidth: 500
        })
    });

    ui.plugin(ImageUpload);
});