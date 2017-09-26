var scope_password;

/**
 * @controller password
 * @desc controller for resetting password, when user forgot password
 */
Acacia.controller('password',
    ['$scope', '$window', 'user_credentials', 'service_alert', 'network_message_registration',
        function ($scope, $window, user_credentials, service_alert, network_message_registration) {

            /**
             * @function init
             * @desc initialisation function
             * - back button event
             */
            $scope.init = function () {
                $(document).on(EVENT_BACKBUTTON,
                    function () {
                        if (!isNull(alertdialog)) {
                            alertdialog.hide();
                            alertdialog.destroy();
                            alertdialog = null;
                        }
                    }
                );
            };
            $scope.init();

            /**
             * @function password_reset_email_validate
             * @desc validate the user email input, when user clicks submit
             * @param user_email
             * the user email text from input
             */
            $scope.password_reset_email_validate = function (user_email) {
                alertdialog.hide();
                var email_valid = true;
                if (isNull(user_email))
                    email_valid = false;
                if (!email_valid) {
                    service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INVALID).then(
                        function (dialog) {
                            dialog.on('prehide', function () {
                                service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT);
                            });
                        });
                }
                else
                    network_message_registration.message_reset_password_email_submit(user_email);
            };
        }
    ]
);