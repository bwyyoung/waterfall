waterfall.service('network_credit', ['network_api','service_alert','user_credentials', function(network_api, service_alert, user_credentials)
{

    var alert_loading_dialog;
    this.URL_ADD_INVESTOR_CREDIT = "http://192.168.100.9/NuwaterfallWebAPI/api/waterfall/AddInvestorCredit";

    this.MESSAGE_KEY_TRANSACTION_REFERENCE_NO = 'TransactionReferenceNo';
    this.MESSAGE_KEY_CREDIT_AMOUNT = 'CreditAmount';
    var that = this;
    this.add_credit = function(amount, currency, scope)
    {
        var data = {};

        service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function(dialog)
        {
            service_alert.alert_message = "Submitting Credit Request..";
            alert_loading_dialog = dialog;
            data[user_credentials.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
            data[user_credentials.MESSAGE_KEY_CREDIT_CURRENCY] = currency;
            data[that.MESSAGE_KEY_CREDIT_AMOUNT] = amount;
            data[that.MESSAGE_KEY_TRANSACTION_REFERENCE_NO] = 'BLANK';
            network_api.ajax_call(that.URL_ADD_INVESTOR_CREDIT, data, check_response);
        });

        function check_response(success)
        {
            alert_loading_dialog.hide();
            var response = arguments[3];
            if (!success)
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
            else if (isNull(arguments[3]))
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);


            if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS)
            {
                scope.update_credit_info();
                return nav_credit.pushPage('credit/3_results.html');
            }
            else
                return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
        }
    }

}
    ]
);
