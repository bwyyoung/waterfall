/**
 * Created by bwyyoung on 18/8/16.
 */
Acacia.service('network_inbox',
    ['network_api','service_alert','user_credentials',
        function(network_api, service_alert, user_credentials)
    {
        var that = this;

        this.URL_GET_MESSAGE = 'http://192.168.100.9/NuAcaciaWebAPI/api/Acacia/GetMessage';
        this.URL_SEND_MESSAGE = 'http://192.168.100.9/NuAcaciaWebAPI/api/Acacia/SendMessage';

        this.MESSAGE_KEY_INVESTOR_ID = 'InvestorId';
        this.MESSAGE_KEY_LAST_MESSAGE_ID = 'LastMessageId';
        this.MESSAGE_KEY_MESSAGE_ID = 'MessageId';

        this.MESSAGE_KEY_MESSAGE_LIST = 'MessageList';
        this.MESSAGE_KEY_MESSAGE = 'Message';
        this.MESSAGE_KEY_MESSAGE_DOM = 'Message_DOM';
        this.MESSAGE_KEY_SOURCE = 'Source';
        this.MESSAGE_KEY_IS_READ = 'IsRead';

        this.MESSAGE_KEY_DATE_BREAK = 'date_break';
        this.MESSAGE_KEY_TIMESTAMP = 'Timestamp';
        this.MESSAGE_KEY_STATUS= 'Status';
        this.MESSAGE_SOURCES = {
            SERVER: 'SERVER',
            CLIENT: 'CLIENT'
        };

        this.delayed_messages = {};

        this.time_difference_threshold = 300000; // 5 minutes
        this.init_date =  new Date();


        this.init = function ()
        {
            setInterval(
                function(){
                    that.interval_send_delayed_messages();
                }, 60000);
        };

        this.init();

        this.interval_send_delayed_messages = function ()
        {

        };

        this.messages_starter =  {
            0 :
            {
                "MessageId": ['-1'],
                "Message": '',
                "Source": this.MESSAGE_SOURCES.SERVER,
                "Timestamp": this.init_date.getDate() +'/' + this.init_date.getMonth() + '/' + this.init_date.getFullYear(),
                "date_break" : true
            },
            1 :
            {
                "MessageId": ['-2', '-3'],
                "Message": '<ul class="chat_message">' +
                '<li><p>Chat with our support team today, and get answers to any questions or concerns.</p></li>' +
                '<li><p>Your messages will be processed within 2 working days.' +
                '</p>' +
                '<span class="chat_message_time">' +("0" +
                this.init_date.getHours()).slice(-2) + ':' + ("0" + this.init_date.getMinutes()).slice(-2) +
                '</li>' +
                '</ul>',
                "Source": this.MESSAGE_SOURCES.SERVER,
                "Timestamp": this.init_date.toLocaleString(),
                "date_break" : false
            }
        };
        this.messages_network_error =
        {
            0 :
            {
                "MessageId": ['-1'],
                "Message": '',
                "Source": this.MESSAGE_SOURCES.SERVER,
                "Timestamp": this.init_date.toLocaleString(),
                "date_break" : true
            },
            1 :
            {
                "MessageId": ['-2', '-3'],
                "Message": '<ul class="chat_message">' +
                '<li><p>Please check your internet connection before chatting.</p></li>' +
                '<li><p>We have been unable to communicate with our support system.' +
                '</p>' +
                '<span class="chat_message_time">' +("0" +  this.init_date.getHours()).slice(-2) + ':' + ("0" + this.init_date.getMinutes()).slice(-2) +
                '</span>' +
                '</li>' +
                '</ul>',
                "Source": this.MESSAGE_SOURCES.SERVER,
                "Timestamp": this.init_date.toLocaleString(),
                "date_break" : false
            }
        };

        this.messages_storage = angular.copy(this.messages_starter);


        this.send_message = function(message)
        {
            message  = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
            this.message_append_newmessage_source_client(message);
        };

        this.message_append_newmessage_source_client = function(message_string) {
            var current_timestamp = new Date();
            var current_message_row;
            var current_index = Object.keys(that.messages_storage).length - 1;
            var last_row = this.messages_storage[current_index];
            var last_row_timestamp = null;
            var time_difference = 0;
            var date_difference = 0;
            debug_log('newmessage ' + JSON.stringify(last_row) + '|' + message_string);

            if (!isNull(last_row))
            {
                last_row_timestamp = new Date(last_row[this.MESSAGE_KEY_TIMESTAMP]);
                time_difference = current_timestamp.getTime() - last_row_timestamp.getTime();
                date_difference = current_timestamp.getUTCDate() - last_row_timestamp.getUTCDate();
            }

            if (isNull(last_row) || time_difference > this.time_difference_threshold ||
                date_difference > 0 || last_row[this.MESSAGE_KEY_SOURCE] == this.MESSAGE_SOURCES.SERVER)
            {
                //create new message group
                current_index++;
                current_message_row = this.create_new_message_row();
                current_message_row[this.MESSAGE_KEY_SOURCE] = this.MESSAGE_SOURCES.CLIENT;
                this.messages_storage[current_index] = current_message_row;
            }
            else if (last_row[this.MESSAGE_KEY_SOURCE] == this.MESSAGE_SOURCES.CLIENT)
            {
                current_message_row = last_row;
                current_message_row = this.message_remove_last_bubble_timestamp(current_message_row);
            }
            current_message_row =  this.message_append_text_bubble_source_client(message_string, current_message_row, current_timestamp);
            current_message_row = this.message_append_timestamp(current_message_row, current_timestamp, false);
        };

        this.message_remove_last_bubble_timestamp = function (message_row)
        {
            message_row[this.MESSAGE_KEY_MESSAGE_DOM].find('span').remove();
            message_row[this.MESSAGE_KEY_MESSAGE] = message_row[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
            return message_row;
        };


        this.message_append_text_bubble_source_client = function (message_string, current_message_row, date)
        {
           // current_message_row[this.MESSAGE_KEY_MESSAGE_ID].push(message_list_item[this.MESSAGE_KEY_MESSAGE_ID]);
            current_message_row[this.MESSAGE_KEY_MESSAGE_DOM].append('<li><p>' + message_string + '</p></li>');
            current_message_row[this.MESSAGE_KEY_MESSAGE] = current_message_row[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
            current_message_row[this.MESSAGE_KEY_TIMESTAMP] =  date.toUTCString();
            debug_log('message_append_text_bubble_source_client '  + JSON.stringify(current_message_row));

            return current_message_row;
        };

        this.get_messages_storage = function () {
            return this.messages_storage;
        };

        this.get_messages = function (last_message_id, scope)
        {
            var data = {};

            data[that.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
            data[that.MESSAGE_KEY_LAST_MESSAGE_ID] = last_message_id;
            network_api.ajax_call(that.URL_GET_MESSAGE, data, check_response);

            function check_response(success)
            {
                if (!success || isNull(arguments[3]))
                {
                    return '';
                }
                var response = arguments[3];

                if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS)
                {
                    that.messages_storage = that.process_messages(response[that.MESSAGE_KEY_MESSAGE_LIST]);
                    if (Object.keys(that.messages_storage).length == 0)
                        that.messages_storage =  that.messages_starter;
                    debug_log('messages_storage: ' + JSON.stringify(that.messages_storage));
                }
                else
                {
                    that.messages_storage =  that.messages_network_error;
                }
                scope_apply(scope);
            }
        };

        this.process_messages = function (message_list)
        {
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
                if (date_difference > 0 || i == message_list.length - 1)
                {
                    current_message_row = this.message_append_timestamp(current_message_row, current_timestamp, true);
                    current_message_row = this.message_create_date_row(current_message_row, message_list[i]);
                    messages[message_count] = current_message_row;
                    message_count++;
                    CURRENT_SOURCE = '';
                }

                if (CURRENT_SOURCE != message_list[i][this.MESSAGE_KEY_SOURCE] || time_difference > time_difference_threshold)
                {
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

        this.message_create_date_row = function (message, message_list_item) {
            message = this.create_new_message_row();
            message[this.MESSAGE_KEY_DATE_BREAK] = true;
            var date = (new Date(message_list_item[this.MESSAGE_KEY_TIMESTAMP]));
            message[this.MESSAGE_KEY_TIMESTAMP] =  date.getUTCDate() +'/' + date.getUTCMonth() + '/' + date.getUTCFullYear();
            return message;
        };
        
        this.message_append_timestamp = function (message, timestamp, isUTC)
        {
            if (isNull(message))
                return null;
            if (isUTC)
                message[this.MESSAGE_KEY_MESSAGE_DOM].children().last().
                append('<span class="chat_message_time">' +("0" +  timestamp.getUTCHours()).slice(-2) + ':' + ("0" + timestamp.getUTCMinutes()).slice(-2));
            else
                message[this.MESSAGE_KEY_MESSAGE_DOM].children().last().
                append('<span class="chat_message_time">' +("0" +  timestamp.getHours()).slice(-2) + ':' + ("0" + timestamp.getMinutes()).slice(-2));
            message[this.MESSAGE_KEY_MESSAGE] = message[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
            return message;
        };

        this.message_append_text_bubble_source_server = function (message, message_list_item)
        {
            message[this.MESSAGE_KEY_MESSAGE_ID].push(message_list_item[this.MESSAGE_KEY_MESSAGE_ID]);
            message[this.MESSAGE_KEY_MESSAGE_DOM].append('<li><p>' + message_list_item[this.MESSAGE_KEY_MESSAGE] + '</p></li>');
            message[this.MESSAGE_KEY_MESSAGE] = message[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
            message[this.MESSAGE_KEY_TIMESTAMP] =  message_list_item[this.MESSAGE_KEY_TIMESTAMP];
            debug_log('message append  '  + JSON.stringify(message));

            return message;
        };

        this.create_new_message_row = function ()
        {
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