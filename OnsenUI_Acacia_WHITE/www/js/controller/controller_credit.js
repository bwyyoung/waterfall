var scope_credit;

/**
 * @controller credit
 * @desc controller for add credit screens
 */
Acacia.controller('credit', ['$scope', '$window', '$timeout', 'user_credentials', 'network_credit',
        function ($scope, $window, $timeout, user_credentials, network_credit) {
            scope_credit = $scope;
            var symbol_native;
            var symbol;

            /**
             * @function get_credit_formatted_string
             * @desc get a formatted string, based on floating point credit value
             * @returns {credit_string}
             * credit string is returned, and formatted in the respective currency with symbols, and commas
             */
            $scope.get_credit_formatted_string = function () {
                return DEFAULT_CURRENCY_NUMBER_FORMAT.format($scope.credit_data.credit).replace(symbol, symbol_native);
            };

            /**
             * @function nav_credit_poppage
             * @desc pop page until there is only 1 left, then return false
             * @returns {boolean}
             * if false, there are no more pages to pop, and we are on our very first page in navigation
             */
            $scope.nav_credit_poppage = function () {
                if (nav_credit.getPages().length > 1) {
                    nav_credit.popPage({animation: 'simpleslide'});
                    return true;
                }
                return false;
            };

            /**
             * @function init_credit_box
             * @desc initialise credit input box, by calling global function used to initialise such boxes.
             * Enhancement: store setup_credit_box in another service.
             */
            $scope.init_credit_box = function () {
                setup_credit_box($scope, 'price');
            };

            /**
             * @function get_total_payment_amount
             * @desc get the total amount, to be paid by the user including:
             *  - processing fee
             *  - input credit amount
             * @returns {credit_string}
             * credit string is returned, and formatted in the respective currency with symbols, and commas
             */
            $scope.get_total_payment_amount = function () {
                return DEFAULT_CURRENCY_NUMBER_FORMAT.format($scope.credit_data.processing_fee_numeric +
                    $scope.credit_data.input_credit_numeric).replace(symbol, symbol_native);

            };


            /**
             * @function is_payment_gateway_loaded
             * @returns {boolean}
             * check if payment gateway is loaded*
             *
             * *as of 16 September 2016, this has not been developed yet.
             */
            $scope.is_payment_gateway_loaded = function () {
                return $scope.payment_gateway_loaded;
            };

            /**
             * @function init_payment_gateway
             * @desc initialise the payment gateway*
             *
             * *as of 16 September 2016, this has not been developed yet.
             */
            $scope.init_payment_gateway = function () {
                var f = $('#payment_gateway');
                $scope.payment_gateway_loaded = false;
                //check if iFrame has been loaded into view, and when it has, set payment_gateway_loaded to true
                f.load(function () {
                    $scope.payment_gateway_loaded = true;
                    scope_apply($scope);
                });
            };

            /**
             * @function init_credit_summary
             * @desc initialise credit summary by, doing a first check if form is valid.
             * if not, the submit button will be disabled
             */
            $scope.init_credit_summary = function () {
                $scope.check_credit_summary_before_submit();
            };

            /**
             * @function check_credit_summary_before_submit
             * @desc check if data input in form for credit summary, is valid before submission
             * @returns {boolean}
             * true if invalid, false if valid
             */
            $scope.check_credit_summary_before_submit = function () {
                if (isNull($scope.credit_data.payment_method) ||
                    string_empty($scope.credit_data.payment_method))
                    return true;
                return false;
            };

            /**
             * @function show_info_processing_fee
             * @desc show an alert, stating information about processing fee
             */
            $scope.show_info_processing_fee = function () {
                navigator.notification.alert(
                    'The processing fee is chargeable per payment transaction when payment is made ONLINE through credit card, debit card or charge card only. This fee covers the cost of processing the payment transaction.',  // message
                    null,         // callback
                    'Processing Fee',            // title
                    'OK'                  // buttonName
                );
            };

            /**
             * @function init
             * @desc initialise the credit controller with respect to form variables.
             */
            $scope.init = function () {

                //define native symbols (Rp) and symbols(IDR)
                symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
                symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];

                //init profile image and credit form.
                $scope.credit_data = {};
                $scope.credit_data.profile_image = user_credentials.profile_image;
                $scope.setProfileImage = {
                    'background-image': 'url(' + $scope.credit_data.profile_image + ')'
                };
                $scope.credit_data.username = user_credentials.name;
                $scope.credit_data.level = user_credentials.level;
                $scope.credit_data.credit = user_credentials.credit;

                $scope.credit_data.processing_fee_numeric = 0;
                $scope.credit_data.processing_fee =
                    DEFAULT_CURRENCY_NUMBER_FORMAT.format($scope.credit_data.processing_fee_numeric).replace(symbol, symbol_native);

                $timeout(function () {
                    $(document).on(EVENT_BACKBUTTON,
                        function () {
                            debug_log('backbutton cancel credit');
                            $scope.Click_Cancel_Credit();
                        }
                    );
                    $(document).on(EVENT_KEYBOARD_UP,
                        function (event, keyboard_height) {

                        });
                    $(document).on(EVENT_KEYBOARD_DOWN,
                        function () {
                            $('#div_add_credit_1').scrollTop(0);
                        }
                    );
                }, 500);

            };
            $scope.init();

            /**
             * @function check_input_credit_before_submit
             * @desc for add credit, check if input credit is valid, and enough for submission to server (DEFAULT_CREDIT_ADD_MINIMUM)
             * @returns {boolean}
             * if credit is valid, return false
             */
            $scope.check_input_credit_before_submit = function () {
                if (isNull($scope.credit_data))
                    return true;
                if (isNull($scope.credit_data.input_credit))
                    return true;

                //update with val in case user presses X Delete Button
                $scope.credit_data.input_credit = $('.clearable_dollar').val();
                $scope.credit_data.input_credit_numeric = parseInt($scope.credit_data.input_credit.split(/ /)[0].replace(/[^\d]/g, ''));

                if ($scope.credit_data.input_credit_numeric >= DEFAULT_CREDIT_ADD_MINIMUM)
                    return false;
                return true;
            };

            /**
             * @function Click_Cancel_Credit
             * @desc click cancel credit for user.
             */
            $scope.Click_Cancel_Credit = function () {
                dialog_credit.hide();
                dialog_credit.destroy();
            };

            /**
             * @function Click_Submit_Credit
             * @desc Click submission of credit, if submit button is enabled
             */
            $scope.Click_Submit_Credit = function () {
                network_credit.add_credit($scope.credit_data.input_credit_numeric, DEFAULT_CURRENCY, $scope);
            };

            /**
             * @function update_credit_info
             * @desc update local credit data, based on add credit transaction
             */
            $scope.update_credit_info = function () {
                $scope.credit_data.added_credit_string = $scope.credit_data.input_credit;
                $scope.credit_data.added_credit_int = $scope.credit_data.input_credit_numeric;

                // TODO: How do we find out more about levels? For Future implementation
                user_credentials.level = $scope.credit_data.level;
                user_credentials.credit = $scope.credit_data.credit + $scope.credit_data.added_credit_int;
                $scope.credit_data.credit_balance_new = format_symbol_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT,
                    (user_credentials.credit).toString());
            };

            /**
             * @function destroy
             * @desc kill all assigned events.
             */
            $scope.$on("$destroy", function () {
                destroy_credit_box();
                $(document).off(EVENT_BACKBUTTON);
                $(document).off(EVENT_KEYBOARD_UP);
                $(document).off(EVENT_KEYBOARD_DOWN);
            });
        }
    ]
);