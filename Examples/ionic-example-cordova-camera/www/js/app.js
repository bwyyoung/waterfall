// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

if (ionic.Platform.version() >= 6) {
  var permissions = window.plugins.permissions;
  //do we already have permissions
  permissions.hasPermission(function(status){
    if(!status.hasPermission) {
      //if not, warn in console
      var errorCallback = function() {
        console.warn('Camera permission is not turned on');
      }
      //make request for permissions
      permissions.requestPermission(function(status) {
        //do we still not have permissions? user denied. Do something here
        if( !status.hasPermission ) userdenied();
      }, function(){}, permissions.CAMERA);
    }
  }, function(){}, permissions.CAMERA);
}

angular.module('starter', ['ionic', 'starter.services'])

.config(function($compileProvider){
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.controller('MainCtrl', function($scope, Camera) {

  $scope.getPhoto = function() {
    Camera.getPicture().then(function(imageURI) {
      console.log(imageURI);
      $scope.lastPhoto = imageURI;
    }, function(err) {
      console.err(err);
    }, {
      quality: 75,
      targetWidth: 320,
      targetHeight: 320,
      saveToPhotoAlbum: false
    });
  };

})
