

var scope_camera;

Acacia.controller("acacia_camera",
	function ($scope, $cordovaCamera)
	{
		debug_log('Camera Scope');
		scope_camera = $scope;
        $scope.imgURI_PlaceHolder = "css/custom_images/icons/photo.png";
        $scope.captured_image = null;
        $scope.check = function()
        {
            debug_log ('imgURI value ' + $scope.captured_image);
        };

		$scope.takePhoto = function ()
		{
            debug_log('takePhoto check captured image '  +  scope_camera.captured_image);

             var options = {
               quality: 75,
                 cameraDirection:1,
               destinationType: Camera.DestinationType.DATA_URL,
               sourceType: Camera.PictureSourceType.CAMERA,
               allowEdit: true,
               encodingType: Camera.EncodingType.JPEG,
               targetWidth: 300,
               targetHeight: 300,
               popoverOptions: CameraPopoverOptions,
               saveToPhotoAlbum: false
           };
		   $cordovaCamera.getPicture(options).then(function (imageData)
           {
               scope_camera.captured_image = "data:image/jpeg;base64," + imageData;
               debug_log('Image captured to captured_image ' +   scope_camera.captured_image.substring(0, 20));
               scope_registration.captured_image = scope_camera.captured_image;
               scope_apply($scope);
		   }, function (err)
           {
			   // An error occured. Show a message to the user
			   alert('Failed because: ' + err.toString());
		   });
	   }

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
               scope_camera.captured_image = "data:image/jpeg;base64," + imageData;
               scope_registration.captured_image = scope_camera.captured_image;
               scope_apply($scope);
		   }, function (err) {

		   });
	   }

        $scope.init = function ()
        {

            $(document).on(EVENT_BACKBUTTON,
                function()
                {
                    try
                    {
                        if (!isNull(alertdialog))
                        {
                            alertdialog.hide();
                            alertdialog.destroy();
                            alertdialog = null;
                        }
                    }
                    catch(err)
                    {

                    }

                }
            );
        }
        $scope.init();
      
 });
