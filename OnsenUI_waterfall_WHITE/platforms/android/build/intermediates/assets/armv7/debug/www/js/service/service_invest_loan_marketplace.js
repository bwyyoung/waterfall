
/**
 * @service invest_loan_marketplace
 * @desc store the selected investment from loan marketplace here, and use it in the 'invest now'/confirmation dialogs.
 */
waterfall.service('invest_loan_marketplace', function () {
        this.selected_investment =
        {
            index: 0,
            productid: '',
            title: '',
            label: '',
            desc: '',
            rating: 0,
            imgsrc: '',
            loaded: false,
            investment: 0,
            returns: 0,
            investment_formatted: 0,
            return_formatted: 0,
            duration: 0
        };

        this.save_selected_investment = function (theinvestment) {
            this.selected_investment = angular.copy(theinvestment);

            debug_log('test ' + this.selected_investment.rating + "|"
                + this.selected_investment.imgsrc + "|"
                + this.selected_investment.title + "|"
                + this.selected_investment.label + "|"
                + this.selected_investment.desc + "|");
        };

        this.empty_selected_investment = function () {
            this.selected_investment =
            {
                index: 0,
                productid: '',
                title: '',
                label: '',
                desc: '',
                rating: 0,
                imgsrc: '',
                loaded: false,
                investment: 0,
                returns: 0,
                investment_formatted: 0,
                return_formatted: 0,
                duration: 0,
                duration_type: ''
            };
        }
        this.get_selected_investment = function () {
            return angular.copy(this.selected_investment);
        }
    }
);