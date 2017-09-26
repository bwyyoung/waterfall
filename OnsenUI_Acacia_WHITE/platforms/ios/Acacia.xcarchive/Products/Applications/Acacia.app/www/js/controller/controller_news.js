/**
 * Created by bwyyoung on 1/9/16.
 */
var scope_news;
/**
 * @controller news
 * @desc news controller for news feed
 * - currently, we show a news feed of numoni website using iframe
 * - in future implementation:
 *      - load rss feed of latest loans, super deals, loan trends, etc.
 *      - website that is built specifically for marketplace. mini website.
 */
Acacia.controller('news', ['$scope', '$window', '$timeout',
        function ($scope, $window, $timeout) {
            scope_news = $scope;
            $scope.web_loaded = false;
            $scope.interval_id = 0;

            /**
             * @function is_menu_open
             * @desc is sliding menu open?
             * @returns {boolean}
             */
            $scope.is_menu_open = function () {
                return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
            };

            /**
             * @function init
             * @desc initialisation function
             * - back button event
             */
            $scope.init = function () {
                $scope.web_loaded = false;
                $(document).on(EVENT_BACKBUTTON,
                    function () {
                        $scope.load_page_home();
                    }
                );
            };
            $scope.init();

            /**
             * @function is_web_loaded
             * @desc did we load the website?
             * @returns {boolean}
             */
            $scope.is_web_loaded = function () {
                return $scope.web_loaded;
            };

            /**
             * @function destroy
             * @desc destroy all events associated with controller
             * - back button
             * - elements on show event
             * - interval for elements on show
             */
            $scope.$on("$destroy", function () {
                $scope.web_loaded = false;
                $(document).off(EVENT_BACKBUTTON);
                $('#header, #header-clone, #page-title, #loading, #sidebar,  .fixed-footer').off();
                clearInterval($scope.interval_id);
            });

            /**
             * @function init_news
             * @desc initialisation of web iframe
             * - try to remove header and footer from web iframe,
             * in order to prevent user from navigating away from designated website
             *      - only works on ANDROID, NOT IOS
             * - set interval event to check if these items are visible
             */
            $scope.init_news = function () {
                var f = $('#news');
                f.load(function () {
                    $scope.web_loaded = true;
                    scope_apply($scope);
                    debug_log('news load function ' + $scope.web_loaded);
                    f.contents().find('#header, #header-clone, #page-title, #loading, #sidebar, .fixed-footer').hide();
                });
                $('#header, #header-clone, #page-title, #loading, #sidebar,  .fixed-footer').on('show', function () {
                    $scope.web_loaded = true;
                    scope_apply($scope);
                    debug_log('news SHOW load function ' + $scope.web_loaded);
                    $(this).hide();
                });
                $scope.interval_id = setInterval(function () {
                    debug_log('removing elements');
                    $('#news').contents().find('#header, #header-clone, #page-title, #loading, #sidebar, .fixed-footer').remove();
                }, 500);
            };

            /**
             * @function load_page_home
             * @desc load home page.
             */
            $scope.load_page_home = function () {
                scope_slidemenu_left.page_load_home();
            };
        }
    ]
);