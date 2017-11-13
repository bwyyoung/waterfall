
var scope_credit;

waterfall.controller('credit', ['$scope', '$window', '$timeout', 'user_credentials','network_credit',
    function($scope, $window,$timeout, user_credentials, network_credit)
    {
        scope_credit = $scope;
        
        $scope.get_credit_formatted_string = function ()
        {
            var symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
            var symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];
            return DEFAULT_CURRENCY_NUMBER_FORMAT.format($scope.credit_data.credit).replace(symbol, symbol_native);
        };

        $scope.nav_credit_poppage = function ()
        {
            if (nav_credit.getPages().length > 1)
            {
                nav_credit.popPage({ animation: 'simpleslide' });
                return true;
            }
            return false;
        };

        $scope.init_credit_box = function () {
            setup_credit_box($scope, 'price');
        };

        
        $scope.init = function () {
            debug_log('scope credit started');

            $scope.credit_data = {};
            $scope.credit_data.profile_image = user_credentials.profile_image;
            $scope.setProfileImage = {
                'background-image': 'url(' + $scope.credit_data.profile_image +')'
            };
            $scope.credit_data.username = user_credentials.name;
            $scope.credit_data.level = user_credentials.level;
            $scope.credit_data.credit = user_credentials.credit;

            $timeout(function () {
                $(document).on( EVENT_BACKBUTTON,
                    function()
                    {
                        debug_log('backbutton cancel credit');
                        $scope.Click_Cancel_Credit();
                    }
                );
                $(document).on( EVENT_KEYBOARD_UP,
                    function(event, keyboard_height)
                    {

                    });
                $(document).on( EVENT_KEYBOARD_DOWN,
                    function()
                    {
                        $('#div_add_credit_1').scrollTop(0);
                    }
                );
            }, 500);

        };
        
        $scope.init();
        
        $scope.check_input_credit_before_submit = function ()
        {

            if (isNull($scope.credit_data))
                return true;
            if (isNull($scope.credit_data.input_credit))
                return true;

            //update with val in case user presses X Delete Button
            $scope.credit_data.input_credit = $('.clearable_dollar').val();

            $scope.credit_data.input_credit_numeric = parseInt($scope.credit_data.input_credit.split(/ /)[0].replace(/[^\d]/g, ''));
            debug_log('numeric credit ' + $scope.credit_data.input_credit_numeric + ' | ' + $('.clearable_dollar').val());
            if ($scope.credit_data.input_credit_numeric >= DEFAULT_CREDIT_ADD_MINIMUM)
                return false;
            return true;
        }

        $scope.Click_Cancel_Credit =  function ()
        {
            dialog_credit.hide();
            dialog_credit.destroy();
        }

        $scope.Click_Submit_Credit = function ()
        {
            network_credit.add_credit( $scope.credit_data.input_credit_numeric, DEFAULT_CURRENCY, $scope);
        }

        $scope.update_credit_info = function()
        {
            $scope.credit_data.added_credit_string = $scope.credit_data.input_credit;
            $scope.credit_data.added_credit_int = $scope.credit_data.input_credit_numeric;

            $scope.credit_data.level = $scope.credit_data.level; // TODO: How do we find out more about levels?
            user_credentials.level = $scope.credit_data.level ;
            user_credentials.credit = $scope.credit_data.credit + $scope.credit_data.added_credit_int;
            $scope.credit_data.credit_balance_new = format_dollar_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT,
                (user_credentials.credit).toString());

        }

        $scope.$on("$destroy", function()
        {
            destroy_credit_box();

            $(document).off(EVENT_BACKBUTTON);

            $(document).off(EVENT_KEYBOARD_UP);
            $(document).off(EVENT_KEYBOARD_DOWN);
        });
    }
]

);