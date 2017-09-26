/**
 * Created by bwyyoung on 26/8/16.
 */

/**
 * @function network_logout
 * @desc service for sending logout message to server.
 */
Acacia.service('network_logout',
    ['$timeout', 'network_api', 'service_alert', 'user_credentials', 'network_message_registration',
        function ($timeout, network_api, service_alert, user_credentials, network_message_registration) {
            this.URL_LOGOUT = DEFAULT_SERVER_IP + '/NuAcaciaWebAPI/api/AcaciaUser/Logout';
            var that = this;
            this.logout = function () {
                var data = {};
                data[network_message_registration.MESSAGE_KEY_USERNAME] = user_credentials.username;
                network_api.ajax_call(that.URL_LOGOUT, data, check_response);

                function check_response(success) {
                    if (typeof alert_loading_dialog != 'undefined')
                        alert_loading_dialog.hide();
                    if (!success)
                        return;
                    else if (isNull(arguments[3]))
                        return;
                    var response = arguments[3];

                    if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {

                    }
                    else {

                    }
                }
            }
        }
    ]
);