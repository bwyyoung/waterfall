/**
 * Created by bwyyoung on 27/7/16.
 */

Acacia.controller('loading_api',[ '$scope', 'service_alert',
    function ($scope, service_alert)
    {
        $scope.alert_message = 'loading_api uninitialised';
        $scope.$watch(
            function()
            {
                return service_alert.alert_message;
            },
            function(newValue)
            {
                $scope.alert_message = newValue;
            }
        );
    }
]
);
