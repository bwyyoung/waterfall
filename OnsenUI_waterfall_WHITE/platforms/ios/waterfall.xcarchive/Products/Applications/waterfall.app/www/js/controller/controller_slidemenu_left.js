//Difine angular module.


var scope_slidemenu_left;
/**
 * @controller slidemenu_left
 * @desc this is the controller for the left sliding menu.
 * However, it is also the root controller that starts and stops
 * screens shown as a result of clicking the sliding menu buttons.
 *
 * Therefore, it can be seen as the trigger for other controllers to start,
 * as these screens are called to be shown on screen.
 *
 * The sliding menu is the first onsen element loaded, and it springboards other elements to be launched
 * on an event basis. For example, add credit dialog, splash screen, alert dialogs, etc.
 */
waterfall.controller('slidemenu_left', ['$scope', '$window', '$timeout', 'user_credentials', 'service_alert', 'network_inbox', 'lokijs_database',
    function ($scope, $window, $timeout, user_credentials, service_alert, network_inbox, lokijs_database) {
        debug_log('loading slidemenu left');
        scope_slidemenu_left = $scope;
        $scope.window = window;
        $scope.bool_slidemenu_left_user_access = false;
        $scope.hideDialog = true;
        $scope.cur_main_page = DEFAULT_HOME_URL;
        $scope.redirect_home_page = false;
        $scope.redirect_loan_marketplace = false;
        $scope.user_credentials_reference = user_credentials;

        $scope.BOOL_SLIDING_MENU_OPEN = false;

        $scope.setProfileImage = {
            'background-image': 'url(' + $scope.user_credentials_reference.profile_image + ')'
        };

        /**
         * @function get_num_new_messages
         * @desc get the number of new messages found in chat feedback, and show a notification circle.
         * @returns {number}
         */
        $scope.get_num_new_messages = function ()
        {
            return network_inbox.num_new_messages;
        };

        $scope.verify_user_registered_logged_in = function () {
            return BOOL_USER_LOGGED_IN_REGISTERED;
        };

        $scope.verify_user_guest_logged_in = function () {
            return BOOL_USER_LOGGED_IN_GUEST;
        };

        /**
         * @function verify_user_credit_enough
         * @desc does the user have the minimum amount of credit? if not, show a written warning
         * @returns {boolean}
         */
        $scope.verify_user_credit_enough = function () {
            if ($scope.credit < DEFAULT_CREDIT_MINIMUM) {
                return false;
            }
            return true;
        };

        /**
         * @function toggleAccess
         * @desc old local storage test. deprecated.
         */
        $scope.toggleAccess = function () {
            if (!DEBUG_NO_LOCALSTORAGE) {
                var temp = window.localStorage.getItem(USER_LOGGED_IN);
                temp = !toBool(temp);
                window.localStorage.setItem(USER_LOGGED_IN, temp);
            }
        };

        /**
         * @function setup_menu
         * @desc setup slidemenu left by knowing if user is allowed to access registered buttons.
         * If user is not registered, slidemenu will only have guest level access
         */
        $scope.setup_menu = function () {
            if (!DEBUG_NO_LOCALSTORAGE) {
                debug_log('setup menu ' + window.localStorage.getItem(USER_LOGGED_IN));
                $scope.bool_slidemenu_left_user_access = toBool(window.localStorage.getItem(USER_LOGGED_IN));
                return;
            }
            else {
                $scope.bool_slidemenu_left_user_access = BOOL_USER_LOGGED_IN_REGISTERED;
            }
        };

        /**
         * @function page_load_home
         * @desc load the home page for sliding menu.
         */
        $scope.page_load_home = function () {

            app.slidingMenu.closeMenu();
            $timeout(
                function () {
                    app.slidingMenu.setMainPage(DEFAULT_HOME_URL);
                }, 100);
        };

        $scope.page_load_inbox = function (load) {
            if (!load)
                return;

            app.slidingMenu.closeMenu();

            $timeout(
                function () {
                    app.slidingMenu.setMainPage('slidemenu_left/2_inbox.html');
                }, 100);
        };

        $scope.page_load_loans_marketplace = function () {
            debug_log('loading loans');
            app.slidingMenu.closeMenu();
            if (app.slidingMenu.getMainPage() == 'slidemenu_left/3_loans_marketplace.html')
                return;
            $timeout(
                function () {
                    app.slidingMenu.setMainPage('slidemenu_left/3_loans_marketplace.html')
                }, 100);
        };

        $scope.page_load_loans_portfolio = function (load) {
            if (!load)
                return;

            app.slidingMenu.closeMenu();
            $timeout(
                function () {
                    app.slidingMenu.setMainPage('slidemenu_left/4_my_loans_portfolio.html');
                }, 100);
        };

        $scope.page_load_profile = function (load) {
            if (!load)
                return;

            app.slidingMenu.closeMenu();

            $timeout(
                function () {
                    app.slidingMenu.setMainPage('slidemenu_left/5_my_profile.html');
                }, 100);
        };


        $scope.page_load_contact = function (load) {
            if (!load)
                return;

            app.slidingMenu.closeMenu();

            $timeout(
                function () {
                    app.slidingMenu.setMainPage('slidemenu_left/6_contact_us.html');
                }, 100);
        };

        $scope.page_load_settings = function (load) {
            if (!load)
                return;

            app.slidingMenu.closeMenu();

            $timeout(
                function () {
                    app.slidingMenu.setMainPage('slidemenu_left/7_settings.html');
                }, 100);
        };

        $scope.page_load_logout = function (load) {
            if (!load)
                return;
            app.slidingMenu.closeMenu();
            $timeout(
                function () {
                    service_alert.create_alert(service_alert.ALERT_LOGOUT_CONFIRM)
                        .then(
                            function (dialog) {
                                dialog.on('postshow', function (event) {
                                    app.slidingMenu.setMainPage('slidemenu_left/8_logout.html');
                                });

                            }
                        );
                }, 100);
        };

        /**
         * @function profile_picture_click
         * @desc clicking on the profile picture either takes you to profile page if registered,
         * or to splash screen if guest
         */
        $scope.profile_picture_click = function () {

            if (!DEBUG_NO_LOCALSTORAGE)
                return;
            if (!BOOL_USER_LOGGED_IN_REGISTERED) {
                app.slidingMenu.closeMenu();
                $scope.show_form_splash();
            }
            else {
                $scope.page_load_profile(true);
            }
        };


        $scope.getProfileImage = function () {
            return user_credentials.profile_image;
        };


        /**
         * @function sliding_menu_fix
         * @desc fix for hiding and showing sliding menu.
         * when showing sliding menu, hide the current main page using #special_hide
         *  - apply style to memory intensive display objects in order to hide them when sliding menu
         *      is open, in order to improve performance and user experience when using the sliding menu.
         */
        $scope.sliding_menu_fix = function () {
            app.slidingMenu.on("preopen", function () {
            });

            app.slidingMenu.on("postopen", function ()
            {
                $scope.BOOL_SLIDING_MENU_OPEN = true;
                $timeout(
                    function () {
                        $('#special_hide').prop('disabled', false);
                        scope_apply($scope);
                    }, 200);

            });
            app.slidingMenu.on("preclose", function () {
                $('#menu_scroller > .ons-scroller__content').scrollTop({scrollTop: 0}, 250);
                $('#menu_list').animate({scrollTop: 0}, 250);
                $('#menu_page').animate({scrollTop: 0}, 250);

            });
            app.slidingMenu.on("postclose", function () {
                $scope.BOOL_SLIDING_MENU_OPEN = false;
                $timeout(
                    function () {
                        $('#special_hide').prop('disabled', true);
                        scope_apply($scope);
                    }, 100);
            });
        };

        /**
         * @function backbutton_disable
         * @desc disable back button functionality for onsen ui framework, and
         * set the callback to our own backbutton function.
         */
        $scope.backbutton_disable = function () {
            ons.setDefaultDeviceBackButtonListener(onBackButton);
            app.slidingMenu.getDeviceBackButtonHandler().setListener(onBackButton);
            ons.disableDeviceBackButtonHandler();
        };

        $scope.page_load_transaction_history = function () {
            app.slidingMenu.setMainPage('slidemenu_left/12_transaction_history.html', {closeMenu: true});
        };

        $scope.show_page_dummy = function () {
            app.slidingMenu.setMainPage('slidemenu_left/9_dummy.html', {closeMenu: true});
        };

        $scope.show_form_search = function () {
            app.slidingMenu.setMainPage('slidemenu_left/10_search.html', {closeMenu: true});
        };

        /**
         * @function dialog_prepare
         * @desc when showing any dialog screen set (add credit, registration/splash, etc.)
         * launched from sliding menu, prep it by setting the main page to a dummy page
         * in order to improve performance for the dialog.
         * Then, show the dialog.
         * @param dialog
         * the ons-dialog object.
         */
        $scope.dialog_prepare = function (dialog) {
            dialog.getDeviceBackButtonHandler().disable();
            dialog.on('preshow', function () {
                scope_slidemenu_left.cur_main_page = app.slidingMenu.getMainPage();
                app.slidingMenu.setMainPage('slidemenu_left/9_dummy.html', {closeMenu: true});
            });
            dialog.on('postshow', function () {
                executeAsync(function () {
                    $('#special_hide').prop('disabled', false);
                });
            });
            dialog.on('prehide', function () {
                executeAsync(function () {
                    $('#special_hide').prop('disabled', true);
                });
                app.slidingMenu.setMainPage(scope_slidemenu_left.cur_main_page, {closeMenu: true});
            });
            dialog.on('posthide', function (event) {
                dialog.destroy();
            });
            dialog.show();
        };

        $scope.show_form_addcredit = function () {
            return ons.createDialog('credit/2_1-add_credit.html').then
            (
                function (dialog) {
                    $scope.dialog_prepare(dialog);
                }
            );
        };

        $scope.show_form_splash = function () {
            return ons.createDialog('registration/splash.html').then(
                function (dialog) {
                    $scope.dialog_prepare(dialog);
                }
            );
        };

        $scope.show_form_signup = function () {
            $scope.show_form_splash().then(function () {
                scope_registration
                    .page_load_signup();
            });
        };

        /**
         * @function init
         * @desc initialise function
         * - DoubleClick fix
         * - if user has not logged in as guest or registered, SHOW SPLASH SCREEN FIRST
         *      - This usually means the just booted in lifecycle
         */
        $scope.init = function () {
            app.slidingMenu.setSwipeable(false);

            if (!BOOL_USER_LOGGED_IN_REGISTERED && !BOOL_USER_LOGGED_IN_GUEST) {
                debug_log('checking login ' + lokijs_database.USER_FOUND + '|');
                scope_slidemenu_left.show_form_splash();

            }

            doubleclick_fix();
            if (isMobileDevice()) {
                cordova.plugins.Keyboard.disableScroll(true);
            }
            $scope.$on('$viewContentLoading',
                function (event, viewConfig) {
                    console.log('slidemenu content loading: ', event, viewConfig)
                });

            $scope.$on('$viewContentLoaded',
                function (event) {
                    console.log('slidemenu content loaded: ', event);
                    $('#special_hide').prop('disabled', true);
                });

        };

        /**
         * @function notification_new_inbox_message
         * @desc create a notification in phone statusbar, as well as sliding menu,
         * that new message(s) are found in chat feedback.
         */
        $scope.notification_new_inbox_message = function () {
            if (typeof device == 'undefined')
                return;
            var sound = (device.platform == 'Android' ? 'file://sounds/your-turn.mp3' :
                'file://sounds/your-turn.caf');
            debug_log('notification sound ' + sound);
            cordova.plugins.notification.local.schedule({
                id: 1,
                text: $scope.service.num_new_messages + ' new message(s) in Chat Feedback.',
                icon: 'file://css/custom_images/icons/logo.png',
                smallIcon: null,
                sound: sound,
                data: {}
            });
        };

        $scope.watcher_inbox = null;

        $scope.destroy_notifications = function () {
            if ($scope.watcher_inbox != null)
                $scope.watcher_inbox();
        };

        /**
         * @function setup_notifications
         * @desc setup notifications after logging in.
         */
        $scope.setup_notifications = function () {
            $scope.destroy_notifications();
            $scope.service = network_inbox;
            $scope.service.num_new_messages = 0;
            $scope.watcher_inbox = $scope.$watch('service.num_new_messages',
                function (newValue, oldValue) {
                    debug_log('new service.num_new_messages' + newValue + "|" + BOOL_USER_LOGGED_IN_REGISTERED);
                    if (BOOL_USER_LOGGED_IN_REGISTERED && newValue > 0)
                        $scope.notification_new_inbox_message();
                });
        };


        $scope.$on('initialised', function () {
            lokijs_database.setup_database();
            $scope.init();
        });

        $scope.get_user_level = function () {
            return user_credentials.level;
        };

        $scope.get_name = function () {
            return user_credentials.name;
        };

        $scope.get_username = function () {
            return user_credentials.username;
        };
        
        $scope.get_credit_formatted_string = function () {
            var symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
            var symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];
            return DEFAULT_CURRENCY_NUMBER_FORMAT.format(user_credentials.credit).replace(symbol, symbol_native);
        }
    }
]).directive('initialisation', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'A',
        link: function ($scope) {
            var to;
            var listener = $scope.$watch(function () {
                clearTimeout(to);
                to = setTimeout(function () {
                    console.log('initialised');
                    listener();
                    $rootScope.$broadcast('initialised');
                }, 50);
            });
        }
    };
}]).directive(
    'menuprofileImg', function () {
        /**
         * @directive menuprofileImg
         * @desc when user credentials profile image changes, change the local menu profile image.
         */
        return function (scope, element, attrs) {
            scope.$watch('user_credentials_reference.profile_image', function (newVal, oldVal) {
                    var url;

                    if (scope.user_credentials_reference.profile_image != null)
                        url = scope.user_credentials_reference.profile_image;
                    else
                        url = scope.user_credentials_reference.guest_profile_image;

                    element.css({
                        'background-image': 'url(' + url + ')',
                        'background-size': 'cover'
                    });
                }
            );
        }
    }
);


