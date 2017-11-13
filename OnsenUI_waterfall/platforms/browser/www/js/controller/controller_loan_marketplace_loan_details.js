





Acacia.controller('loan_marketplace_loan_details',
    ['$scope','$http', '$q', '$timeout', 'network_search_loan_marketplace','invest_loan_marketplace','service_alert',
        function($scope,$http,$q, $timeout, network_search_loan_marketplace, invest_loan_marketplace, service_alert)
        {
            debug_log('loaded controller loan_marketplace_loan_details');
            $scope.current_investment;

            $scope.init = function ()
            {
                $scope.current_investment = invest_loan_marketplace.get_selected_investment();

                $(document).on(EVENT_BACKBUTTON,
                    function()
                    {
                        try 
                        {
                            if (!isNull(alertdialog))
                            {
                                alertdialog.hide();
                                alertdialog.destroy();
                                alertdialog = null;
                            }
                        }
                        catch(err)
                        {
                            
                        }
                        
                    }
                );
            }
            $scope.init();
            
            $scope.init_display_loan_details = function () {
                debug_log('init_display_loan_details ' + "#rateyo_details_" + $scope.current_investment.index);
                $(".rateYo_details")
                    .rateYo(
                    {
                        rating: $scope.current_investment.rating,
                        halfStar: true,
                        disableMouse: true,
                        ratedFill: "#ffffff",
                        spacing: '10px',
                        starWidth: '10px'
                    }
                );
            }

            $scope.click_invest = function()
            {
                //create loading dialog, and confirmation

                network_search_loan_marketplace.invest_product($scope.current_investment);
            }

        }
    ]
);
