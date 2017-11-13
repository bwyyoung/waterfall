/**
 * @service network_loan_portfolio
 * @desc
 */
waterfall.service('network_loan_portfolio', ['network_api', 'service_alert', 'user_credentials', function (network_api, service_alert, user_credentials) {
        this.MESSAGE_KEY_TOTAL_INVESTMENT_AMOUNT = "TotalInvestmentAmount";
        this.MESSAGE_KEY_TOTAL_INVESTMENT_RETURN = "TotalInvestmentReturn";

        this.MESSAGE_KEY_LOAN_ID = "LoanId";
        this.MESSAGE_KEY_FUNDED_DATE = "FundedDate";
        this.MESSAGE_KEY_MATURITY_DATE = "MaturityDate";
        this.MESSAGE_KEY_TENURE = "Tenure";
        this.MESSAGE_KEY_INVESTMENT_RETURN_AMOUNT = "InvestmentReturnAmount";
        this.MESSAGE_KEY_INVESTMENT_RETURN_PERCENTAGE = "InvestmentReturnPercentage";
        this.MESSAGE_KEY_INVESTMENT_AMOUNT = "InvestmentAmount";
        this.MESSAGE_KEY_INVESTED_DATE = "InvestedDate";
        this.MESSAGE_KEY_NET_RETURN = "NetReturn";
        this.MESSAGE_KEY_REPAYMENT_STATUS = "RepaymentStatus";
        this.MESSAGE_KEY_TRANSACTION_TYPE = "TransactionType";
        this.MESSAGE_KEY_COUNTRY = "Country";
        this.MESSAGE_KEY_RATING = "Rating";
        this.MESSAGE_KEY_CURRENCY = "Currency";
        this.loan_portfolio_selected = null;

        this.REPAYMENT_STATUS = {
            PENDING: 'Pending Repayment',
            PAID: 'Paid'
        };
        this.display_column = {};

        this.country_list =
        {
            0: 'All'
        };

        this.user_credentials_reference = user_credentials;
        var that = this;

        /**
         * @function init_filter
         * @desc for now, we only copy the dummy data to be displayed on screen.
         * no filter by country, or duration.
         * @param country
         * @param duration
         */
        this.init_filter = function (country, duration)
        {
            this.loan_portfolio_log_filtered = angular.copy(this.loan_portfolio_log);
        };

        this.init = function () {
            this.display_column[this.MESSAGE_KEY_LOAN_ID] = false;
            this.display_column[this.MESSAGE_KEY_FUNDED_DATE] = true;
            this.display_column[this.MESSAGE_KEY_MATURITY_DATE] = false;
            this.display_column[this.MESSAGE_KEY_TENURE] = false;
            this.display_column[this.MESSAGE_KEY_INVESTMENT_RETURN_AMOUNT] = false;
            this.display_column[this.MESSAGE_KEY_INVESTMENT_RETURN_PERCENTAGE] = false;
            this.display_column[this.MESSAGE_KEY_INVESTMENT_AMOUNT] = true;
            this.display_column[this.MESSAGE_KEY_INVESTED_DATE] = true;
            this.display_column[this.MESSAGE_KEY_NET_RETURN] = true;
            this.display_column[this.MESSAGE_KEY_REPAYMENT_STATUS] = true;
            this.display_column[this.MESSAGE_KEY_TRANSACTION_TYPE] = false;
            this.display_column[this.MESSAGE_KEY_COUNTRY] = false;
            this.display_column[this.MESSAGE_KEY_CURRENCY] = false;
            this.display_column[this.MESSAGE_KEY_RATING] = false;
        };
        this.init();

        this.set_column_visible = function (column_name, val) {
            if (!(column_name in this.display_column))
                return debug_log(column_name + ' not found!');
            this.display_column[column_name] = val;
        };

        this.total_investment_log =
        {
            "TotalInvestmentAmount": '100',
            "TotalInvestmentReturn": '100',
        };

        this.loan_portfolio_log =
        {
            0: {
                'LoanId': '0',
                'InvestedDate': '2015-01-01',
                'FundedDate': '2015-01-01',
                'MaturityDate': '2015-01-01',
                'InvestmentAmount': '100000',
                'NetReturn': '100000',
                'InvestmentReturnAmount': '100000',
                'InvestmentReturnPercentage': '30%',
                'Currency': 'IDR',
                'RepaymentStatus': this.REPAYMENT_STATUS.PENDING,
                'Country': 'Indonesia',
                'Tenure': '30 Days',
                'Rating': 2
            },
            1: {
                'LoanId': '1',
                'InvestedDate': '2015-01-01',
                'FundedDate': '2015-01-01',
                'MaturityDate': '2015-01-01',
                'InvestmentAmount': '100000',
                'NetReturn': '100000',
                'InvestmentReturnAmount': '100000',
                'InvestmentReturnPercentage': '30%',
                'Currency': 'IDR',
                'RepaymentStatus': this.REPAYMENT_STATUS.PAID,
                'Country': 'Indonesia',
                'Tenure': '30 Days',
                'Rating': 2
            }
        };

        this.loan_portfolio_log_filtered = {};
    
    }
    ]
);