/**
 * Created by bwyyoung on 18/8/16.
 */
Acacia.service('network_inbox',
    ['network_api','service_alert','user_credentials',
        function(network_api, service_alert, user_credentials)
    {

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

        this.messages_sample =  {
            0 :
            {
                "MessageId": ['1', '2'],
                "Message": '<ul class="chat_message">' +
                '<li><p>TEST</p></li>' +
                '<li><p>TEST2fjidaprjeiopsafjieoarjeafjeiosarjieospafjeiosarjeisoa' +
                '<span class="chat_message_time">13:38</span> ' +
                '</p></li>' +
                '</ul>',
                "Source": 'CLIENT',
                "Timestamp": "1978-09-18T00:00:00",
                "date_break" : false
            }
            ,
            1 :
            {
                "MessageId": ['1', '2'],
                "Message": '<ul class="chat_message">' +
                '<li><p>TEST3</p></li>' +
                '<li><p>TEST4fjeioajreioasjfioeasjrioesajfioepsarjieosajfioesapjriose' +
                '<span class="chat_message_time">13:38</span> ' +
                '</p></li>' +
                '</ul>',
                "Source": 'SERVER',
                "Timestamp": "1978-09-18T00:00:00"
            }
        };

        var that = this;

        this.send_message = function(message)
        {

        };

        this.get_messages_sample = function () {
            return this.messages_sample;
        }

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
                    that.messages_sample = that.process_messages(response[that.MESSAGE_KEY_MESSAGE_LIST]);
                    debug_log('messages_sample: ' + JSON.stringify(that.messages_sample));
                    scope_apply(scope);
                }
                else
                {

                }
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
            var date_difference_threshold = 300000; // 5 minutes
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
                    current_message_row = this.message_append_timestamp(current_message_row, current_timestamp);
                    current_message_row = this.message_create_date_row(current_message_row, message_list[i]);
                    messages[message_count] = current_message_row;
                    message_count++;
                    CURRENT_SOURCE = '';
                }

                if (CURRENT_SOURCE != message_list[i][this.MESSAGE_KEY_SOURCE] || time_difference > date_difference_threshold)
                {
                    //sign off timestamp of previous message
                    current_message_row = this.message_append_timestamp(current_message_row, current_timestamp);
                    //create new message group
                    CURRENT_SOURCE = message_list[i][this.MESSAGE_KEY_SOURCE];
                    current_message_row = this.create_new_message_row();
                    current_message_row[this.MESSAGE_KEY_SOURCE] = CURRENT_SOURCE;
                    messages[message_count] = current_message_row;
                    message_count++;
                }
                current_message_row = this.message_append_text_bubble(current_message_row, message_list[i]);
                current_timestamp = new_timestamp;
            }
            current_message_row = this.message_append_timestamp(current_message_row, current_timestamp);
            return messages;
        };

        this.message_create_date_row = function (message, message_list_item) {
            message = this.create_new_message_row();
            message[this.MESSAGE_KEY_DATE_BREAK] = true;
            var date = (new Date(message_list_item[this.MESSAGE_KEY_TIMESTAMP]));
            message[this.MESSAGE_KEY_TIMESTAMP] =  date.getUTCDate() +'/' + date.getUTCMonth() + '/' + date.getUTCFullYear();
            return message;
        }
        
        this.message_append_timestamp = function (message, timestamp) {
            if (isNull(message))
                return null;
            message[this.MESSAGE_KEY_MESSAGE_DOM].children().last().
            append('<span class="chat_message_time">' + timestamp.getUTCHours() + ':' + timestamp.getUTCMinutes() + '</span>');
            message[this.MESSAGE_KEY_MESSAGE] = message[this.MESSAGE_KEY_MESSAGE_DOM].wrapAll('<div>').parent().html();
            return message;
        };

        this.message_append_text_bubble = function (message, message_list_item)
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
