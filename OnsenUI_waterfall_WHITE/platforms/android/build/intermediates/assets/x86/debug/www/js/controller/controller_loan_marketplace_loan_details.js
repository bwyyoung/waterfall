var scope_loan_marketplace_loan_details;

/**
 * @controller loan_marketplace_loan_details
 * @desc the details dialog of the loan, and the controller function.
 */
waterfall.controller('loan_marketplace_loan_details',
    ['$scope', '$http', '$q', '$timeout', 'network_search_loan_marketplace', 'invest_loan_marketplace', 'service_alert',
        function ($scope, $http, $q, $timeout, network_search_loan_marketplace, invest_loan_marketplace, service_alert) {
            $scope.current_investment = null;
            scope_loan_marketplace_loan_details = $scope;

            /**
             * @function init
             * @desc initialisation function
             * - setup event backbutton
             * - get current investment details
             */
            $scope.init = function () {
                $scope.current_investment = invest_loan_marketplace.get_selected_investment();
                $(document).on(EVENT_BACKBUTTON,
                    function () {
                        try {
                            if (!isNull(alertdialog)) {
                                alertdialog.hide();
                                alertdialog.destroy();
                                alertdialog = null;
                            }
                        }
                        catch (err) {
                        }

                    }
                );
            };
            /**
             * @function destroy
             * @desc destroy function call when controller is killed.
             */
            $scope.$on('$destroy', function () {
                app.slidingMenu.setSwipeable(false);
            });

            $scope.init();

            /**
             * @function init_display_loan_details
             * @desc initialise loan details display
             * - rateyo rating initialised.
             */
            $scope.init_display_loan_details = function () {
                $(".rateYo_details")
                    .rateYo(
                        {
                            rating: $scope.current_investment.rating,
                            halfStar: true,
                            disableMouse: true,
                            spacing: '10px',
                            starWidth: '10px'
                        }
                    );
            };

            /**
             * @function click_invest
             * @desc user clicks invest, send message to server
             */
            $scope.click_invest = function () {
                //create loading dialog, and confirmation
                network_search_loan_marketplace.invest_product($scope.current_investment);
            }

        }
    ]
);