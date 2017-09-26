

var scope_transaction_history = null;

/**
 * @controller transaction_history
 * @desc controller for transaction history.
 */

Acacia.controller('transaction_history',
    ['$scope', '$window', '$timeout', '$rootScope', 'service_alert', 'network_transaction',
        function ($scope, $window, $timeout, $rootScope, service_alert, network_transaction) {
            console.log('loading transaction_history controller');
            scope_transaction_history = $scope;

            $scope.get_transactions = function () {
                return network_transaction.transaction_log_filtered;
            };

            $scope.is_menu_open = function () {
                if (isNull(scope_slidemenu_left))
                    return false;
                return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
            };

            $scope.slidemenu_open = function () {
                app.slidingMenu.toggleMenu();
            };

            $scope.init = function () {
                network_transaction.init_filter('', '');
            };
            $scope.init();

            $scope.$on("$destroy", function () {

            });

            $scope.get_date = function (transaction) {
                return transaction[network_transaction.MESSAGE_KEY_DATE];
            };
            $scope.get_type = function (transaction) {
                return transaction[network_transaction.MESSAGE_KEY_TRANSACTION_TYPE];

            };
            $scope.get_amount = function (transaction) {
                return transaction[network_transaction.MESSAGE_KEY_AMOUNT];
            };
            $scope.get_balance = function (transaction) {
                return transaction[network_transaction.MESSAGE_KEY_BALANCE];
            };
        }]
);
