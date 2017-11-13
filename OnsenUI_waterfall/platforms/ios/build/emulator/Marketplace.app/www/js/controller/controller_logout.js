/**
 * Created by bwyyoung on 16/8/16.
 */
waterfall.controller('logout',
    ['$scope', '$window', 'user_credentials','service_alert', 'network_message_registration',
        function($scope, $window, user_credentials, service_alert, network_message_registration)
        {

            $scope.init = function ()
            {
                //avoid conflicting the event callback for EVENT_BACKBUTTON
                debug_log('init logout');

                executeAsync(function(){
                    $('#special_hide').prop('disabled', false);
                });
                $(document).on(EVENT_BACKBUTTON,
                    function(e)
                    {
                        $(document).off(EVENT_BACKBUTTON);
                        $scope.cancel_logout();
                    }
                );
            };
            $scope.init();

            $scope.cancel_logout = function () {
                scope_slidemenu_left.page_load_home();
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
            });

            $scope.click_logout = function ()
            {
                $(document).off(EVENT_BACKBUTTON);
                scope_registration.BOOL_USER_LOGGED_IN_REGISTERED = false;
                scope_registration.BOOL_USER_LOGGED_IN_GUEST = false;
                user_credentials.logout();
                scope_slidemenu_left.show_form_splash();
            };
        }
]);