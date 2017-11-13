/**
 * Created by bwyyoung on 27/7/16.
 */

/**
 * @controller loading_api
 * @desc show a specific loading message, when loading screen is up.
 */
waterfall.controller('loading_api', ['$scope', 'service_alert',
        function ($scope, service_alert) {
            $scope.alert_message = 'loading_api uninitialised';

            //we watch the value, so that the loading message will always be updated on time.
            $scope.$watch(
                function () {
                    return service_alert.alert_message;
                },
                function (newValue) {
                    $scope.alert_message = newValue;
                }
            );
        }
    ]
);
