

waterfall.service('network_message_registration',['network_api','service_alert','user_credentials',
    function(network_api, service_alert, user_credentials)
{
    //TEST LOGIN
    //"Username": "KCHENNYL@hotmail.com",
    //"Password": "123456" 8bKB05DA

    var URL_LOGIN = "http://192.168.100.9/NuwaterfallWebAPI/api/waterfallUser/Login";
    var URL_CHANGE_PASSWORD = "http://192.168.100.9/NuwaterfallWebAPI/api/waterfallUser/ChangePassword";
    var URL_FORGOT_PASSWORD = "http://192.168.100.9/NuwaterfallWebAPI/api/waterfallUser/ForgotPassword";
    var URL_SIGNUP = "http://192.168.100.9/NuwaterfallWebAPI/api/waterfallUser/SignUp";
    this.MESSAGE_KEY_USERNAME = "Username";
    this.MESSAGE_KEY_FIRSTNAME = "FirstName";
    this.MESSAGE_KEY_LASTNAME = "LastName";
    this.MESSAGE_KEY_MOBILENO = "MobileNo";
    this.MESSAGE_KEY_DATEOFBIRTH = "DateOfBirth";
    this.MESSAGE_KEY_PASSWORD = "Password";
    this.MESSAGE_KEY_NEWPASSWORD = "NewPassword";
    this.MESSAGE_KEY_FORCECHANGEPASSWORD = "ForceChangePassword";
    var alert_loading_dialog;
    var that = this;


    this.message_signup = function(signup_form_data) {
        var data = {};
        service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function (dialog) {
            service_alert.alert_message = "Submitting Registration..";
            alert_loading_dialog = dialog;
            data[that.MESSAGE_KEY_USERNAME] = signup_form_data.email;
            data[that.MESSAGE_KEY_FIRSTNAME] = signup_form_data.firstname;
            data[that.MESSAGE_KEY_LASTNAME] = signup_form_data.lastname;
            data[that.MESSAGE_KEY_MOBILENO] = signup_form_data.phonenumber;
            data[that.MESSAGE_KEY_PASSWORD] = signup_form_data.password_verify;
            data[that.MESSAGE_KEY_DATEOFBIRTH] = signup_form_data.birthday_day + '-' +
                signup_form_data.birthday_month + '-' +
                signup_form_data.birthday_year;
            data[network_api.MESSAGE_KEY_APPLICATIONGROUP] = DEFAULT_APPLICATIONGROUP;
            network_api.ajax_call(URL_SIGNUP, data, check_response);
        });

        function check_response(success)
        {
            alert_loading_dialog.hide();
            if (!success)
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
            else if (isNull(arguments[3]))
            //invalid response. For now show a network error.
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
            var response = arguments[3];

            if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS)
            {
                service_alert.create_alert(service_alert.ALERT_EMAIL_ACTIVATION).then(
                    function (dialog) {
                        dialog.on('prehide', function () {
                            scope_registration.nav_registration_poppage();
                            scope_registration.nav_registration_poppage();
                        });
                    });
            }
            else
            {
                service_alert.create_alert(service_alert.ALERT_SIGNUP_INVALID).then(
                    function (dialog) {
                        dialog.on('prehide', function () {
                            scope_registration.nav_registration_poppage();
                        });
                    });
            }
        }
    };

    this.message_newpassword_confirm = function(email, temppassword, newpassword)
    {
        var data = {};
        service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function(dialog)
        {
            service_alert.alert_message = "Submitting New Password..";
            alert_loading_dialog = dialog;
            data[that.MESSAGE_KEY_USERNAME] = email;
            data[that.MESSAGE_KEY_PASSWORD] = temppassword;
            data[that.MESSAGE_KEY_NEWPASSWORD] = newpassword;
            network_api.ajax_call(URL_CHANGE_PASSWORD, data, check_response);
        });

        function check_response(success) {
            alert_loading_dialog.hide();
            if (!success)
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
            else if (isNull(arguments[3]))
            //invalid response. For now show a network error.
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
            var response = arguments[3];
            if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS)
                return service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_NEWCONFIRM_SUCCESS).
                then(function (dialog)
                {
                    dialog.on('prehide', function()
                    {
                        user_credentials.setup_user(email, newpassword, null);
                        scope_registration.login_user(true);
                    });
                });
            else /*if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_FAILED)*/
                return service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_NEWCONFIRM_MISMATCH);
        }
    };

    this.message_login_user = function(username, password)
    {
        var data = {};

        service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function(dialog)
        {
            service_alert.alert_message = "Logging In..";
            alert_loading_dialog = dialog;
            button_login.setDisabled(true);
            data[that.MESSAGE_KEY_USERNAME] = username;
            data[that.MESSAGE_KEY_PASSWORD] = password;
            network_api.ajax_call(URL_LOGIN, data, check_response);
        });

        function check_response(success)
        {

            alert_loading_dialog.hide();
            scope_registration.login.user_password = '';
            var response = arguments[3];
           
            if (!success)
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
            else if (isNull(arguments[3]))
                //invalid response. For now show a network error.
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);


            if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS)
            {
                user_credentials.setup_user(username, password, response);
                if (response[that.MESSAGE_KEY_FORCECHANGEPASSWORD])
                {
                    scope_registration.temp_password = password;
                    return nav_registration.pushPage('registration/newpassword.html',{ animation: 'simpleslide' });
                }
                else
                    return scope_registration.login_user(true);
            }
            if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_FAILED)
                return service_alert.create_alert(service_alert.ALERT_LOGIN_INVALID);
            if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_BLOCKED)
                return service_alert.create_alert(service_alert.ALERT_LOGIN_BLOCKED);
            else
                return service_alert.create_alert(service_alert.ALERT_LOGIN_INVALID);
        }
    };


    this.message_reset_password_email_submit = function(email)
    {
        var data = {};
        service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function(dialog)
        {
            service_alert.alert_message = "Submitting Email Address..";
            alert_loading_dialog = dialog;
            data[that.MESSAGE_KEY_USERNAME] = email;
            network_api.ajax_call(URL_FORGOT_PASSWORD, data, check_response);
        });

        function check_response(success)
        {
            alert_loading_dialog.hide();
            if (!success)
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK).then(
                    function(dialog)
                    {
                        dialog.on('prehide', function()
                        {
                            service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT);
                        });
                    });
            else if (isNull(arguments[3]))
                //invalid response. For now show a network error.
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK).then(
                    function(dialog)
                    {
                        dialog.on('prehide', function()
                        {
                            service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT);
                        });
                    });
            
            var response = arguments[3];

            if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS)
                return service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_SENT);
            else/* if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_FAILED)*/
                return service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INVALID).then(
                    function(dialog)
                    {
                        dialog.on('prehide', function()
                        {
                            service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT);
                        });
                    });
        }
    };

}
]
);