/**
 * See: http://www.css-101.org/articles/ken-burns_effect/css-transition.php
 */

/**
 * The idea is to cycle through the images to apply the "fx" class to them every n seconds.
 * We can't simply set and remove that class though, because that would make the previous image move back into its original position while the new one fades in.
 * We need to keep the class on two images at a time (the two that are involved with the transition).
 */


var scope_loan_portfolio = null;
/**
 * @controller loan_portfolio
 * @desc controller for loan portfolio table
 */
Acacia.controller('loan_portfolio',
    ['$scope', '$window', '$timeout', '$rootScope', 'service_alert', 'network_loan_portfolio',
        function ($scope, $window, $timeout, $rootScope, service_alert, network_loan_portfolio) {
            scope_loan_portfolio = $scope;

            /**
             * @function get_loans_portfolios
             * @desc get the filtered portfolio object
             * @returns {*}
             */
            $scope.get_loans_portfolios = function () {
                return network_loan_portfolio.loan_portfolio_log_filtered;
            };

            /**
             * @function is_menu_open
             * @desc check if sliding menu is open
             * @returns {boolean}
             */
            $scope.is_menu_open = function () {
                if (isNull(scope_slidemenu_left))
                    return false;
                return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
            };

            /**
             * @function slidemenu_open
             * @desc toggle sliding menu
             */
            $scope.slidemenu_open = function () {
                app.slidingMenu.toggleMenu();
            };

            /**
             * @function init
             * @desc initialisation function
             */
            $scope.init = function () {
                network_loan_portfolio.init_filter('', '');
            };

            $scope.init();

            $scope.$on("$destroy", function () {

            });

            /**
             * @function get_column_value
             * @desc get a specific column from a row
             * @param loan_portfolio
             * object of data
             * @param key
             * the key that maps to a specific data
             * @returns {column_value}
             * value based on key in loan_portfolio object
             */
            $scope.get_column_value = function (loan_portfolio, key) {
                return loan_portfolio[key];
            };

            /**
             * @function show_column
             * @desc should the column be displayed? based on user settings under the show columns dialog.
             * @return {boolean}
             * if true, we show this column
             */
            $scope.show_column = function (key) {
                return network_loan_portfolio.display_column[key];
            };

            /**
             * @function click_select_column
             * @desc click the select column button.
             */
            $scope.click_select_column = function () {
                network_loan_portfolio.loan_portfolio_selected = null;
                service_alert.create_alert(service_alert.ALERT_LOANS_PORTFOLIO_SELECT_COLUMN, false).then(
                    function (dialog) {

                        dialog.on('prehide', function (event) {
                            scope_apply($scope);
                        });
                    });
            };

            /**
             * @function click_view_total_investment
             * @desc view total investment dialog
             */
            $scope.click_view_total_investment = function () {
                network_loan_portfolio.loan_portfolio_selected = null;
                service_alert.create_alert(service_alert.ALERT_LOANS_PORTFOLIO_TOTAL_INVESTMENT, false);
            };

            /**
             * @function display_loan_portfolio_details
             * @desc display the details of the portfolio. all details are shown, that are normally hidden in this view.
             * @param loan_portfolio
             * the loan portfolio object containing data
             */
            $scope.display_loan_portfolio_details = function (loan_portfolio) {
                network_loan_portfolio.loan_portfolio_selected = loan_portfolio;
                service_alert.create_alert(service_alert.ALERT_LOANS_PORTFOLIO_LOAN_DETAILS, false);
            };
        }]
);
