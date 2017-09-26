/**
 * Created by bwyyoung on 16/8/16.
 */
Acacia.controller('logout',
    ['$scope', '$window', 'user_credentials','service_alert', 'network_message_registration',
        function($scope, $window, user_credentials, service_alert, network_message_registration)
        {

            $scope.init = function ()
            {
                executeAsync(function(){
                    $('#special_hide').prop('disabled', false);
                });
                $(document).on(EVENT_BACKBUTTON,
                    function() {
                        $scope.cancel_logout();
                    }
                );
            };
            $scope.init();

            $scope.cancel_logout = function () {
                executeAsync(function(){
                    $('#special_hide').prop('disabled', true);
                });
                if (!isNull(alertdialog))
                {
                    alertdialog.hide();
                    alertdialog.destroy();
                    alertdialog = null;
                }
            };
            
            $scope.$on("$destroy", function()
            {
                $(document).off(EVENT_BACKBUTTON);
            });

            $scope.click_logout = function ()
            {
                scope_registration.BOOL_USER_LOGGED_IN_REGISTERED = false;
                scope_registration.BOOL_USER_LOGGED_IN_GUEST = false;
                user_credentials.logout();
                scope_slidemenu_left.show_form_splash();
            };
        }
]);