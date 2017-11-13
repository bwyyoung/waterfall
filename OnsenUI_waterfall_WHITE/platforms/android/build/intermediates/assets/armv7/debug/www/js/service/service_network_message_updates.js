/**
 * Created by bwyyoung on 26/8/16.
 */

/**
 * @service network_updates
 * @desc service that manages network updates
 * - credit
 * - new messages for chat feedback.
 */
waterfall.service('network_updates',
    ['$timeout', 'network_api', 'service_alert', 'user_credentials', 'network_message_registration', 'network_inbox',
        function ($timeout, network_api, service_alert, user_credentials, network_message_registration, network_inbox) {
            this.URL_GET_UPDATES = DEFAULT_SERVER_IP + '/NuwaterfallWebAPI/api/waterfall/GetUpdates';

            this.MESSAGE_KEY_INTERVAL_MILLISECOND = 'IntervalMillisecond';
            this.MESSAGE_KEY_NO_OF_NEW_MESSAGE = 'NoOfNewMessage';

            var that = this;

            this.interval_id = 'undefined';
            this.time_interval = 5000;

            this.init_get_updates_interval = function () {
                this.clear_updates_interval();
                this.interval_id = setInterval(this.message_get_updates, this.time_interval);
            };

            this.clear_updates_interval = function () {
                if (this.interval_id != 'undefined')
                    clearInterval(this.interval_id);
            };

            this.message_get_updates = function () {
                var data = {};
                debug_log('message_get_updates ' + user_credentials.id);
                data[user_credentials.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
                network_api.ajax_call(that.URL_GET_UPDATES, data, check_response);

                function check_response(success) {
                    if (!success)
                        return;
                    else if (isNull(arguments[3]))
                        return;
                    var response = arguments[3];

                    if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {
                        user_credentials.credit = response[user_credentials.MESSAGE_KEY_CREDIT_BALANCE];
                        user_credentials.currency = response[user_credentials.MESSAGE_KEY_CREDIT_CURRENCY];
                        DEFAULT_CURRENCY = user_credentials.currency;

                        network_inbox.set_num_new_messages(response[that.MESSAGE_KEY_NO_OF_NEW_MESSAGE]);
                        if (that.time_interval != response[that.MESSAGE_KEY_INTERVAL_MILLISECOND]) {
                            that.time_interval = response[that.MESSAGE_KEY_INTERVAL_MILLISECOND];
                            that.init_get_updates_interval();
                        }
                        scope_apply(scope_slidemenu_left);
                    }
                    else {

                    }
                }
            };
        }
    ]
);