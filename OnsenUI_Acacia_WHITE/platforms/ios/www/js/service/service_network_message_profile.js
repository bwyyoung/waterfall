/**
 * @service network_message_profile
 * @desc messages to be sent to server, in relation to profile:
 * - update address
 * - get current address
 * - get bank details
 * - update bank details
 */
Acacia.service('network_message_profile', ['network_api', 'service_alert', 'user_credentials',
        function (network_api, service_alert, user_credentials) {

            var URL_INVESTOR_ADDRESS_UPDATE = DEFAULT_SERVER_IP + "/NuAcaciaWebAPI/api/Acacia/UpdateInvestorAddress";
            var URL_INVESTOR_ADDRESS_GET = DEFAULT_SERVER_IP + "/NuAcaciaWebAPI/api/Acacia/GetInvestorAddress";
            var URL_INVESTOR_BANK_UPDATE = DEFAULT_SERVER_IP + "/NuAcaciaWebAPI/api/Acacia/UpdateInvestorBank";
            var URL_INVESTOR_BANK_GET = DEFAULT_SERVER_IP + "/NuAcaciaWebAPI/api/Acacia/GetInvestorBank";


            this.MESSAGE_KEY_ADDRESSLINE1 = "AddressLine1";
            this.MESSAGE_KEY_STREET = "Street";
            this.MESSAGE_KEY_VILLAGE = "Village";
            this.MESSAGE_KEY_CITY = "City";
            this.MESSAGE_KEY_PROVINCE = "Province";
            this.MESSAGE_KEY_POSTAL_CODE = "PostalCode";
            this.MESSAGE_KEY_COUNTRY = "CountryCodeA2";

            this.MESSAGE_KEY_BANK_NAME = 'BankName';
            this.MESSAGE_KEY_BANK_BRANCH = 'BankBranch';
            this.MESSAGE_KEY_BANK_ACCOUNT_NUMBER = 'AccountNumber';
            this.MESSAGE_KEY_BANK_ACCOUNT_TYPE_CODE = 'AccountTypeCode';
            this.MESSAGE_KEY_BANK_ACCOUNT_HOLDER_NAME = 'AccountHolderName';


            var alert_loading_dialog;
            var that = this;

            this.message_get_investor_address = function () {
                var data = {};
                data[user_credentials.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
                network_api.ajax_call(URL_INVESTOR_ADDRESS_GET, data, check_response);

                function check_response(success) {
                    if (!success)
                        return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                    else if (isNull(arguments[3]))
                        return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                    var response = arguments[3];

                    if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {
                        user_credentials.address_object = angular.copy(response);
                    }
                    else {

                    }
                }
            };

            this.message_update_investor_address = function (address_form_data) {
                var data = {};
                service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function (dialog) {
                    service_alert.alert_message = "Updating Address..";
                    alert_loading_dialog = dialog;
                    data[user_credentials.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
                    data[that.MESSAGE_KEY_ADDRESSLINE1] = address_form_data.number;
                    data[that.MESSAGE_KEY_STREET] = address_form_data.street;
                    data[that.MESSAGE_KEY_VILLAGE] = address_form_data.village;
                    data[that.MESSAGE_KEY_CITY] = address_form_data.city;
                    data[that.MESSAGE_KEY_PROVINCE] = address_form_data.state;
                    data[that.MESSAGE_KEY_POSTAL_CODE] = address_form_data.postcode;
                    data[that.MESSAGE_KEY_COUNTRY] = address_form_data.country;
                    network_api.ajax_call(URL_INVESTOR_ADDRESS_UPDATE, data, check_response);
                });

                function check_response(success) {
                    alert_loading_dialog.hide();
                    if (!success)
                        return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                    else if (isNull(arguments[3]))
                        return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                    var response = arguments[3];

                    if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {
                        user_credentials.address_object = angular.copy(data);
                        service_alert.create_alert(service_alert.ALERT_ADDRESS_UPDATE_SUCCESS).then(function (dialog) {
                            dialog.on('postshow', function () {
                                scope_profile.nav_profile_poppage();
                                scope_profile.clear_update_address();
                            });
                        });
                    }
                    else {
                        service_alert.create_alert(service_alert.ALERT_ADDRESS_UPDATE_FAIL).then(
                            function (dialog) {
                                dialog.on('prehide', function () {

                                    }
                                );
                            });
                    }
                }
            };

            this.message_update_bank_details = function (bank_form_data) {
                var data = {};
                service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function (dialog) {
                    service_alert.alert_message = "Updating Bank Details..";
                    alert_loading_dialog = dialog;
                    data[user_credentials.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
                    data[that.MESSAGE_KEY_BANK_NAME] = bank_form_data.name;
                    data[that.MESSAGE_KEY_BANK_BRANCH] = bank_form_data.branch;
                    data[that.MESSAGE_KEY_BANK_ACCOUNT_NUMBER] = bank_form_data.account;
                    data[that.MESSAGE_KEY_BANK_ACCOUNT_TYPE_CODE] = bank_form_data.account_type;
                    data[that.MESSAGE_KEY_BANK_ACCOUNT_HOLDER_NAME] = bank_form_data.account_holder_name;

                    network_api.ajax_call(URL_INVESTOR_BANK_UPDATE, data, check_response);
                });

                function check_response(success) {
                    alert_loading_dialog.hide();
                    if (!success)
                        return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                    else if (isNull(arguments[3]))
                        return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                    var response = arguments[3];

                    if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {
                        service_alert.create_alert(service_alert.ALERT_BANK_DETAILS_UPDATE_SUCCESS).then(
                            function (dialog) {
                                dialog.on('postshow', function (event) {
                                    scope_slidemenu_left.page_load_profile(true);
                                    scope_profile.clear_update_bank_details();
                                });
                            }
                        );
                    }
                    else {
                        service_alert.create_alert(service_alert.ALERT_BANK_DETAILS_UPDATE_FAIL).then(
                            function (dialog) {
                                dialog.on('prehide', function () {

                                });
                            });
                    }
                }

            }


        }
    ]
);