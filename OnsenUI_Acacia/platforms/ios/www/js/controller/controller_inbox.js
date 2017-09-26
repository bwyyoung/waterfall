/**
 * Created by bwyyoung on 17/8/16.
 */
var scope_inbox;

Acacia.controller('inbox',
    ['$sce','$scope','$http', '$q', '$timeout', 'network_api','service_alert','user_credentials', 'network_inbox',
        function($sce,$scope,$http, $q, $timeout, network_api, service_alert, user_credentials, network_inbox)
    {
        $scope.is_menu_open = function () {
            return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
        };

        $scope.messages = {};
        $scope.window = {};

        $scope.textbox_height = 60;
        $scope.textbox_max_height = 100;
        
        $scope.init = function () 
        {
            $scope.messages = network_inbox.get_messages_storage();
            network_inbox.get_messages(0, $scope);
            $('#submit_message').on( 'input', function()
            {
                $(this).height(1);
                if (this.scrollHeight > $scope.textbox_max_height)
                {
                    $scope.textbox_height = $scope.textbox_max_height;
                    return $(this).height( 'auto' ).height( $scope.textbox_max_height );
                }
                $(this).height( this.scrollHeight );
                $scope.textbox_height = this.scrollHeight;
                scope_apply($scope);
            });
            $scope.window.height = $(window).height() - 40;
            $scope.window.actual_height = $scope.window.height;
            $(document).on( EVENT_KEYBOARD_UP,
                function(event, keyboard_height)
                {
                    $scope.window.actual_height = $scope.window.height - keyboard_height;
                    debug_log('event keyboard up ' +  $scope.window.actual_height );
                    scope_apply($scope);
                });
            $(document).on( EVENT_KEYBOARD_DOWN,
                function()
                {
                    $scope.window.actual_height = $scope.window.height;
                    debug_log('event keyboard down ' +  $scope.window.actual_height );
                    scope_apply($scope);
                });
        };



        $scope.check_enable_send_message = function () {
            if( $('#submit_message').val().length > 0)
               return false;
            return true;
        };

        $scope.submit_message = function () {

            network_inbox.send_message( $('#submit_message').val());
            $('#submit_message').height('1.2em');
            $('#submit_message').val('');
            $('#submit_message').focus();1
            scope_apply($scope);
            return false;
        };

        $scope.is_date_show = function (message) {
            return message[network_inbox.MESSAGE_KEY_DATE_BREAK];
        };
        
        $scope.get_current_page_height = function () {
            return  $scope.window.actual_height;
        };
        $scope.get_chatbox_filler_height = function () {
            return $scope.window.height - $scope.window.actual_height;
        };
        $scope.get_current_list_height = function () {
            return  $scope.get_current_page_height() - $('#chat_submit_box').height();
        };
        $scope.get_current_date = function (message) {
            return message[network_inbox.MESSAGE_KEY_TIMESTAMP];
        };

        $scope.get_messages = function ()
        {
            return network_inbox.get_messages_storage();
        };
        
        $scope.get_message_picture_subtitle = function (message) {
            if (message[network_inbox.MESSAGE_KEY_SOURCE]
                == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.SERVER])
            {
                return 'Admin';

            }
            else if (message[network_inbox.MESSAGE_KEY_SOURCE]
                == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.CLIENT])
            {
                return 'You';
            }
        };
        
        $scope.is_client_message = function (message)
        {
            return (message[network_inbox.MESSAGE_KEY_SOURCE]
            == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.CLIENT]);
        };

        $scope.get_message_picture = function(message)
        {
            if (message[network_inbox.MESSAGE_KEY_SOURCE]
                == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.SERVER])
            {
                return user_credentials.guest_profile_image;

            }
            else if (message[network_inbox.MESSAGE_KEY_SOURCE]
                == network_inbox.MESSAGE_SOURCES[network_inbox.MESSAGE_SOURCES.CLIENT])
            {
                return user_credentials.profile_image;
            }
            return '';
        };

        $scope.get_message_text_bubbles = function (message)
        {
            return message[network_inbox.MESSAGE_KEY_MESSAGE];
        };

        $scope.init();

        $scope.slidemenu_open = function ()
        {

            app.slidingMenu.toggleMenu();
        };
    }
])
    .directive('constantFocus', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){

                element[0].addEventListener('focusout', function(e){
                    element[0].focus();
                });
            }
        };
    })
;