/**
 * @service network_inbox
 * @desc service handling creation chat feedback messages sent to server
 */
Acacia.service('network_inbox',
    ['$timeout', 'network_api', 'service_alert', 'user_credentials',
        function ($timeout, network_api, service_alert, user_credentials) {
            var that = this;

            this.URL_GET_MESSAGE = DEFAULT_SERVER_IP + '/NuAcaciaWebAPI/api/Acacia/GetMessage';
            this.URL_SEND_MESSAGE = DEFAULT_SERVER_IP + '/NuAcaciaWebAPI/api/Acacia/SendMessage';

            this.MESSAGE_KEY_INVESTOR_ID = 'InvestorId';
            this.MESSAGE_KEY_LAST_MESSAGE_ID = 'LastMessageId';
            this.MESSAGE_KEY_MESSAGE_ID = 'MessageId';

            this.MESSAGE_KEY_MESSAGE_LIST = 'MessageList';
            this.MESSAGE_KEY_MESSAGE = 'Message';
            this.MESSAGE_KEY_NEW_MESSAGE = 'NewMessage';

            this.MESSAGE_KEY_MESSAGE_DOM = 'Message_DOM';
            this.MESSAGE_KEY_SOURCE = 'Source';
            this.MESSAGE_KEY_IS_READ = 'IsRead';

            this.MESSAGE_KEY_DATE_BREAK = 'date_break';
            this.MESSAGE_KEY_TIMESTAMP = 'Timestamp';
            this.MESSAGE_KEY_STATUS = 'Status';
            this.MESSAGE_SOURCES = {
                SERVER: 'SERVER',
                CLIENT: 'CLIENT'
            };

            this.num_new_messages = 0;
            this.delayed_messages = {};
            this.time_difference_threshold = 300000; // 5 minutes
            this.init_date = new Date();

            this.set_num_new_messages = function (val) {
                this.num_new_messages = val;
            };

            /**
             * @function init
             * @desc initialisation function
             * - setup interval call for sending delayed messages
             * - setup interval call for getting messages from server
             */
            this.init = function () {
                setInterval(
                    function () {
                        that.interval_send_delayed_messages();
                    }, 60000);
                setInterval(
                    function () {
                        that.interval_get_messages();
                    }, this.time_difference_threshold);
            };

            this.init();

            this.interval_send_delayed_messages = function () {

            };

            this.interval_get_messages = function () {
                this.get_messages(0, null);
            };

            /**
             * @object messages_starter
             * @desc example template for message object.
             */
            this.messages_starter = {
                0: {
                    "MessageId": ['-1'],
                    "Message": '',
                    "Source": this.MESSAGE_SOURCES.SERVER,
                    "Timestamp": this.init_date.getDate() + '/' + this.init_date.getMonth() + '/' + this.init_date.getFullYear(),
                    "date_break": true
                },
                1: {
                    "MessageId": ['-2', '-3'],
                    "Message": '<ul class="chat_message">' +
                    '<li><p>Chat with our support team today, and get answers to any questions or concerns.</p></li>' +
                    '<li><p>Your messages will be processed within 2 working days.' +
                    '</p>' +
                    '<span class="chat_message_time">' + ("0" +
                    this.init_date.getHours()).slice(-2) + ':' + ("0" + this.init_date.getMinutes()).slice(-2) +
                    '</li>' +
                    '</ul>',
                    "Source": this.MESSAGE_SOURCES.SERVER,
                    "Timestamp": this.init_date.toLocaleString(),
                    "date_break": false
                }
            };
            this.messages_network_error =
            {
                0: {
                    "MessageId": ['-1'],
                    "Message": '',
                    "Source": this.MESSAGE_SOURCES.SERVER,
                    "Timestamp": this.init_date.toLocaleString(),
                    "date_break": true
                },
                1: {
                    "MessageId": ['-2', '-3'],
                    "Message": '<ul class="chat_message">' +
                    '<li><p>Please check your internet connection before chatting.</p></li>' +
                    '<li><p>We have been unable to communicate with our support system.' +
                    '</p>' +
                    '<span class="chat_message_time">' + ("0" + this.init_date.getHours()).slice(-2) + ':' + ("0" + this.init_date.getMinutes()).slice(-2) +
                    '</span>' +
                    '</li>' +
                    '</ul>',
                    "Source": this.MESSAGE_SOURCES.SERVER,
                    "Timestamp": this.init_date.toLocaleString(),
                    "date_break": false
                }
            };

            this.messages_storage = angular.copy(this.messages_starter);


            /**
             * @function send_message
             * @desc package message, and send it to server with an ajax call.
             * also check for response.
             * @param message
             * the string message the user wrote
             */
            this.send_message = function (message) {
                message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
                this.message_append_newmessage_source_client(message);

                var data = {};
                data[that.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
                data[that.MESSAGE_KEY_NEW_MESSAGE] = message;
                network_api.ajax_call(that.URL_SEND_MESSAGE, data, check_response);

                function check_response(success) {
                    if (!success || isNull(arguments[3])) {
                        return '';
                    }
                    var response = arguments[3];

                    if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {

                    }
                    else {

                    }
                }
            };

            /**
             * @function message_append_newmessage_source_client
             * @desc add a new row to the chat log, with the message string
             * @param message_string
             * the string message
             */
            this.message_append_newmessage_source_client = function (message_string) {
                var current_timestamp = new Date();
                var current_message_row;
                var current_index = Object.keys(that.messages_storage).length - 1;
                var last_row = this.messages_storage[current_index];
                var last_row_timestamp = null;
                var time_difference = 0;
                var date_difference = 0;

                //if last row is not null, we calculate the time and date difference between last rows messages,
                //and the current message now.
                if (!isNull(last_row)) {
                    last_row_timestamp = new Date(last_row[this.MESSAGE_KEY_TIMESTAMP]);
                    time_difference = current_timestamp.getTime() - last_row_timestamp.getTime();
                    date_difference = current_timestamp.getUTCDate() - last_row_timestamp.getUTCDate();
                }

                //if there is no last row, or time difference is greater than threshold, we create a new bubble set with
                //time stamps
                if (isNull(last_row) || time_difference > this.time_difference_threshold ||
                    date_difference > 0 || last_row[this.MESSAGE_KEY_SOURCE] == this.MESSAGE_SOURCES.SERVER) {
                    //create new message group
                    current_index++;
                    current_message_row = this.create_new_message_row();
                    current_message_row[this.MESSAGE_KEY_SOURCE] = this.MESSAGE_SOURCES.CLIENT;
                    this.messages_storage[current_index] = current_message_row;
                }
                else if (last_row[this.MESSAGE_KEY_SOURCE] == this.MESSAGE_SOURCES.CLIENT) {
                    current_message_row = last_row;
                    current_message_row = this.message_remove_last_bubble_timestamp(current_message_row);
                }
                current_message_row = this.message_append_text_bubble_source_client(message_string, current_message_row, current_timestamp);
                current_message_row = this.message_append_timestamp(current_message_row, current_timestamp, false);
            };

            /**
             * @function message_remove_last_bubble_timestamp
             * @desc remove the visible timestamp from the last bubble
             * @param message_row
             * the specific message row where the timestamp was located
             * @returns {message_row}
             * return the row itself.
             */
            this.message_remove_last_bubble_timestamp = function (message_row) {
                message_row[this.MESSAGE_KEY_MESSAGE_DOM].find('span').remove();
                message_row[this.MESSAGE_KEY_MESSAGE] = message_row[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
                return message_row;
            };

            /**
             * @function message_append_text_bubble_source_client
             * @desc create a new  html text bubble with the message string
             * @param message_string
             * the message in string format, that the user wrote
             * @param current_message_row
             * the message row object
             * @param date
             * datetime in which the message was written
             * @returns {current_message_row}
             */
            this.message_append_text_bubble_source_client = function (message_string, current_message_row, date) {
                current_message_row[this.MESSAGE_KEY_MESSAGE_DOM].append('<li><p>' + message_string + '</p></li>');
                current_message_row[this.MESSAGE_KEY_MESSAGE] = current_message_row[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
                current_message_row[this.MESSAGE_KEY_TIMESTAMP] = date.toUTCString();
                debug_log('message_append_text_bubble_source_client ' + JSON.stringify(current_message_row));
                return current_message_row;
            };

            /**
             * @function get_messages_storage
             * @desc get the current message storage object that is kept in memory.
             * This is used to be displayed on screen as chat log
             * @returns {{0: {MessageId: string[], Message: string, Source: string, Timestamp: string, date_break: boolean}, 1: {MessageId: string[], Message: string, Source: string, Timestamp: string, date_break: boolean}}|*}
             * the message storage object
             */
            this.get_messages_storage = function () {
                return this.messages_storage;
            };

            /**
             * @function get_messages
             * @desc get last 20 messages from server, and refresh messages_storage
             * with the latest messages.
             * @param last_message_id
             * for now, set it to 0, until update in api implementation
             * @param scope
             * the scope of the controller calling this, (for now, it belongs to controller_inbox)
             */
            this.get_messages = function (last_message_id, scope) {
                var data = {};

                data[that.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
                data[that.MESSAGE_KEY_LAST_MESSAGE_ID] = last_message_id;
                network_api.ajax_call(that.URL_GET_MESSAGE, data, check_response);

                function check_response(success) {
                    if (!success || isNull(arguments[3])) {
                        return '';
                    }
                    var response = arguments[3];

                    if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {
                        that.messages_storage = that.process_messages(response[that.MESSAGE_KEY_MESSAGE_LIST]);
                        if (Object.keys(that.messages_storage).length == 0)
                            that.messages_storage = that.messages_starter;
                        $timeout(function ()
                        {
                            $('#inbox_list').animate({scrollTop: $('#inbox_list').prop("scrollHeight")}, 500);
                            $('#chat_page').animate({scrollTop: $('#chat_page').prop("scrollHeight")}, 500);
                            this.num_new_messages = 0;
                        }, 500);
                    }
                    else {
                        that.messages_storage = that.messages_network_error;
                    }
                    if (!isNull(scope))
                        scope_apply(scope);
                }
            };

            /**
             * @function process_messages
             * @desc process the server response, which has an object containing multiple messages.
             * parse it and sort it into our own storage object, to be used in the chat feedback log.
             * @param message_list
             * the response from server, containing message data
             * @returns {messages}
             * a new messages object, to be used in RAM storage, and then displayed to the user.
             */
            this.process_messages = function (message_list) {
                //TODO: Calendar days splitting rows
                var CURRENT_SOURCE = '';
                var current_message_row = null;
                var current_timestamp = null;
                var new_timestamp = null;
                var time_difference = 0;
                var date_difference = 0;
                var messages = {};
                var message_count = 0;
                for (var i = message_list.length - 1; i > -1; i--)
                {
                    new_timestamp = new Date(message_list[i][this.MESSAGE_KEY_TIMESTAMP]);
                    if (current_timestamp == null)
                        current_timestamp = new_timestamp;
                    time_difference = new_timestamp.getTime() - current_timestamp.getTime();
                    date_difference = new_timestamp.getUTCDate() - current_timestamp.getUTCDate();
                    if (date_difference > 0 || i == message_list.length - 1) {
                        current_message_row = this.message_append_timestamp(current_message_row, current_timestamp, true);
                        current_message_row = this.message_create_date_row(current_message_row, message_list[i]);
                        messages[message_count] = current_message_row;
                        message_count++;
                        CURRENT_SOURCE = '';
                    }

                    if (CURRENT_SOURCE != message_list[i][this.MESSAGE_KEY_SOURCE] || time_difference > this.time_difference_threshold) {
                        //sign off timestamp of previous message
                        current_message_row = this.message_append_timestamp(current_message_row, current_timestamp, true);
                        //create new message group
                        CURRENT_SOURCE = message_list[i][this.MESSAGE_KEY_SOURCE];
                        current_message_row = this.create_new_message_row();
                        current_message_row[this.MESSAGE_KEY_SOURCE] = CURRENT_SOURCE;
                        messages[message_count] = current_message_row;
                        message_count++;
                    }
                    current_message_row = this.message_append_text_bubble_source_server(current_message_row, message_list[i]);
                    current_timestamp = new_timestamp;
                }
                current_message_row = this.message_append_timestamp(current_message_row, current_timestamp, true);
                return messages;
            };

            /**
             * @function message_create_date_row
             * @desc create a date separator row, showing the day when the messages below it were written
             * @param message
             * an object to be initialised as a new message row.
             * @param message_list_item
             * the object containing the timestamp
             * @returns {message}
             * the newly initialised message row.
             */
            this.message_create_date_row = function (message, message_list_item) {
                message = this.create_new_message_row();
                message[this.MESSAGE_KEY_DATE_BREAK] = true;
                var date = (new Date(message_list_item[this.MESSAGE_KEY_TIMESTAMP]));
                message[this.MESSAGE_KEY_TIMESTAMP] = date.getUTCDate() + '/' + date.getUTCMonth() + '/' + date.getUTCFullYear();
                return message;
            };

            /**
             * @function message_append_timestamp
             * @desc append a visible timestamp  to a message text bubble.
             * @param message
             * the message GROUP containing messages from either server, or client
             * @param timestamp
             * the timestamp you wish to append
             * @param isUTC
             * is the timestamp to be added in UTC format?
             * @returns {message}
             * the newly modified message group.
             */
            this.message_append_timestamp = function (message, timestamp, isUTC) {
                if (isNull(message))
                    return null;
                if (isUTC)
                    message[this.MESSAGE_KEY_MESSAGE_DOM].children().last().append('<span class="chat_message_time">' + ("0" + timestamp.getUTCHours()).slice(-2) + ':' + ("0" + timestamp.getUTCMinutes()).slice(-2));
                else
                    message[this.MESSAGE_KEY_MESSAGE_DOM].children().last().append('<span class="chat_message_time">' + ("0" + timestamp.getHours()).slice(-2) + ':' + ("0" + timestamp.getMinutes()).slice(-2));
                message[this.MESSAGE_KEY_MESSAGE] = message[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
                return message;
            };

            /**
             * @function message_append_text_bubble_source_server
             * @desc append a new message bubble to a message group, when the entity is the server
             * @param message
             * the message object that is a group of messages from the server
             * @param message_list_item
             * the new message buble you want to add
             * @returns {message}
             * the newly modified message object, which is a group of messages.
             */
            this.message_append_text_bubble_source_server = function (message, message_list_item) {
                message[this.MESSAGE_KEY_MESSAGE_ID].push(message_list_item[this.MESSAGE_KEY_MESSAGE_ID]);
                message[this.MESSAGE_KEY_MESSAGE_DOM].append('<li><p>' + message_list_item[this.MESSAGE_KEY_MESSAGE] + '</p></li>');
                message[this.MESSAGE_KEY_MESSAGE] = message[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
                message[this.MESSAGE_KEY_TIMESTAMP] = message_list_item[this.MESSAGE_KEY_TIMESTAMP];
                debug_log('message append  ' + JSON.stringify(message));

                return message;
            };

            /**
             * @function create_new_message_row
             * @desc create a new message row that could contain multiple messages from the same entity
             */
            this.create_new_message_row = function () {
                var message = {};
                message[this.MESSAGE_KEY_MESSAGE_ID] = [];
                message[this.MESSAGE_KEY_MESSAGE_DOM] = $($.parseHTML('<ul class="chat_message"></ul>'));
                message[this.MESSAGE_KEY_SOURCE] = '';
                message[this.MESSAGE_KEY_TIMESTAMP] = '';
                message[this.MESSAGE_KEY_DATE_BREAK] = false;
                return message;
            };

        }
    ]);