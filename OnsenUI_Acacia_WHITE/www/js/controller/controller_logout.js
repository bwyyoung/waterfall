/**
 * Created by bwyyoung on 16/8/16.
 */

/**
 * @controller logout
 * @desc controller for logout dialog alert
 */
Acacia.controller('logout',
    ['$scope', '$window', 'user_credentials', 'service_alert', 'network_message_registration', 'network_logout', 'network_updates',
        'lokijs_database',
        function ($scope, $window, user_credentials, service_alert, network_message_registration, network_logout
            , network_updates, lokijs_database) {

            /**
             * @function init
             * @desc initialisation function
             * - backbutton event
             * - hide intensive elements for dialog.
             */
            $scope.init = function () {
                executeAsync(function () {
                    $('#special_hide').prop('disabled', false);
                });
                $(document).on(EVENT_BACKBUTTON,
                    function (e) {
                        $(document).off(EVENT_BACKBUTTON);
                        $scope.cancel_logout();
                    }
                );
            };

            $scope.init();

            /**
             * @function cancel_logout
             * @desc cancel logout, and return to home screen
             */
            $scope.cancel_logout = function () {
                scope_slidemenu_left.page_load_home();
                executeAsync(function () {
                    $('#special_hide').prop('disabled', true);
                });
                if (!isNull(alertdialog)) {
                    alertdialog.hide();
                    alertdialog.destroy();
                    alertdialog = null;
                }
            };

            $scope.$on("$destroy", function () {

            });

            /**
             * @function click_logout
             * @desc click logout button
             * - unregister user
             * - clear any network update intervals
             * - logout user credentials
             * - send logout API message
             * - destroy any notifications shown in statusbar
             * - unregister user from database
             * - show splash screen
             */
            $scope.click_logout = function () {
                $(document).off(EVENT_BACKBUTTON);
                scope_registration.BOOL_USER_LOGGED_IN_REGISTERED = false;
                scope_registration.BOOL_USER_LOGGED_IN_GUEST = false;
                network_updates.clear_updates_interval();
                network_logout.logout();
                user_credentials.logout();
                lokijs_database.remove_current_user();
                if (isMobileDevice())
                    cordova.plugins.notification.local.cancelAll();
                scope_slidemenu_left.destroy_notifications();
                scope_slidemenu_left.show_form_splash();
            };
        }
    ]);