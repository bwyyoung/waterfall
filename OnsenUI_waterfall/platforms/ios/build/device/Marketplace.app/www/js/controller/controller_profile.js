

var scope_profile;

Acacia.controller('profile',  ['$scope', '$window','$timeout', 'user_credentials','service_alert', 'network_message_profile',
    function($scope, $window, $timeout, user_credentials, service_alert, network_message_profile)
    {
        scope_profile = $scope;
        $scope.address = {};
        $scope.bank = {};
        $scope.init = function () {
            debug_log('scope profile INIT');

            $scope.withdraw_data = {};
            $scope.withdraw_data.profile_image = user_credentials.profile_image;
            $scope.setProfileImage = {
                'background-image': 'url(' + $scope.withdraw_data.profile_image +')'
            };
            $scope.withdraw_data.username = user_credentials.username;
            $scope.withdraw_data.level = user_credentials.level;
            $scope.withdraw_data.withdraw = user_credentials.withdraw;
            $(document).on(EVENT_BACKBUTTON,
                function() {
                    if (!isNull($scope.update_address_country))
                    {
                        if ($scope.update_address_country.countrySelect('isCountryOpen'))
                            return $scope.update_address_country.countrySelect('closeDropDown');
                    }
                    else if (!isNull($scope.update_address_city))
                    {
                        if ($scope.update_address_city.citySelect('isCityOpen'))
                            return $scope.update_address_city.citySelect('closeDropDown');
                    }
                    $scope.nav_profile_poppage();
                }
            );
        };


        $scope.slidemenu_open = function ()
        {

            $('#special_hide').prop('disabled', false);
            scope_apply($scope);

            $timeout(
                function() {
                    app.slidingMenu.toggleMenu()
                }, 100);
        };

        $scope.is_menu_open = function () {
            return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
        };

        $scope.$on("$destroy", function()
        {
            debug_log('controller profile destroy');
            $(document).off(EVENT_BACKBUTTON);
        });

        $scope.init();
        
        $scope.init_withdraw_box = function () {
            setup_credit_box($scope, 'price');
        }
        $scope.get_user_level = function () {
            return user_credentials.level;
        }
        $scope.get_username = function () {
            return user_credentials.name;
        }
        $scope.get_email = function () {
            return user_credentials.email;
        }
        $scope.get_phone_number = function () {
            return user_credentials.phone_number;
        }
        $scope.get_dob = function () {
            return user_credentials.dob;
        }
        $scope.show_form_addcredit = function ()
        {
            scope_slidemenu_left.show_form_addcredit();
        }
        
        $scope.update_address_country_change = function ()
        {
            $scope.address.country = $scope.update_address_country.countrySelect("getSelectedCountryData").iso2.toUpperCase();
            var cities = require_country_city.getCities($scope.update_address_country.val());
            $scope.update_address_city.citySelect("destroy");
            $scope.update_address_city.citySelect(
                {
                    cities_displayed: cities
                }
            );
            $scope.address.city = DEFAULT_CITY;
            if (isNull(cities))
                $scope.address.city = 'N/A';
            $scope.check_update_address();
            scope_apply($scope);
        }
        
        
        $scope.init_update_address = function ()
        {

            $scope.update_address_country = $("#country");
            $scope.update_address_country.countrySelect(
                {
                    responsiveDropdown: true
                }
            );

            $scope.update_address_country.change(function ()
            {
               $scope.update_address_country_change();
            });
            
            $scope.update_address_city = $("#city");
            $scope.update_address_country_change();
            $scope.update_address_city.change(function ()
            {
                $scope.address.city = $scope.update_address_city.val();
                debug_log('update_address_city.change ' + $scope.address.city);
                $scope.check_update_address();
                scope_apply($scope);
            });

            /*var country_city_data = require_country_city.getCountries();
            var countryData =  $scope.update_address_country.countrySelect.getCountryData();
            for(var i = 0; i < countryData.length; i++){
                var found = false;
                var thing = countryData[i];

                for (var j = 0; j < country_city_data.length; j++)
                {
                    if (thing.name.includes(country_city_data[j]))
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    debug_log(i + '|' + thing.name);
            }*/

        }

        $scope.nav_profile_poppage = function ()
        {
            if (nav_profile.getPages().length > 1)
                nav_profile.popPage({ animation: 'none' });
        }

        $scope.get_credit_formatted_string = function ()
        {
            var symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
            var symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];
            return format_dollar_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT, user_credentials.credit.toString())
        }

        $scope.password_reset_verify = function(password, confirmpassword, match, password_dirty)
        {
            return scope_registration.password_reset_verify(password, confirmpassword, match, password_dirty);
        }
        $scope.get_error_message = function ()
        {
            return scope_registration.error_message;
        }

        $scope.click_confirm_profile_update_password = function()
        {
            //net code
            service_alert.create_alert(service_alert.ALERT_PASSWORD_UPDATE_SUCCESS).
            then(function (dialog)
            {
                dialog.on('postshow', function()
                {
                    $scope.nav_profile_poppage();
                });
            });
        }

        $scope.clear_update_address = function ()
        {
            $scope.address= {};
        }
        
        $scope.clear_update_bank_details = function () {
            $scope.bank = {};
        }

        $scope.check_update_bank_details = function ()
        {
            $scope.bank_error_message = '';
            
            if (isNull($scope.bank.name) || string_empty($scope.bank.name))
            {
                $scope.bank_error_message = 'Please input Payment Bank.';
                return true;
            }
            else if (isNull($scope.bank.account) || string_empty($scope.bank.account))
            {
                $scope.bank_error_message = 'Please input Account Number.';
                return true;
            }
            else if (isNull($scope.bank.account_type) || string_empty($scope.bank.account_type))
            {
                $scope.bank_error_message = 'Please input Account Type.';
                return true;
            }
            else if (isNull($scope.bank.branch) || string_empty($scope.bank.branch))
            {
                $scope.bank_error_message = 'Please input Branch Name.';
                return true;
            }
            else if (isNull($scope.bank.account_holder_name) || string_empty($scope.bank.account_holder_name))
            {
                $scope.bank_error_message = 'Please input Account Holder Name.';
                return true;
            }
            return false;
        }

        $scope.check_update_address = function () {
            $scope.address_error_message = '';

            debug_log('check update address '  + ( $scope.address.city == DEFAULT_CITY)
             +  string_empty($scope.address.state));
            if (isNull($scope.address.number) || string_empty($scope.address.number))
            {
                $scope.address_error_message = 'Please input home address.';
                return true;
            }
            else if (isNull($scope.address.street) || string_empty($scope.address.street))
            {
                $scope.address_error_message = 'Please input street address.';
                return true;
            }
            else if (isNull($scope.address.village) || string_empty($scope.address.village))
            {
                $scope.address_error_message = 'Please input village.';
                return true;
            }

            else if (isNull($scope.address.state) || string_empty($scope.address.state))
            {
                $scope.address_error_message = 'Please input state.';
                return true;
            }
            else if (isNull($scope.address.postcode) || string_empty($scope.address.postcode))
            {
                $scope.address_error_message = 'Please input postcode.';
                return true;
            }
            else if (isNull($scope.address.country) || string_empty($scope.address.country))
            {
                $scope.address_error_message = 'Please input country.';
                return true;
            }
            else if ( $scope.address.city == DEFAULT_CITY)
            {
                $scope.address_error_message = 'Please input city.';
                return true;
            }
            return false;
        }
        
        $scope.click_update_address = function()
        {
            network_message_profile.message_update_investor_address($scope.address);
        }

        $scope.click_submit_withdraw = function()
        {
            nav_profile.pushPage('profile/profile_withdraw_update_bank_details.html');
        }
        
        $scope.click_update_bank_details = function () {
            network_message_profile.message_update_bank_details($scope.bank);
        }
        
        $scope.click_cancel_withdraw = function()
        {
            $scope.withdraw_data.input_withdraw = '';
            $('.clearable_dollar').val('');
            destroy_credit_box();
            $scope.nav_profile_poppage();
        }



        $scope.check_input_withdraw_before_submit = function ()
        {
            if (isNull($scope.withdraw_data))
                return true;
            if (isNull($scope.withdraw_data.input_withdraw))
                return true;

            //update with val in case user presses X Delete Button
            $scope.withdraw_data.input_withdraw = $('.clearable_dollar').val();

            $scope.withdraw_data.input_withdraw_numeric = parseInt($scope.withdraw_data.input_withdraw.split(/ /)[0].replace(/[^\d]/g, ''));
           // debug_log('numeric withdraw ' + $scope.withdraw_data.input_withdraw_numeric + ' | ' + $('.clearable_dollar').val());
            if ($scope.withdraw_data.input_withdraw_numeric >= DEFAULT_CREDIT_ADD_MINIMUM)
                return false;
            return true;
        }
    }
]
);
