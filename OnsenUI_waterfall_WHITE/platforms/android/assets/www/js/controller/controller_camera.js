var scope_camera;
/**
 * @controller waterfall_camera
 * @desc controller for camera functions
 */
waterfall.controller("waterfall_camera", ['$scope', '$cordovaCamera', 'user_credentials',
    function ($scope, $cordovaCamera, user_credentials) {
        scope_camera = $scope;
        $scope.imgURI_PlaceHolder = "css/custom_images/icons/photo.png";
        $scope.captured_image_base64_data = null;

        /**
         * @function takePhoto
         * @desc take photo, and get back base64 imagedata
         */
        $scope.takePhoto = function () {
            var options =
            {
                quality: 75,
                cameraDirection: 1,
                destinationType: Camera.DestinationType.DATA_URL, // set as file URI, not DATA URL
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 300,
                targetHeight: 300,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false
            };
            /**
             * @function getPicture
             * @description get picture taken by camera, or picked from gallery
             */
            $cordovaCamera.getPicture(options).then(function (imageData) {
                scope_camera.captured_image_base64_data =
                    user_credentials.captured_image_base64_data =
                        "data:image/jpeg;base64," + imageData;
                scope_apply(scope_profile);
                scope_apply(scope_registration);

            }, function (err) {
                // An error occured. Show a message to the user
                alert('Failed because: ' + err.toString());
            });
        };


        /**
         * @function choosePhoto
         * @desc the photo gallery picker for android and iOS is activated, and we choose a picture from the gallery
         */
        $scope.choosePhoto = function () {
            var options = {
                quality: 75,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 300,
                targetHeight: 300,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false
            };
            $cordovaCamera.getPicture(options).then(function (imageData) {
                scope_camera.captured_image_base64_data =
                    user_credentials.captured_image_base64_data =
                        "data:image/jpeg;base64," + imageData;
                scope_apply(scope_profile);
                scope_apply(scope_registration);
            }, function (err) {

            });
        };

        /**
         * @function init
         * @desc  initialisation of controller.
         */
        $scope.init = function () {
            //on back button, close this dialog.
            $(document).on(EVENT_BACKBUTTON,
                function () {
                    try {
                        if (!isNull(alertdialog)) {
                            alertdialog.hide();
                            alertdialog.destroy();
                            alertdialog = null;
                        }
                    }
                    catch (err) {

                    }

                }
            );
        };
        $scope.init();
    }
]);
