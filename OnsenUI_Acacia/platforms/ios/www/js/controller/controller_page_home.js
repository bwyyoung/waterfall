/**
 * See: http://www.css-101.org/articles/ken-burns_effect/css-transition.php
 */

/**
 * The idea is to cycle through the images to apply the "fx" class to them every n seconds.
 * We can't simply set and remove that class though, because that would make the previous image move back into its original position while the new one fades in.
 * We need to keep the class on two images at a time (the two that are involved with the transition).
 */


var scope_page_home = null;
var loaded = false;
var slideshowinterval = new Array();

Acacia.controller('page_home',
    ['$scope', '$window', '$timeout', '$rootScope','service_alert',
        function($scope, $window, $timeout, $rootScope, service_alert) {
            console.log('loading page_home controller');
            scope_page_home = $scope;
            $scope.is_menu_open = function () {
                if (isNull(scope_slidemenu_left))
                    return false;
                return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
            };

            $scope.slidemenu_open = function ()
            {
                debug_log('slidemenu toggle home');
                app.slidingMenu.toggleMenu();
            };

            //Only show the home screen if we are logged in.
            $scope.check_home_display = function()
            {
                return (BOOL_USER_LOGGED_IN_GUEST || BOOL_USER_LOGGED_IN_REGISTERED);
            }

            $scope.kenBurns = function (kb_images, kb_numberOfImages, i)
            {
                debug_log('ken burns');
                if (i.Value == kb_numberOfImages.Value) {
                    i.Value = 0;
                }
                kb_images[i.Value].className = "fx";

                // we can't remove the class from the previous element or we'd get a bouncing effect so we clean up the one before last
                // (there must be a smarter way to do this though)
                if (i.Value === 0) {
                    (kb_images[kb_numberOfImages.Value - 2]).className = "";
                }
                if (i.Value === 1) {
                    (kb_images[kb_numberOfImages.Value - 1]).className = "";
                }
                if (i.Value > 1) {
                    (kb_images[i.Value - 2]).className = "";
                }
                i.Value++;
            }

            $scope.slideshow_start = function ()
            {
                // we set the 'fx' class on the first image when the page loads
                var slideshows = document.getElementsByName('slideshow');

                $scope.kenBurns_clear();

                for (var j = 0; j < slideshows.length; j++) {
                    $scope.slideshow_interval(slideshows[j]);
                }
            }

            $scope.slideshow_interval = function(element_class)
            {
                element_class.getElementsByTagName('img')[0].className = "fx";

                // the third variable is to keep track of where we are in the loop
                // if it is set to 1 (instead of 0) it is because the first image is styled when the page loads
                var images = element_class.getElementsByTagName('img');
                var numberOfImages = {Value: images.length};
                var   i = {Value: Math.floor(Math.random() * numberOfImages.Value  - 1) + 1};

                // this calls the kenBurns function every 4 seconds
                // you can increase or decrease this value to get different effects
                $scope.kenBurns(images, numberOfImages, i);

                var theInterval =  window.setInterval(
                    function() {
                        $scope.kenBurns(images, numberOfImages, i);
                    }
                    , 3500);
                slideshowinterval.push(
                   theInterval
                );
            }

            $scope.$on("$destroy", function()
            {
                $scope.destroy();
            });

            $scope.destroy = function () 
            {
                $scope.kenBurns_clear();
            }
          

            $scope.kenBurns_clear =  function()
            {
                for(var i = 0; i < slideshowinterval.length ; i++)
                {
                    debug_log('clearing interval ' +  slideshowinterval[i]);
                    window.clearInterval(slideshowinterval[i]);
                }
                slideshowinterval = [];
            }

            $scope.page_load_loans_marketplace = function()
            {
                app.slidingMenu.setMainPage('slidemenu_left/3_loans_marketplace.html', {closeMenu: true});
            }

            $scope.page_load_news = function ()
            {
              
            }

            $scope.show_form_search = function()
            {
                app.slidingMenu.setMainPage('slidemenu_left/10_search.html', {closeMenu: true});
            }

        }]
);
