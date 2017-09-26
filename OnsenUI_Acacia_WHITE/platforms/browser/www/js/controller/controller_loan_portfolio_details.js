var scope_loan_portfolio_details = null;

/**
 * @controller loan_portfolio_details
 * @desc the details dialog controller for loan portfolios
 */
Acacia.controller('loan_portfolio_details',
    ['$scope', '$window', '$timeout', '$rootScope', 'service_alert', 'network_loan_portfolio',
        function ($scope, $window, $timeout, $rootScope, service_alert, network_loan_portfolio) {
            scope_loan_portfolio_details = $scope;

            /**
             * @function init
             * @desc initialisation function
             * - initialise loan portfolio references into scope
             */
            $scope.init = function () {
                $scope.nw_loan_portfolio = network_loan_portfolio;
                $scope.total_investment_reference = network_loan_portfolio.total_investment_log;
                $scope.loan_portfolio_reference = network_loan_portfolio.loan_portfolio_selected;
            };
            $scope.init();

            /**
             * @function click_column_filter
             * @desc this controller is shared with the loan portfolio select column alert screen,
             * and based on the click of column filter, we can choose the columns we want to view.
             * @param event
             * the click event.
             * event.target.id --> the input checkbox ID in which the event came from
             * event.target.checked --> is the checkbox checked?
             */
            $scope.click_column_filter = function (event) {
                debug_log('click_column_filter ' + event.target.id + '|' + event.target.checked);
                $scope.nw_loan_portfolio.set_column_visible(event.target.id, event.target.checked);
            };

            /**
             * @function init_select_column
             * @desc initialise the select column dialog, by checking each checkbox in the dialog,
             * based on user settings.
             */
            $scope.init_select_column = function () {
                for (var key in $scope.nw_loan_portfolio.display_column) {
                    if (!$scope.nw_loan_portfolio.display_column.hasOwnProperty(key))
                        continue;
                    var checkbox = $('#' + key);
                    if (checkbox.length == 0)
                        continue;
                    checkbox.prop('checked', $scope.nw_loan_portfolio.display_column[key]);
                }
            };

            /**
             * @function click_column_selection
             * @desc click OK on select column dialog, and confirm column filter.
             */
            $scope.click_column_selection = function () {
                if (typeof alertdialog == 'undefined')
                    return;
                alertdialog.hide();
                alertdialog.destroy();
            };
        }
    ]
);