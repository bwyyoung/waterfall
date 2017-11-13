
var scope_alert;

//TODO: Make this a service, instead of a controller.
Acacia.controller('alert',
    function($scope)
    {
        scope_alert = $scope;

        $scope.ALERT_ADDRESS_UPDATE_SUCCESS = "alert/address_update_success.html";
        $scope.ALERT_BANK_DETAILS_UPDATE_SUCCESS = "alert/bank_details_update_success.html";
        $scope.ALERT_EMAIL_ACTIVATION = "alert/email_activation.html";
        $scope.ALERT_EMAIL_TEMP_PASSWORD = "alert/email_temp_password.html";
        $scope.ALERT_ERROR_NETWORK = "alert/error_network.html";
        $scope.ALERT_LOGIN_BLOCKED = "alert/login_blocked.html";
        $scope.ALERT_LOGIN_INVALID = "alert/login_invalid.html";
        $scope.ALERT_PASSWORD_CHANGE_SUCCESS = "alert/password_update_success.html";
        $scope.ALERT_PASSWORD_MISMATCH = "alert/password_mismatch.html";
        $scope.ALERT_PASSWORD_RESET_EMAIL_INPUT = "alert/password_reset_email_input.html";
        $scope.ALERT_PASSWORD_RESET_EMAIL_INVALID = "alert/password_reset_email_invalid.html";
        $scope.ALERT_PASSWORD_RESET_EMAIL_SENT = "alert/password_reset_email_sent.html";
        $scope.ALERT_PASSWORD_RESET_NEWCONFIRM_MISMATCH = "alert/password_reset_newconfirm_mismatch.html";
        $scope.ALERT_PASSWORD_RESET_NEWCONFIRM_SUCCESS = "alert/password_reset_newconfirm_success.html";
        $scope.ALERT_PASSWORD_UPDATE_SUCCESS = "alert/password_update_success.html";
        $scope.ALERT_CAMERA_OPTIONS = 'util/camera.html';
        $scope.ALERT_LOGOUT_CONFIRM = 'alert/logout_confirm.html';
        
        $scope.ALERT_LOAN_MARKETPLACE_LOAN_DETAILS = 'alert/loan_marketplace_loan_details.html';
        $scope.ALERT_LOAN_MARKETPLACE_LOAN_DETAILS_INVEST_CONFIRM = 'alert/loan_marketplace_loan_details_invest_confirm.html';

        $scope.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_1 = "alert/loan_marketplace_signup_notification_1.html";
        $scope.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_2 = "alert/loan_marketplace_signup_notification_2.html";

        $scope.create_alert = function (ALERT_TYPE)
        {
            var promise = ons.createAlertDialog(ALERT_TYPE);

            promise
                .then(
                    function(alertdialog)
                    {
                        alertdialog.show();
                        alertdialog.on('posthide', function (event)
                        {
                            alertdialog.destroy();
                        });
                    });

            return promise;
        }

    }
);
