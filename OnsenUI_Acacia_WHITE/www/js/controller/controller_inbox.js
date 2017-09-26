/**
 * Created by bwyyoung on 17/8/16.
 */
var scope_inbox;

/**
 * @controller inbox
 * @desc this controls the inbox/CHAT FEEDBACK screen,
 * that contains a chat screen similar to that of WhatsApp.
 * uses services such as network_inbox to communicate chat with server.
 */
Acacia.controller('inbox',
    ['$sce', '$scope', '$http', '$q', '$timeout', 'network_api', 'service_alert', 'user_credentials', 'network_inbox',
        function ($sce, $scope, $http, $q, $timeout, network_api, service_alert, user_credentials, network_inbox) {


            $scope.messages = {};
            $scope.window = {};
            $scope.textbox_height = 60;
            $scope.textbox_max_height = 100;
            $scope.message_box_height_buffer = 40;
            $scope.KEYBOARD_UP = false;

            /**
             * @function is_menu_open
             * @desc check if sliding menu is open
             * @returns {boolean}
             * if open, return true
             */
            $scope.is_menu_open = function () {
                return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
            };

            /**
             * @function init
             * @desc initialise inbox, by doing the following
             * - get existing messages that are already downloaded
             * - initialise input events, and keyboard states
             *      - if keyboard is up, move chat log and chat box up
             * - init backbutton functionality
             */
            $scope.init = function () {
                $scope.messages = network_inbox.get_messages_storage();
                $scope.window.height = $(window).height() - $scope.message_box_height_buffer;
                $scope.window.actual_height = $scope.window.height;
                network_inbox.get_messages(0, $scope);

                //adjust chatbox height and visible text based on how much text is input.
                $('#submit_message').on('input', function () {
                    $(this).height(1);
                    if (this.scrollHeight > $scope.textbox_max_height) {
                        $scope.textbox_height = $scope.textbox_max_height;
                        return $(this).height('auto').height($scope.textbox_max_height);
                    }
                    $(this).height(this.scrollHeight);
                    $scope.textbox_height = this.scrollHeight;
                    scope_apply($scope);
                });


                //when keyboard is up, scroll the chat page all the way down
                $(document).on(EVENT_KEYBOARD_UP,
                    function (event, keyboard_height) {
                        $scope.KEYBOARD_UP = true;
                        $scope.window.actual_height = $scope.window.height - keyboard_height;
                        scope_apply($scope);
                        $timeout(function () {
                            $('#inbox_list').scrollTop($('#inbox_list').prop("scrollHeight"));
                            $('#chat_page').scrollTop($('#chat_page').prop("scrollHeight"));
                        }, 100);
                    });

                //when keyboard is down, scroll the chatbox to the bottom of the screen, as well, as the chat log
                $(document).on(EVENT_KEYBOARD_DOWN,
                    function () {
                        $scope.KEYBOARD_UP = false;
                        $scope.window.actual_height = $scope.window.height;
                        scope_apply($scope);
                        $timeout(function () {
                            $('#inbox_list').scrollTop($('#inbox_list').prop("scrollHeight"));
                            $('#chat_page').scrollTop($('#chat_page').prop("scrollHeight"));
                        }, 100);
                    });
                
                $(document).on(EVENT_BACKBUTTON, function () {
                    //if the keyboard is already up, let the keyboard go down first on back button
                    //otherwise, load home screen.
                    if (!$scope.KEYBOARD_UP) {
                        scope_slidemenu_left.page_load_home();
                    }
                });

                //reset num new messages
                network_inbox.num_new_messages = 0;
                //apply changes in data to screen.
                scope_apply(scope_slidemenu_left);
            };

            /**
             * @function destroy
             * @desc destroy all events associated with this controller.
             */
            $scope.$on("$destroy", function () {
                $(document).off(EVENT_BACKBUTTON);
                $(document).off(EVENT_KEYBOARD_UP);
                $(document).off(EVENT_KEYBOARD_DOWN);
            });

            /**
             * @function check_enable_send_message
             * @desc check if user has actually written a message in the chat box, in order to allow sending of message.
             * @returns {boolean}
             * if false, user has written a message of at least 1 character long
             */
            $scope.check_enable_send_message = function () {
                if ($('#submit_message').val().length > 0)
                    return false;
                return true;
            };

            /**
             * @function submit_message
             * @desc submit the written message to server, and add it to the chat log.
             * @returns {boolean}
             */
            $scope.submit_message = function () {
                network_inbox.send_message($('#submit_message').val());
                $('#submit_message').height('1.2em');
                $('#submit_message').val('');
                $('#submit_message').focus();
                scope_apply($scope);
                $timeout(function () {
                    $('#inbox_list').scrollTop($('#inbox_list').prop("scrollHeight"));
                    $('#chat_page').scrollTop($('#chat_page').prop("scrollHeight"));
                }, 100);
                return false;
            };

            /**
             * @function is_date_show
             * @desc check if this row of message,
             * is actually a date divider to separate messages on different days, like WhatsApp
             * @param message
             * the message row object
             * @returns {boolean}
             * if true, it is a pure date row
             */
            $scope.is_date_show = function (message) {
                return message[network_inbox.MESSAGE_KEY_DATE_BREAK];
            };

            /**
             * @function get_current_page_height
             * @desc get the page height in pixels, which is the visible space excluding space TAKEN by keyboard
             * @returns {actual_height}
             * actual screen height excluding visible keyboard
             */
            $scope.get_current_page_height = function () {
                return $scope.window.actual_height;
            };

            /**
             * @function get_chatbox_filler_height
             * @desc get new height of chatbox filler. it is grey space below chatbox to hide any visible white seams.
             * @returns {number}
             */
            $scope.get_chatbox_filler_height = function () {
                return $scope.window.height - $scope.window.actual_height;
            };

            /**
             * @function get_current_list_height
             * @desc get the visible height of the chat log, excluding the chat submit box
             * @returns {number}
             */
            $scope.get_current_list_height = function () {
                return $scope.get_current_page_height() - $('#chat_submit_box').height();
            };

            /**
             * @function get_current_date
             * @desc get current date of the message
             * @param message
             * the message object in the row
             * @returns {*}
             */
            $scope.get_current_date = function (message) {
                return message[network_inbox.MESSAGE_KEY_TIMESTAMP];
            };

            /**
             * @function get_messages
             * @desc get all messages that are to be shown on screen from the network_inbox service
             * @returns {message_object}
             */
            $scope.get_messages = function () {
                return network_inbox.get_messages_storage();
            };

            /**
             * @function get_message_picture_subtitle
             * @desc if this is the user, put 'You' as subtitle for profile picture
             * @param message
             * the message object
             * @returns {subtitle}
             * the subtitle string
             */
            $scope.get_message_picture_subtitle = function (message) {
                if (message[network_inbox.MESSAGE_KEY_SOURCE]
                    == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.SERVER]) {
                    return 'Admin';

                }
                else if (message[network_inbox.MESSAGE_KEY_SOURCE]
                    == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.CLIENT]) {
                    return 'You';
                }
            };

            /**
             * @function is_client_message
             * @desc check if the message is from client, or server
             * @param message
             * the message object
             * @returns {boolean}
             * if true, its from client. if false, its from server.
             */
            $scope.is_client_message = function (message) {
                return (message[network_inbox.MESSAGE_KEY_SOURCE]
                == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.CLIENT]);
            };

            /**
             * @function get_message_picture
             * @desc get the picture to be displayed, depending on the source entity (server, client)
             * @param message
             * the message object
             * @returns {base64_image_data}
             * the image data for the entity.
             */
            $scope.get_message_picture = function (message) {
                if (message[network_inbox.MESSAGE_KEY_SOURCE]
                    == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.SERVER]) {
                    return user_credentials.guest_profile_image;

                }
                else if (message[network_inbox.MESSAGE_KEY_SOURCE]
                    == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.CLIENT]) {
                    return user_credentials.profile_image;
                }
                return '';
            };

            /**
             * @function get_message_text_bubbles
             * @desc get the message content for the text bubble
             * @param message
             * the message object
             * @returns {message_string}
             * the message content/string, that the user/server typed in.
             */
            $scope.get_message_text_bubbles = function (message) {
                return message[network_inbox.MESSAGE_KEY_MESSAGE];
            };

            $scope.init();

            /**
             * @function slidemenu_open
             * @desc open the sliding menu, or close it if it is already open
             */
            $scope.slidemenu_open = function () {
                app.slidingMenu.toggleMenu();
            };
        }
    ])
    .directive('constantFocus', function () {
        /**
         * @directive constantFocus
         * @desc we need to constantly focus on the chat input box, because when the user clicks send,
         * we automatically lose focus from the box. This is to regain the focus such that the soft
         * keyboard remains up, while typing messages
         */
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                element[0].addEventListener('focusout', function (e) {
                    element[0].focus();
                });
            }
        };
    })
;