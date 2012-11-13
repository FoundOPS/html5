define(["tools/generalTools", "db/saveHistory", "db/services", "jquery", "kendo", "jui",
    "jfilereader", "lib/swfobject", "jform"], function (generalTools, saveHistory, dbServices, $) {
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
            var that = this, templateElement, imageUploadButton;

            Widget.fn.init.call(that, element, options);

            templateElement = $(template);

            that.cropBox = $(templateElement[0]);
            that.form = $(templateElement[2]);
            that.imageFileNameField = templateElement.find("input[name=imageFileName]");
            that.imageDataField = templateElement.find("input[name=imageData]");

            //track if the image has changed
            that.newImage = false;

            that.cropBox.on("load", function () {
                generalTools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
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

                that.newImage = true;
                generalTools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
                that.submitForm();
            };

            var file = evt.target.files[0];
            //check that the file is an image
            if (!file.name.match(/(.*\.png$)/) && !file.name.match(/(.*\.jpg$)/) && !file.name.match(/(.*\.JPG$)/) && !file.name.match(/(.*\.gif$)/)) {
                saveHistory.error("The File Type must be .png, .jpg, or .gif");
                return;
            }
            //check that the image is no larger than 10MB
            if (file.size > 5000000) {
                saveHistory.error("File Size cannot be larger than 10MB");
                return;
            }

            //Read the file to trigger onLoad
            reader.readAsDataURL(file);

            //set the form value
            that.imageFileNameField.val(file.name);
            generalTools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
        },

        events: ["uploaded"],

        setUploadUrl: function (url) {
            this.options.uploadUrl = url;
        },

        //manually set the image (used when undoing)
        setImageFields: function (data, fileName) {
            var that = this;
            that.newImage = true;
            that.imageDataField.val(data);
            that.imageFileNameField.val(fileName);
            if (data !== null) {
                that.setImageUrl(data);
            }

            generalTools.resizeImage(that.cropBox, that.options.imageWidth, that.options.containerWidth);
        },

        submitForm: function () {
            var that = this;
            //check if image has been changed, and image data was set
            if (that.newImage && that.imageDataField.val()) {
                that.form.ajaxSubmit({
                    type: "POST",
                    //from http://stackoverflow.com/questions/8151138/ie-jquery-form-multipart-json-response-ie-tries-to-download-response
                    dataType: "text",
                    contentType: "multipart/form-data",
                    url: that.options.uploadUrl,
                    success: function (response) {
                        //get rid of the quotes, then set the image url
                        var url = response.replace(/['"]/g, '');

                        that.setImageUrl(url);
                        //reset the images 1.5 seconds after loading to workaround a shared access key buy
                        _.delay(function () {
                            that.setImageUrl(url);
                        }, 1500);

                        that.newImage = false;
                        that.trigger("uploaded", {data: that.imageDataField[0].value, fileName: that.imageFileNameField[0].value});
                        saveHistory.success();
                    },
                    error: function () {
                        saveHistory.error("Image upload failed");
                    }
                });
            }
        },

        setImageUrl: function (imageUrl) {
            //store the current image url
            this.imageUrl = imageUrl;
            this.cropBox.attr("src", imageUrl);
            this.options.imageDataBinding = this.imageDataField;
            this.options.imageFileNameBinding = this.imageFileNameField;
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