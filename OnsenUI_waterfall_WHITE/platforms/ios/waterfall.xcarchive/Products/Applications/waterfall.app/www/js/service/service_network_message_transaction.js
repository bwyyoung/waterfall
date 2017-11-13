/**
 * @service network_transaction
 * @desc service that handles messages regarding transaction history
 */
waterfall.service('network_transaction', ['network_api', 'service_alert', 'user_credentials', function (network_api, service_alert, user_credentials) {
        this.MESSAGE_KEY_AMOUNT = "Amount";
        this.MESSAGE_KEY_DATE = "Date";
        this.MESSAGE_KEY_CURRENCY = "Currency";
        this.MESSAGE_KEY_BALANCE = "Balance";

        this.MESSAGE_KEY_TRANSACTION_TYPE = "TransactionType";
        this.MESSAGE_KEY_COUNTRY = "Country";

        this.TXN_TYPES =
        {
            ADD_CREDIT: 'Add Credit',
            INVESTMENT: 'Investment',
            CAPITAL_RETURN: 'Capital Return',
            INTEREST_GAIN: 'Interest Gain'
        };

        this.country_list =
        {
            0: 'All'
        };

        this.user_credentials_reference = user_credentials;
        this.transaction_log =
        {
            0: {
                'Date': '2015-01-01',
                'Amount': '100000',
                'Currency': 'IDR',
                'Balance': '10000',
                'TransactionType': this.TXN_TYPES.ADD_CREDIT,
                'Country': 'id'
            },
            1: {
                'Date': '2015-01-01',
                'Amount': '200000',
                'Currency': 'IDR',
                'Balance': '10000',
                'TransactionType': this.TXN_TYPES.ADD_CREDIT,
                'Country': 'id'
            }
        };

        this.transaction_log_filtered = {};

        this.init_filter = function (country, duration) {

            for (var i = 0; i < 100; i++) {
                this.transaction_log[i] = {
                    'Date': i,
                    'Amount': '100000',
                    'Currency': 'IDR',
                    'Balance': '10000',
                    'TransactionType': this.TXN_TYPES.ADD_CREDIT,
                    'Country': 'id'
                };
            }
            this.transaction_log_filtered = angular.copy(this.transaction_log);

        };


    }
    ]
);