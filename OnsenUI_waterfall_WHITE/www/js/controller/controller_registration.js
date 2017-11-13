var scope_registration;

/**
 * @class registration
 * @desc This controller handles screen logic involving
 * user signup, user login, and login as guest.
 *
 */
waterfall.controller('registration',
    ['$scope', '$window', '$timeout', 'user_credentials', 'service_alert', 'network_message_registration', 'network_updates', 'network_upload_file', 'lokijs_database', 'network_message_profile',
        function ($scope, $window, $timeout, user_credentials, service_alert, network_message_registration, network_updates, network_upload_file, lokijs_database,
                  network_message_profile) {
            //global reference to local scope.
            scope_registration = $scope;

            //placeholder image for signup screen.
            $scope.imgURI_PlaceHolder = "css/custom_images/icons/photo.png";
            $scope.temp_login_email = '';
            $scope.error_message = '';
            $scope.birthday = null;
            $scope.temp_password = '';
            $scope.setnewpassword = true;//net code

            //objects used to contain data from various forms.
            $scope.form = {};
            $scope.signup = {};
            $scope.newpassword = {};
            $scope.login = {};

            //localised reference to user credentials service,
            //to be put in scope for custom directives, and watch.
            $scope.user_credentials_reference = user_credentials;

            /**
             * @function init
             * @desc initialisation function for class.
             */
            $scope.init = function () {

                // backbutton event create
                $(document).on(EVENT_BACKBUTTON,
                    function () {
                        //if a dialog alert is shown on screen, ignore.
                        if (!service_alert.alert_cleared.value)
                            return;
                        //if phone input dropdown is shown, close it, rather than navigate the screen backwards.
                        if (!isNull($scope.phoneinput))
                            if ($scope.phoneinput.intlTelInput('isDropDownOpen'))
                                return $scope.phoneinput.intlTelInput('closeDropDown');
                        //if country input dropdown is shown, close it, rather than navigate the screen backwards.
                        if (!isNull($scope.update_signup_country))
                            if ($scope.update_signup_country.countrySelect('isCountryOpen'))
                                return $scope.update_signup_country.countrySelect('closeDropDown');
                        //otherwise, pop page on the navigator. If there are no more pages to pop, and we are at
                        //the bottom fot the stack, show confirmation to quit.
                        if (!$scope.nav_registration_poppage())
                            $scope.show_quit_marketplace_confirm();
                    }
                );

                //workaround for splashscreen not hiding on some app bootups.
                //Force splash screen to hide manually.
                var is_android = ((navigator.userAgent.match(/Android/i)) == "Android");
                if (is_android && navigator && navigator.splashscreen)
                    navigator.splashscreen.hide();

                //if a user has already logged into this app, we login the user automatically,
                //rather than show
                if (lokijs_database.USER_FOUND)
                    $timeout(function () {
                        $scope.login_user(true);
                    }, 100);
            };

            /**
             * @function check_signup_back
             * @desc when user presses the back button during signup,
             * we check if the various dropdown menus are open, and close them first.
             * Basically, it is the same functionality as the event backbutton in init().
             */
            $scope.check_signup_back = function () {
                if (!isNull($scope.phoneinput))
                    if ($scope.phoneinput.intlTelInput('isDropDownOpen')) {
                        $scope.phoneinput.intlTelInput('closeDropDown');
                        return;
                    }
                if (!isNull($scope.update_signup_country))
                    if ($scope.update_signup_country.countrySelect('isCountryOpen')) {
                        $scope.update_signup_country.countrySelect('closeDropDown');
                        return;
                    }
                $scope.nav_registration_poppage();
                $scope.reset_signup();
            };

            /**
             * @function show_quit_marketplace_confirm
             * @desc show a confirmation dialog asking if user really wants to quit.
             */
            $scope.show_quit_marketplace_confirm = function () {
                navigator.notification.confirm(
                    'Do you really want to exit?',
                    $scope.exitFromApp,
                    'Exiting waterfall',
                    'Cancel,OK'
                );
            };

            /**
             * @function exitFromApp
             * @param buttonIndex
             * @desc if user clicks OK button, we will exit from Marketplace.
             */
            $scope.exitFromApp = function (buttonIndex) {
                if (buttonIndex == 2) {
                    cordova.plugins.notification.local.cancelAll();
                    navigator.app.exitApp();
                    if ((navigator.userAgent.match(/Android/i)) == "Android")
                        android_quit.quit_android();
                }
            };

            //When class is destroyed, ensure that all events are removed.
            $scope.$on("$destroy", function () {
                $(document).off(EVENT_BACKBUTTON);
            });

            /**
             * @function is_profile_photo_blank
             * @desc check if user has already taken a profile picture
             * @returns {boolean}
             */
            $scope.is_profile_photo_blank = function () {
                return isNull($scope.user_credentials_reference.captured_image_base64_data);
            };

            /**
             * @function nav_registration_poppage
             * @desc pop pages based on onsen navigation stacks.
             * If there is only one page left, return false.
             * @returns {boolean}
             */
            $scope.nav_registration_poppage = function () {
                if (nav_registration.getPages().length > 1) {
                    nav_registration.popPage({animation: 'simpleslide'});
                    return true;
                }
                return false;
            };

            /**
             * @function page_load_signup
             * @desc load signup page by pushing it on navigation stack.
             */
            $scope.page_load_signup = function () {
                executeAsync(function () {
                    $('#special_hide').prop('disabled', true);
                });
                nav_registration.pushPage('registration/signup.html', {animation: 'simpleslide'});
            };

            /**
             * @function page_load_confirm_signup
             * @desc load page by pushing it on navigation stack.
             */
            $scope.page_load_confirm_signup = function () {

                $scope.signup.phonenumber = $scope.phoneinput.intlTelInput("getNumber") + "";
                nav_registration.pushPage('registration/signup_confirm.html', {animation: 'simpleslide'});
            };

            /**
             * @function page_load_login
             * @desc load page by pushing it on navigation stack.
             */
            $scope.page_load_login = function () {
                executeAsync(function () {
                    $('#special_hide').prop('disabled', true);
                });
                nav_registration.pushPage('registration/login.html', {animation: 'simpleslide'});
            };

            /**
             * @function forgot_password
             * @desc create an alert dialog asking for email input.
             */
            $scope.forgot_password = function () {
                service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT).then(
                    function (dialog) {
                        dialog.on('preshow', function (event) {
                            debug_log('forgot password preshow');
                        });
                        dialog.on('posthide', function (event) {

                        });
                    }
                );
            };

            /**
             * @function reset_signup
             * @desc reset signup page by resetting all variables associated with images, forms, etc.
             */
            $scope.reset_signup = function () {
                $scope.user_credentials_reference.captured_image_base64_data = null;
                $scope.signup = {};
                $scope.form = {};
                $scope.newpassword = {};
                $scope.birthday = null;
            };

            /**
             * @function password_reset_email_validate
             * @desc submit valid email to server using network_message_registration service, in order to reset password.
             */
            $scope.password_reset_email_validate = function (user_email) {
                //hide the previous alert dialog. we are going to show another loading screen, or error dialog.
                alertdialog.hide();
                var email_valid = true;
                if (isNull(user_email))
                    email_valid = false;
                if (!email_valid) {
                    service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INVALID).then(
                        function (dialog) {
                            dialog.on('prehide', function () {
                                service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT);
                            });
                        });
                }
                else
                    network_message_registration.message_reset_password_email_submit(user_email);
            };

            /**
             * @function password_reset_verify
             * when user needs to set a new password, as specified by the server,
             * we check for the input validity, and show an error message accordingly.
             * @param password
             * 1st password field
             * @param confirmpassword
             * 2nd password field
             * @param match
             * if passwords do not match, true.
             * @param password_dirty
             * only begin verification if form is dirty
             * @returns {boolean}
             * if true, disable submit button
             */
            $scope.password_reset_verify = function (password, confirmpassword, match, password_dirty) {
                if (!password_dirty)
                    return false;

                $scope.error_message = '';

                if (password) {
                    $scope.error_message = 'Field - New Password Required';
                    return true;
                }
                else if (confirmpassword) {
                    $scope.error_message = 'Field - Confirm Password Required';
                    return true;
                }
                else if (match) {
                    $scope.error_message = 'Passwords do not match';
                    return true;
                }
                return false;
            };

            /**
             * @function click_password_reset_confirm
             * submit new password for
             * @param newpassword
             */
            $scope.click_password_reset_confirm = function (newpassword) {
                network_message_registration.message_newpassword_confirm($scope.temp_login_email, $scope.temp_password, newpassword);
            };

            /**
             * @function check_input_login
             * @desc validate user login
             * @param login
             * check login object for valid input
             * @returns {boolean}
             * if valid login, return false.
             */
            $scope.check_input_login = function (login) {
                if (isNull(login.user_email) || isNull(login.user_password)) {
                    button_login.setDisabled(true);
                    return true;
                }
                else {
                    $scope.temp_login_email = login.user_email;
                    button_login.setDisabled(false);
                    return false;
                }
            };

            /**
             * @function check_input_login
             * @desc validate user login
             * @param login
             * check login object for valid input
             * @returns {boolean}
             * if valid login, return false.
             */
            $scope.click_login = function (login) {
                var login_valid = true;
                $scope.temp_password = login.user_password;
                if (isNull(login.user_email) || isNull(login.user_password))
                    login_valid = false;
                if (!login_valid)
                    service_alert.create_alert(service_alert.ALERT_LOGIN_INVALID);
                else {
                    debug_log('new user email ' + $scope.temp_login_email);
                    network_message_registration.message_login_user(login.user_email, login.user_password);
                }
            };

            /**
             * @function showCameraDialog
             * @desc show camera photo taking dialog
             */
            $scope.showCameraDialog = function () {
                service_alert.create_alert(service_alert.ALERT_CAMERA_OPTIONS).then(
                    function (dialog) {
                        dialog.on('prehide', function () {

                        });
                    });
            };

            /**
             * @function login_user
             * Login the user
             * @param isRegistered
             * If user is logging in as guest, true
             * If it is registered user with credentials, false
             */
            $scope.login_user = function (isRegistered) {
                executeAsync(function () {
                    //show all previously disabled elements, including sliding menu page content.
                    $('#special_hide').prop('disabled', true);
                });
                BOOL_USER_LOGGED_IN_REGISTERED = false;
                BOOL_USER_LOGGED_IN_GUEST = false;
                if (isRegistered) {
                    BOOL_USER_LOGGED_IN_REGISTERED = true;
                    //setup regular server pings for updates
                    network_updates.init_get_updates_interval();
                    //setup notifications to be initiated by the sliding menu controller.
                    scope_slidemenu_left.setup_notifications();
                    //get the latest investor address upon login, as it is a separate message
                    //from login itself.
                    network_message_profile.message_get_investor_address();
                }
                else
                    BOOL_USER_LOGGED_IN_GUEST = true;


                scope_slidemenu_left.cur_main_page = DEFAULT_HOME_URL;
                //setup the menu for display
                scope_slidemenu_left.setup_menu();

                //hide the registration dialog, if it exists.
                if (typeof dialog_registration != 'undefined') {
                    dialog_registration.hide();
                    dialog_registration.destroy();
                }
                //finally, force update ui with latest changes.
                scope_apply(scope_slidemenu_left);
            };

            /**
             * @function click_signup_submit
             * @desc signup submission of form data, and profile image.
             */
            $scope.click_signup_submit = function () {
                /**
                 * @function uploaded
                 * @desc callback function when photo and credentials are successfully sent.
                 * Resets signup form as well as photo taken locally on device.
                 */
                function uploaded() {
                    user_credentials.captured_image_base64_data = null;
                    $scope.signup = {};
                }

                $scope.signup.profile_image = $scope.user_credentials_reference.captured_image_base64_data;
                //using signup model 2, in order to send both form data, as well as profile picture.
                network_message_registration.message_signup2($scope.signup, uploaded);
            };

            /**
             * @function signup_phone_verify
             * @desc verify phone input, and show the appropriate error message if there is an error.
             * @returns {boolean}
             * if there is an error, return true, and show the error message on screen.
             */
            $scope.signup_phone_verify = function () {
                $scope.error_message = '';
                if ($scope.phoneinput.intlTelInput("isValidNumber") == false) {
                    var error = 'Invalid';
                    switch ($scope.phoneinput.intlTelInput("getValidationError")) {
                        case 1:
                            error = "Invalid country calling code";
                            break;
                        case 2:
                            error = "The string supplied is too short to be a phone number";
                            break;
                        case 3:
                            error = "The string supplied is too long to be a phone number";
                            break;
                        case 4:
                            error = "The string supplied did not seem to be a phone number";
                            break;
                    }
                    $scope.error_message = 'Phone Number - ' + error;

                    return true;
                }
                return false;
            };

            /**
             * @function signup_verify
             * verify entire signup form, including phone number
             * @param password_reset_error
             * if there is already an error with the password input field, dont bother verifying the others.
             * Password should work first as the first test.
             * @returns {boolean}
             * if all is OK, return false, and no error message is shown, and 'Next' button is enabled
             */
            $scope.signup_verify = function (password_reset_error) {
                if (password_reset_error)
                    return true;


                $scope.error_message = '';

                if (isNull($scope.signup.email)) {
                    $scope.error_message = 'Your email is invalid';
                    return true;
                }
                else if (isNull($scope.signup.firstname) || string_empty($scope.signup.firstname)) {
                    $scope.error_message = 'Please input first name';
                    return true;
                }
                else if (isNull($scope.signup.lastname) || string_empty($scope.signup.lastname)) {
                    $scope.error_message = 'Please input last name';
                    return true;
                }
                else if ($scope.signup_phone_verify())
                    return true;
                else if (isNull($scope.signup.birthday_day) || string_empty($scope.signup.birthday_day)) {
                    $scope.error_message = 'Please input birthday date';
                    return true;
                }
                else if (isNull(user_credentials.captured_image_base64_data)) {
                    $scope.error_message = 'Please take profile photo';
                    return true;
                }
                return false;
            };

            /**
             * @function init_signup
             * initialise signup sheet, and reset form data.
             */
            $scope.init_signup = function () {
                executeAsync(function () {
                    $('#special_hide').prop('disabled', true);
                });
                //reset signup form
                $scope.reset_signup();
                //setup phone input with verification and international prepended number
                $scope.phoneinput = $("#phone");
                $scope.phoneinput.intlTelInput(
                    {
                        utilsScript: "js/phone_number/utils.js",
                        separateDialCode: true,
                        disableDropdown: true,
                        showFlag: false
                    }
                );
                //when country changes for phone number, verify the currently typed phone number
                $scope.phoneinput.on("countrychange", function (e, countryData) {
                    $scope.signup_phone_verify();
                    scope_apply($scope);
                });
                $scope.init_update_country();
                $scope.current_date = null;
            };

            /**
             * @function init_update_country
             * @desc initialise the country input for signup
             *
             */
            $scope.init_update_country = function () {
                $scope.update_signup_country = $("#country");
                $scope.update_signup_country.unbind();
                $scope.update_signup_country.countrySelect(
                    {
                        responsiveDropdown: true
                    }
                );

                $scope.update_signup_country.change(function () {
                    $scope.update_signup_country_change();
                });

                //autocomplete function
                $scope.update_signup_country.suggest($scope.update_signup_country.countrySelect('getCountryNamesArray'),
                    {
                        suggestionColor: '#6b6b6b',
                        moreIndicatorClass: 'suggest-more',
                        moreIndicatorText: ''
                    });

                $scope.update_signup_country_change();
                //set default country based on sim card information
                if (!isNull(SIM_INFO) && !isNull(SIM_INFO['countryCode'])) {
                    $scope.signup.country = SIM_INFO['countryCode'];
                    $scope.update_signup_country.countrySelect('setCountry_Code', SIM_INFO['countryCode']);
                    $scope.phoneinput.intlTelInput('setCountry', $scope.signup.country);
                }
                $scope.update_signup_country.val('');
            };

            /**
             * @function update_signup_country_change
             * @desc update the ng-model for currently selected country, as well as the prepended phone number
             * for international codes.
             */
            $scope.update_signup_country_change = function () {
                $scope.signup.country = $scope.update_signup_country.countrySelect("getSelectedCountryData").iso2;
                $scope.phoneinput.intlTelInput('setCountry', $scope.signup.country);
                scope_apply($scope);
            };

            /**
             * @function show_birthday_native_datepicker
             * @desc on click, show the native datepicker with respect to Android & iOS
             */
            $scope.show_birthday_native_datepicker = function () {
                var myNewDate = new Date();
                //18 years of age
                myNewDate.setDate(myNewDate.getDate() - 6570);
                if ($scope.current_date != null)
                    myNewDate = $scope.current_date;
                // Same handling for iPhone and Android
                datePicker.show({
                        date: myNewDate,
                        mode: 'date', // date or time or blank for both
                        allowOldDates: true,
                        allowFutureDates: false,
                        minDate: Date.parse('01/01/1900'),
                        maxDate: Date.parse(myNewDate.toDateString()),
                        locale: 'en_us',
                        androidTheme: datePicker.THEME_DEVICE_DEFAULT_LIGHT
                    },
                    /**
                     * @desc callback function after date has been chosen.
                     * @param returnDate
                     */
                    function (returnDate) {
                        if (!returnDate)
                            return;
                        $scope.current_date = new Date(returnDate);
                        var locale = "en-us";
                        $scope.signup.birthday_day = ($scope.current_date.getDate()).toString();
                        $scope.signup.birthday_month = ($scope.current_date.toLocaleString(locale, {month: "long"}));
                        $scope.signup.birthday_year = ($scope.current_date.getFullYear()).toString();
                        $scope.error_message = '';
                        scope_apply($scope);
                    });
            };

            /**
             * @function init_bootstrap_datepicker
             * @desc initialise the datepicker based on the dom element.
             */
            $scope.init_bootstrap_datepicker = function () {
                if (!isNull($scope.birthday)) {
                    $(".datepicker.dropdown-menu").empty();
                    $(".datepicker.dropdown-menu").remove();
                }

                $scope.birthday = $('#birthday_picker').datepicker(
                    {
                        changeMonth: true,
                        changeYear: true,
                        autoclose: true,
                        startView: 2,
                        format: 'dd/mm/yyyy',
                        defaultDate: '01/01/1900',
                        startDate: '01/01/1900',
                        endDate: (new Date()).toDateString(),
                        directionReverse: true
                    }).datepicker('hide').on('hide', function (e) {
                    var date = {value: ''};
                    var locale = "en-us";
                    $scope.birthday.datepicker('getDateSelected', date);
                    $('#birthday_day').val(date.value.getDate());
                    $('#birthday_month').val(date.value.toLocaleString(locale, {month: "long"}));
                    $('#birthday_year').val(date.value.getFullYear());
                });
            };
            $scope.init();
        }
    ]
).directive(
    'signupImg', function () {
        return function (scope, element, attrs) {
            /**
             * @directive signupImg
             * @desc
             * Watch the variable captured_image_base64_data for changes.
             * When there is a change, update the css of the tagged signupImg element.
             */
            scope.$watch('user_credentials_reference.captured_image_base64_data', function (newVal, oldVal) {
                    var url;

                    if (scope.user_credentials_reference.captured_image_base64_data != null)
                        url = scope.user_credentials_reference.captured_image_base64_data;
                    else
                        url = scope.imgURI_PlaceHolder;

                    element.css({
                        'background-image': 'url(' + url + ')',
                        'background-size': 'cover'
                    });
                }
            );
        };
    })
    .directive("passwordVerify", function () {
        /**
         * @directive passwordVerify
         * @desc (Signup Screen) check validity of password input by comparing the 2 values entered
         */
        return {
            require: "ngModel",
            scope: {
                passwordVerify: '='
            },
            link: function (scope, element, attrs, ctrl) {
                scope.$watch(function () {
                    var combined;

                    if (scope.passwordVerify || ctrl.$viewValue) {
                        combined = scope.passwordVerify + '_' + ctrl.$viewValue;
                    }
                    return combined;
                }, function (value) {
                    if (value) {
                        ctrl.$parsers.unshift(function (viewValue) {
                            var origin = scope.passwordVerify;
                            if (origin !== viewValue) {
                                ctrl.$setValidity("passwordVerify", false);
                                return undefined;
                            } else {
                                ctrl.$setValidity("passwordVerify", true);
                                return viewValue;
                            }
                        });
                    }
                });
            }
        };
    });

