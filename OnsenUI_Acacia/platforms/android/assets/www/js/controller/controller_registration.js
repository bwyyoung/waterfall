

var scope_registration;

Acacia.controller('registration',
    ['$scope', '$window', 'user_credentials','service_alert', 'network_message_registration',
        function($scope, $window, user_credentials, service_alert, network_message_registration)
        {
            scope_registration = $scope;
            debug_log('controller registration loaded');

            $scope.imgURI_PlaceHolder = "css/custom_images/icons/photo.png";
            $scope.captured_image =  null;
            $scope.temp_login_email = '';
            $scope.error_message = '';

            $scope.birthday = null;
            $scope.birthday_clone = null;

            $scope.temp_password = '';
            $scope.setnewpassword = true;//net code

            $scope.form = {};
            $scope.signup = {};
            $scope.newpassword = {};
            $scope.login = {};


            $scope.button_back = function(e)
            {
                e.preventDefault();
            };

            $scope.init = function () {
                debug_log('init registration');
                $(document).on( EVENT_BACKBUTTON,
                    function()
                    {
                        debug_log('back button registration 1  ' +'|'+ !service_alert.alert_cleared.value);

                        if (!service_alert.alert_cleared.value)
                            return;
                        debug_log('back button registration 2');

                        if (!isNull($scope.phoneinput))
                        {
                            if ($scope.phoneinput.intlTelInput('isDropDownOpen'))
                                return $scope.phoneinput.intlTelInput('closeDropDown');
                        }
                        debug_log('back button registration 3');

                        if (!$scope.nav_registration_poppage())
                            $scope.showConfirm();
                    }
                );

                var is_android = ((navigator.userAgent.match(/Android/i)) == "Android");

                if(is_android && navigator && navigator.splashscreen)
                    navigator.splashscreen.hide();
            };

            $scope.showConfirm = function() {
                navigator.notification.confirm(
                    'Do you really want to exit?',  // message
                    $scope.exitFromApp,              // callback to invoke with index of button pressed
                    'Exit Marketplace',            // title
                    'Cancel,OK'         // buttonLabels
                );
            };


            $scope.exitFromApp =  function(buttonIndex)
            {
                if (buttonIndex == 2)
                    navigator.app.exitApp();
            };
            $scope.init();

            $scope.$on("$destroy", function()
            {
                $(document).off(EVENT_BACKBUTTON);
            });

            $scope.is_profile_photo_blank = function () {
                return isNull($scope.captured_image);
            };

            $scope.nav_registration_poppage = function ()
            {
                if (nav_registration.getPages().length > 1)
                {
                    nav_registration.popPage({ animation: 'simpleslide' });
                    return true;
                }
                return false;
            };


            $scope.page_load_signup = function()
            {
                executeAsync(function(){
                    $('#special_hide').prop('disabled', true);
                });
                nav_registration.pushPage('registration/signup.html',{ animation: 'simpleslide' });
            };

            $scope.page_load_confirm_signup = function()
            {

                $scope.signup.phonenumber = $scope.phoneinput.intlTelInput("getNumber") + "";
                nav_registration.pushPage('registration/signup_confirm.html',{ animation: 'simpleslide' });
            };

            $scope.page_load_login = function()
            {
                executeAsync(function(){
                    $('#special_hide').prop('disabled', true);
                });
                nav_registration.pushPage('registration/login.html',{ animation: 'simpleslide' });
            };

            $scope.forgot_password = function()
            {
                service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT).then(
                    function (dialog) {
                        dialog.on('preshow', function (event)
                        {
                            debug_log('forgot password preshow');
                        });
                        dialog.on('posthide', function (event)
                        {

                        });
                    }
                );
            };

            $scope.reset_signup =  function()
            {
                $scope.captured_image = null;
                $scope.signup = {};
                $scope.form = {};
                $scope.newpassword = {};
                $scope.birthday = null;
                $scope.birthday_clone = null;
            };

            $scope.password_reset_email_validate = function (user_email)
            {
                alertdialog.hide();
                var email_valid = true;
                debug_log('verifying email ' + user_email);
                if (isNull(user_email))
                    email_valid = false;
                if (!email_valid)
                {
                    service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INVALID).then(
                        function(dialog)
                        {
                            dialog.on('prehide', function()
                            {
                                service_alert.create_alert(service_alert.ALERT_PASSWORD_RESET_EMAIL_INPUT);
                            });
                        });
                }
                else
                    network_message_registration.message_reset_password_email_submit(user_email);
            };

            $scope.password_reset_verify = function(password, confirmpassword, match, password_dirty)
            {
                if (!password_dirty)
                    return false;

                $scope.error_message = '';

                if (password)
                {
                    $scope.error_message = 'Field - New Password Required';
                    return true;
                }
                else if (confirmpassword)
                {
                    $scope.error_message = 'Field - Confirm Password Required';
                    return true;
                }
                else if (match)
                {
                    $scope.error_message = 'Passwords do not match';
                    return true;
                }
                return false;
            };

            $scope.click_password_reset_confirm = function(newpassword)
            {
                network_message_registration.message_newpassword_confirm($scope.temp_login_email, $scope.temp_password, newpassword);
            };

            $scope.check_input_login = function (login)
            {
                if (isNull(login.user_email) || isNull(login.user_password) )
                {
                    button_login.setDisabled(true);
                    return true;
                }
                else
                {
                    $scope.temp_login_email = login.user_email;
                    button_login.setDisabled(false);
                    return false;
                }
            };

            $scope.click_login =  function(login)
            {
                var login_valid = true;
                $scope.temp_password = login.user_password;
                if (isNull(login.user_email) || isNull(login.user_password) )
                    login_valid = false;
                if (!login_valid)
                    service_alert.create_alert(service_alert.ALERT_LOGIN_INVALID);
                else
                {
                    debug_log('new user email ' +$scope.temp_login_email);
                    network_message_registration.message_login_user(login.user_email,login.user_password );
                }
            };

            $scope.showMenuDialog = function ()
            {
                service_alert.create_alert(service_alert.ALERT_CAMERA_OPTIONS).then(
                    function(dialog)
                    {
                        dialog.on('prehide', function()
                        {
                        });
                    })
                ;
            };

            $scope.login_user = function(isRegistered)
            {
                executeAsync(function(){
                    $('#special_hide').prop('disabled', true);
                });
                BOOL_USER_LOGGED_IN_REGISTERED = false;
                BOOL_USER_LOGGED_IN_GUEST = false;
                if (isRegistered)
                    BOOL_USER_LOGGED_IN_REGISTERED = true;
                else
                    BOOL_USER_LOGGED_IN_GUEST = true;

                scope_slidemenu_left.cur_main_page = DEFAULT_HOME_URL;
                scope_slidemenu_left.setup_menu();
                dialog_registration.hide();
                dialog_registration.destroy();

                scope_apply(scope_slidemenu_left);
                //TEMP TEST
                test_loki();
            };
            
           

            $scope.click_signup_submit = function()
            {
                //net code
                network_message_registration.message_signup($scope.signup);
            };

            $scope.signup_phone_verify = function () {
                debug_log('signup_phone_verify ' + $scope.phoneinput.intlTelInput("isValidNumber"));
                $scope.error_message = '';
                if ($scope.phoneinput.intlTelInput("isValidNumber") == false)
                {
                    var error = 'Invalid';
                    switch($scope.phoneinput.intlTelInput("getValidationError"))
                    {
                        case 1:
                            error = "Invalid country calling code";
                            break;
                        case 2:
                            error = "The string supplied is too short to be a phone number";
                            break;
                        case 3:
                            error  ="The string supplied is too long to be a phone number";
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

            $scope.signup_verify = function(password_reset_error)
            {
                if (password_reset_error)
                    return true;

                debug_log('captured image ' + isNull($scope.captured_image) + "|"  +$scope.captured_image);

                $scope.error_message = '';

                if (isNull($scope.signup.email))
                {
                    $scope.error_message = 'Your email is invalid';
                    return true;
                }
                else if (isNull($scope.signup.firstname) || string_empty($scope.signup.firstname))
                {
                    $scope.error_message = 'Please input first name';
                    return true;
                }
                else if (isNull($scope.signup.lastname) || string_empty($scope.signup.lastname))
                {
                    $scope.error_message = 'Please input last name';
                    return true;
                }
                //else if (isNull($scope.signup.phonenumber) || string_empty($scope.signup.phonenumber.toString()))
                else if ($scope.signup_phone_verify())
                    return true;
                else if (isNull($scope.signup.birthday_day) || string_empty($scope.signup.birthday_day))
                {
                    $scope.error_message = 'Please input birthday date';
                    return true;
                }
                else if (isNull($scope.captured_image))
                {
                    $scope.error_message = 'Please take profile photo';
                    return false;
                }
                return false;
            }


            $scope.init_signup= function()
            {
                executeAsync(function(){
                    $('#special_hide').prop('disabled', true);
                });
                debug_log('init signup');
                $scope.reset_signup();
                $scope.phoneinput = $("#phone");
                $scope.phoneinput.intlTelInput(
                    {
                        utilsScript: "js/phone_number/utils.js",
                        separateDialCode: true
                    }
                );

                $scope.phoneinput.on("countrychange", function(e, countryData) 
                {
                    $scope.signup_phone_verify();
                    scope_apply($scope);
                });

            };

            $scope.show_birthday_native_datepicker = function ()
            {
                debug_log('show native datepicker');
                var myNewDate = new Date();
                myNewDate.setDate(myNewDate.getDate() - 6570);

                // Same handling for iPhone and Android
                datePicker.show({
                    date : myNewDate,
                    mode : 'date', // date or time or blank for both
                    allowOldDates : true,
                    allowFutureDates: false,
                    minDate: Date.parse('01/01/1900'),
                    maxDate: Date.parse(myNewDate.toDateString()),
                    locale: 'en_us',
                    androidTheme: datePicker.THEME_DEVICE_DEFAULT_LIGHT
                },
                    function(returnDate)
                    {
                        if (!returnDate)
                            return;
                        var newDate = new Date(returnDate);
                        var locale = "en-us";
                        $scope.signup.birthday_day = (newDate.getDate()).toString();
                        $scope.signup.birthday_month = (newDate.toLocaleString(locale, { month: "long" }));
                        $scope.signup.birthday_year =(newDate.getFullYear()).toString();
                        $scope.error_message = '';
                        scope_apply($scope);
                    });
            };
            
            $scope.init_bootstrap_datepicker = function()
            {
                if (!isNull($scope.birthday))
                {
                    $(".datepicker.dropdown-menu").empty();
                    $(".datepicker.dropdown-menu").remove();
                }

                $scope.birthday = $('#birthday_picker').datepicker(
                    {
                        changeMonth: true,
                        changeYear: true,
                        autoclose: true,
                        startView: 2,
                        format : 'dd/mm/yyyy',
                        defaultDate: '01/01/1900',
                        startDate: '01/01/1900',
                        endDate: (new Date()).toDateString(),
                        directionReverse: true
                }).datepicker('hide').on('hide', function (e)
                {
                    var date = {value: ''};
                    var locale = "en-us";
                    $scope.birthday.datepicker('getDateSelected', date);
                    $('#birthday_day').val(date.value.getDate());
                    $('#birthday_month').val(date.value.toLocaleString(locale, { month: "long" }));
                    $('#birthday_year').val(date.value.getFullYear());
                });
            }
    }
        ]
).directive(
'signupImg', function(){
    return function(scope, element, attrs)
    {
        scope.$watch('captured_image', function(newVal, oldVal)
            {
                var url;

                if (scope.captured_image != null)
                    url = scope.captured_image;
                else
                    url = scope.imgURI_PlaceHolder;

                element.css({
                    'background-image': 'url(' + url +')',
                    'background-size' : 'cover'
                });
            }
        );
    };
})
.directive("passwordVerify", function()
{
    return {
        require: "ngModel",
        scope: {
            passwordVerify: '='
        },
        link: function(scope, element, attrs, ctrl) {
            scope.$watch(function() {
                var combined;

                if (scope.passwordVerify || ctrl.$viewValue) {
                    combined = scope.passwordVerify + '_' + ctrl.$viewValue;
                }
                return combined;
            }, function(value) {
                if (value) {
                    ctrl.$parsers.unshift(function(viewValue) {
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

