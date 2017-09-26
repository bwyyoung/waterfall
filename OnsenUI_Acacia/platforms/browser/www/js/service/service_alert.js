

//TODO: Make this a service, instead of a controller.
Acacia.service('service_alert',
    function()
    {

        this.alert_message = '';
        this.alert_cleared = {
            value : true
        };
        this.ALERT_INSUFFICIENT_CREDIT = 
            "alert/loan_marketplace_invest_insufficient_credit.html";
        this.ALERT_LOADING_API = "alert/loading_api.html";

        this.ALERT_ADDRESS_UPDATE_SUCCESS = "alert/address_update_success.html";
        this.ALERT_ADDRESS_UPDATE_FAIL = "alert/address_update_fail.html";

        this.ALERT_BANK_DETAILS_UPDATE_SUCCESS = "alert/bank_details_update_success.html";
        this.ALERT_BANK_DETAILS_UPDATE_FAIL = "alert/bank_details_update_fail.html";

        this.ALERT_EMAIL_ACTIVATION = "alert/email_activation.html";
        this.ALERT_ERROR_NETWORK = "alert/error_network.html";
        this.ALERT_LOGIN_BLOCKED = "alert/login_blocked.html";
        this.ALERT_LOGIN_INVALID = "alert/login_invalid.html";
        this.ALERT_PASSWORD_RESET_EMAIL_INPUT = "alert/password_reset_email_input.html";
        this.ALERT_PASSWORD_RESET_EMAIL_INVALID = "alert/password_reset_email_invalid.html";
        this.ALERT_PASSWORD_RESET_EMAIL_SENT = "alert/password_reset_email_sent.html";
        this.ALERT_PASSWORD_RESET_NEWCONFIRM_MISMATCH = "alert/password_reset_newconfirm_mismatch.html";
        this.ALERT_PASSWORD_RESET_NEWCONFIRM_SUCCESS = "alert/password_reset_newconfirm_success.html";
        this.ALERT_PASSWORD_UPDATE_SUCCESS = "alert/password_update_success.html";
        this.ALERT_CAMERA_OPTIONS = 'util/camera.html';
        this.ALERT_LOGOUT_CONFIRM = 'alert/logout_confirm.html';

        this.ALERT_SIGNUP_INVALID = 'alert/signup_invalid.html';
        
        this.ALERT_LOAN_MARKETPLACE_LOAN_DETAILS = 'alert/loan_marketplace_loan_details.html';
        this.ALERT_LOAN_MARKETPLACE_LOAN_DETAILS_INVEST_CONFIRM = 'alert/loan_marketplace_loan_details_invest_confirm.html';

        this.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_1 = "alert/loan_marketplace_signup_notification_1.html";
        this.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_2 = "alert/loan_marketplace_signup_notification_2.html";

        this.create_alert = function (ALERT_TYPE, ENABLE_SPECIAL_HIDE)
        {
            debug_log('create_alert ' + this.alert_cleared);
            if (!this.alert_cleared.value)
                return;
            this.alert_message = '';
            this.alert_cleared.value = false;
            var alert_cleared_reference = this.alert_cleared;
            var alert_promise = ons.createAlertDialog(ALERT_TYPE);
            debug_log('ENABLE_SPECIAL_HIDE ' + ENABLE_SPECIAL_HIDE);
            if (typeof ENABLE_SPECIAL_HIDE == 'undefined' || ENABLE_SPECIAL_HIDE)
                executeAsync(function(){
                    $('#special_hide').prop('disabled', false);
                });
            alert_promise.then(
                    function(alertdialog)
                    {
                        alertdialog.show();
                        alertdialog.on('prehide', function(event)
                        {
                            alert_cleared_reference.value= true;
                            if (typeof ENABLE_SPECIAL_HIDE == 'undefined' || ENABLE_SPECIAL_HIDE)
                                executeAsync(function(){
                                    $('#special_hide').prop('disabled', true);
                                });
                        });
                        alertdialog.on('posthide', function (event)
                        {
                            alert_cleared_reference.value = true;
                            alertdialog.destroy();
                        });
                    });
            return alert_promise;
        }

    }
);
