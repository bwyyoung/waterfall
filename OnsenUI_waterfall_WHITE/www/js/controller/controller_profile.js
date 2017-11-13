var scope_profile;
/**
 * @controller profile
 * @desc controller for profile set of pages
 * - run with ons-navigator for:
 *      -update address
 *      -update password
 *      -update bank details
 *      -withdraw
 * - add credit not included as part of this controller.
 */
waterfall.controller('profile', ['$scope', '$window', '$timeout', 'user_credentials', 'service_alert', 'network_message_profile', 'network_upload_file',
        function ($scope, $window, $timeout, user_credentials, service_alert, network_message_profile,
                  network_upload_file) {
            scope_profile = $scope;
            $scope.address = {};
            $scope.bank = {};

            /**
             * @function init
             * @desc initialisation function
             * - reset data objects for withdraw, profile image, etc.
             * - setup events for backbutton, keyboard up, keyboard down.
             */
            $scope.init = function () {
                $scope.withdraw_data = {};
                $scope.withdraw_data.profile_image = user_credentials.profile_image;
                $scope.user_credentials_reference = user_credentials;
                $scope.setProfileImage = {
                    'background-image': 'url(' + $scope.withdraw_data.profile_image + ')'
                };
                $scope.withdraw_data.username = user_credentials.username;
                $scope.withdraw_data.level = user_credentials.level;
                $scope.withdraw_data.withdraw = user_credentials.withdraw;
                $scope.network_upload_file_reference = network_upload_file;
                $(document).on(EVENT_BACKBUTTON,
                    function () {
                        if (!isNull($scope.update_address_country)) {
                            if ($scope.update_address_country.countrySelect('isCountryOpen'))
                                return $scope.update_address_country.countrySelect('closeDropDown');
                        }
                        else if (!isNull($scope.update_address_city)) {
                            if ($scope.update_address_city.citySelect('isCityOpen'))
                                return $scope.update_address_city.citySelect('closeDropDown');
                        }
                        $scope.nav_profile_poppage();
                    }
                );
                $(document).on(EVENT_KEYBOARD_UP,
                    function (event, keyboard_height) {

                    });
                $(document).on(EVENT_KEYBOARD_DOWN,
                    function () {
                        $('#div_withdraw_1').scrollTop(0);
                    }
                );
            };

            /**
             * @function show_camera_dialog
             * @desc display the dialog for camera.
             */
            $scope.show_camera_dialog = function () {
                service_alert.create_alert(service_alert.ALERT_CAMERA_OPTIONS).then(
                    function (dialog) {
                        dialog.on('posthide', function () {
                        });
                    });
            };

            $scope.slidemenu_open = function () {
                app.slidingMenu.toggleMenu();
            };

            $scope.is_menu_open = function () {
                return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
            };

            /**
             * @function destroy
             * @desc destroy function called when controller dies
             * - backbutton, keyboard up, and down events.
             * - clear update address fields.
             */
            $scope.$on("$destroy", function () {
                debug_log('controller profile destroy');
                $(document).off(EVENT_BACKBUTTON);
                $(document).off(EVENT_KEYBOARD_UP);
                $(document).off(EVENT_KEYBOARD_DOWN);
                $scope.clear_update_address();
            });

            $scope.init();

            /**
             * @function init_withdraw_box
             * @desc setup the credit box used for withdrawals.
             */
            $scope.init_withdraw_box = function () {
                setup_credit_box($scope, 'price');
            };
            $scope.get_user_level = function () {
                return user_credentials.level;
            };
            $scope.get_username = function () {
                return user_credentials.name;
            };
            $scope.get_email = function () {
                return user_credentials.email;
            };
            $scope.get_phone_number = function () {
                return user_credentials.phone_number;
            };
            $scope.get_dob = function () {
                return user_credentials.dob;
            };
            $scope.show_form_addcredit = function () {
                scope_slidemenu_left.show_form_addcredit();
            };

            /**
             * @function update_address_country_change
             * @desc when country value changes in address updating field, we update the possible city input values
             * based on that country.
             */
            $scope.update_address_country_change = function () {
                $scope.address.country = $scope.update_address_country.countrySelect("getSelectedCountryData").iso2.toUpperCase();

                //from our requirejs bundle, we do a get array of cities, based on the country input.
                var cities = require_country_city.getCities($scope.update_address_country.val());
                $scope.update_address_city.citySelect("destroy");
                $scope.update_address_city.unbind();
                $scope.update_address_city = $("#city");

                //initialise the city input field, with array of cities
                $scope.update_address_city.citySelect(
                    {
                        cities_displayed: cities
                    }
                );
                //reset input of city to default city text('please select')
                $scope.address.city = DEFAULT_CITY;
                if (isNull(cities)) {
                    $scope.address.city = 'N/A';
                    $scope.update_address_city.prop('disabled', true);
                }
                else {
                    $scope.update_address_city.prop('disabled', false);
                    $scope.update_address_city.suggest(cities,
                        {
                            suggestionColor: '#6b6b6b',
                            moreIndicatorClass: 'suggest-more',
                            moreIndicatorText: ''
                        });
                    $scope.update_address_city.change(function () {
                        $scope.update_address_city_change();
                    });
                }
                //recheck address input, then apply the scope to the screen
                $scope.check_update_address();
                scope_apply($scope);
            };

            /**
             * @function update_address_city_change
             * @desc when city input changes, we do verification of that change,
             * as well as update our form value of that city.
             */
            $scope.update_address_city_change = function () {
                $scope.address.city = $scope.update_address_city.val();
                $scope.check_update_address();
                scope_apply($scope);
            };

            /**
             * @function update_address_back
             * @desc when pressing back during update address, check:
             * - country dropdown open
             * - city dropdown open
             * if either of these are open, close them.
             * if not, then go ahead back to profile screen
             */
            $scope.update_address_back = function () {

                if (!isNull($scope.update_address_country)) {
                    if ($scope.update_address_country.countrySelect('isCountryOpen')) {
                        $scope.update_address_country.countrySelect('closeDropDown');
                        return;
                    }
                }

                if (!isNull($scope.update_address_city)) {

                    if ($scope.update_address_city.citySelect('isCityOpen')) {
                        $scope.update_address_city.citySelect('closeDropDown');
                        return;
                    }
                }

                $scope.nav_profile_poppage();
                $scope.clear_update_address();
            };

            /**
             * @function init_update_address
             * @desc initialise the update address screen
             * - country select
             * - city select
             * - set country to local sim country
             * - if there is already an address gotten from server, we finally fill it with that data instead.
             */
            $scope.init_update_address = function () {

                $scope.update_address_country = $("#country");
                $scope.update_address_country.unbind();
                $scope.update_address_country.countrySelect(
                    {
                        responsiveDropdown: true
                    }
                );

                $scope.update_address_country.change(function () {
                    $scope.update_address_country_change();
                });

                //autocomplete suggestion library
                $scope.update_address_country.suggest($scope.update_address_country.countrySelect('getCountryNamesArray'),
                    {
                        suggestionColor: '#6b6b6b',
                        moreIndicatorClass: 'suggest-more',
                        moreIndicatorText: ''
                    });

                $scope.update_address_city = $("#city");
                $scope.update_address_country_change();
                $scope.update_address_city.change(function () {
                    $scope.update_address_city_change();
                });

                if (!isNull(SIM_INFO) && !isNull(SIM_INFO['countryCode'])) {
                    $scope.address.country = SIM_INFO['countryCode'];
                    $scope.update_address_country.countrySelect('setCountry_Code', SIM_INFO['countryCode']);
                    $scope.update_address_country_change();
                }
                $scope.prefill_address();
            };


            /**
             * @function prefill_address
             * @desc prefill the address with address data obtained from server during login
             */
            $scope.prefill_address = function () {
                var user_address = user_credentials.address_object;
                if (isNull(user_address))
                    return;
                if (user_address[network_message_profile.MESSAGE_KEY_COUNTRY].length >= 2) {
                    $scope.update_address_country.countrySelect('setCountry_Code', user_address[network_message_profile.MESSAGE_KEY_COUNTRY]);
                    $scope.update_address_country_change();
                    $scope.address.city = user_address[network_message_profile.MESSAGE_KEY_CITY];
                    $scope.update_address_city.val(
                        user_address[network_message_profile.MESSAGE_KEY_CITY]
                    );
                    $('.flag').css({display: 'block'});//display country flag
                }
                $scope.address.number = user_address[network_message_profile.MESSAGE_KEY_ADDRESSLINE1];
                $scope.address.street = user_address[network_message_profile.MESSAGE_KEY_STREET];
                $scope.address.village = user_address[network_message_profile.MESSAGE_KEY_VILLAGE];
                $scope.address.state = user_address[network_message_profile.MESSAGE_KEY_PROVINCE];
                $scope.address.postcode = user_address[network_message_profile.MESSAGE_KEY_POSTAL_CODE];

                scope_apply($scope);
            };

            $scope.nav_profile_poppage = function () {
                if (nav_profile.getPages().length > 1)
                    nav_profile.popPage({animation: 'none'});
                else
                    scope_slidemenu_left.page_load_home();
            };

            $scope.get_credit_formatted_string = function () {
                var symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
                var symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];
                return format_symbol_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT, user_credentials.credit.toString())
            };

            /**
             * @function password_reset_verify
             * @desc verify the password change using the existing function from registration controller.
             * @param password
             * the new password
             * @param confirmpassword
             * the new password input a second time
             * @param match
             * are the 2 passwords matching?
             * @param password_dirty
             * is the form dirty, and has the user actualy put in ANY input?
             * @returns {boolean}
             * if true, input is invalid
             */
            $scope.password_reset_verify = function (password, confirmpassword, match, password_dirty) {
                return scope_registration.password_reset_verify(password, confirmpassword, match, password_dirty);
            };
            $scope.get_error_message = function () {
                return scope_registration.error_message;
            };

            $scope.click_confirm_profile_update_password = function () {
                //net code
                service_alert.create_alert(service_alert.ALERT_PASSWORD_UPDATE_SUCCESS).then(function (dialog) {
                    dialog.on('postshow', function () {
                        $scope.nav_profile_poppage();
                    });
                });
            };

            /**
             * @function clear_update_address
             * @desc clear form for update address
             */
            $scope.clear_update_address = function () {
                $scope.address = {};
                $('.login-form').off();

                if (!isNull($scope.update_address_country)) {
                    $scope.update_address_country.countrySelect("destroy");
                    $scope.update_address_country.unbind();
                }
                if (!isNull($scope.update_address_city)) {
                    $scope.update_address_city.citySelect("destroy");
                    $scope.update_address_city.unbind();
                }
            };

            $scope.clear_update_bank_details = function () {
                $scope.bank = {};
            };

            /**
             * @function check_update_bank_details
             * @desc verify the bank details input by user
             * @returns {boolean}
             * if true, there is an invalid element, and an error message will be written on the form.
             */
            $scope.check_update_bank_details = function () {
                $scope.bank_error_message = '';

                if (isNull($scope.bank.name) || string_empty($scope.bank.name)) {
                    $scope.bank_error_message = 'Please input Payment Bank.';
                    return true;
                }
                else if (isNull($scope.bank.account) || string_empty($scope.bank.account)) {
                    $scope.bank_error_message = 'Please input Account Number.';
                    return true;
                }
                else if (isNull($scope.bank.account_type) || string_empty($scope.bank.account_type)) {
                    $scope.bank_error_message = 'Please input Account Type.';
                    return true;
                }
                else if (isNull($scope.bank.branch) || string_empty($scope.bank.branch)) {
                    $scope.bank_error_message = 'Please input Branch Name.';
                    return true;
                }
                else if (isNull($scope.bank.account_holder_name) || string_empty($scope.bank.account_holder_name)) {
                    $scope.bank_error_message = 'Please input Account Holder Name.';
                    return true;
                }
                return false;
            };

            /**
             * @function check_update_address
             * @desc verify the address details input by user
             * @returns {boolean}
             * if true, there is an invalid element, and an error message will be written on the form.
             */
            $scope.check_update_address = function () {
                $scope.address_error_message = '';

                debug_log('check update address ' + ( $scope.address.city == DEFAULT_CITY)
                    + string_empty($scope.address.state));
                if (isNull($scope.address.number) || string_empty($scope.address.number)) {
                    $scope.address_error_message = 'Please input home address.';
                    return true;
                }
                else if (isNull($scope.address.street) || string_empty($scope.address.street)) {
                    $scope.address_error_message = 'Please input street address.';
                    return true;
                }
                else if (isNull($scope.address.village) || string_empty($scope.address.village)) {
                    $scope.address_error_message = 'Please input village.';
                    return true;
                }

                else if (isNull($scope.address.state) || string_empty($scope.address.state)) {
                    $scope.address_error_message = 'Please input state.';
                    return true;
                }
                else if (isNull($scope.address.postcode) || string_empty($scope.address.postcode)) {
                    $scope.address_error_message = 'Please input postcode.';
                    return true;
                }
                else if (isNull($scope.address.country) || string_empty($scope.address.country)) {
                    $scope.address_error_message = 'Please input country.';
                    return true;
                }
                else if ($scope.address.city == DEFAULT_CITY) {
                    $scope.address_error_message = 'Please input district/town/city.';
                    return true;
                }
                return false;
            };

            $scope.click_update_address = function () {
                network_message_profile.message_update_investor_address($scope.address);
            };

            $scope.click_submit_withdraw = function () {
                nav_profile.pushPage('profile/profile_withdraw_update_bank_details.html');
            };

            $scope.click_update_bank_details = function () {
                network_message_profile.message_update_bank_details($scope.bank);
            };

            $scope.click_cancel_withdraw = function () {
                $scope.withdraw_data.input_withdraw = '';
                $('.clearable_dollar').val('');
                destroy_credit_box();
                $scope.nav_profile_poppage();
            };

            /**
             * @function check_input_withdraw_before_submit
             * @desc check withdraw data input by user, before allowing them to submit the credit they input
             * @returns {boolean}
             * if true, data is valid
             */
            $scope.check_input_withdraw_before_submit = function () {
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
            };
        }
    ]
).directive(
    'profileImg', ['network_upload_file', function () {
        /**
         * @directive profileImg
         * @desc when user updates his profile image using the camera dialog, we do an image upload to the server.
         * If the upload is successful, we change the user's profile picture on the application side.
         */
        return function (scope, element, attrs, network_upload_file) {
            scope.$watch('user_credentials_reference.captured_image_base64_data', function (newVal, oldVal) {
                    if (scope.user_credentials_reference.captured_image_base64_data == null)
                        return;
                    scope.network_upload_file_reference.message_upload_photo(scope.user_credentials_reference.captured_image_base64_data, DEFAULT_FILE_PROFILE_PHOTO, uploaded, false);

                    function uploaded(success, data_object) {
                        scope.user_credentials_reference.captured_image_base64_data = null;
                        if (!success)
                            return;
                        scope.withdraw_data.profile_image = scope.user_credentials_reference.profile_image = data_object[scope.user_credentials_reference.MESSAGE_KEY_PROFILE_PHOTO_URL];
                        var url = scope.withdraw_data.profile_image;
                        element.css({
                            'background-image': 'url(' + url + ')',
                            'background-size': 'cover'
                        });
                        scope_apply(scope);
                        scope_apply(scope_slidemenu_left);
                    }

                }
            );
        };
    }]
);
