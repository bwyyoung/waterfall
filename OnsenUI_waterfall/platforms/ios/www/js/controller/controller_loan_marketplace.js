/**
 * Created by bwyyoung on 18/7/16.
 */


var scope_loan_marketplace;

waterfall.controller('loan_marketplace',
    ['$sce','$scope','$http', '$q', '$timeout', 'network_search_loan_marketplace','invest_loan_marketplace','service_alert',
    function($sce,$scope,$http, $q, $timeout, network_search_loan_marketplace, invest_loan_marketplace, service_alert) {

        scope_loan_marketplace = $scope;
        $scope.$timeout = $timeout;
        $scope.shownItem = null;
        $scope.item_height = 126;
        $scope.list_num_items = 10000000 + 1;

        var viewport = {
            width  : $(window).width(),
            height : $(window).height()
        };

        $scope.slidemenu_open = function () 
        {
            app.slidingMenu.toggleMenu();
        };

        $scope.init = function () 
        {
            app.slidingMenu.setSwipeable(false);

            network_search_loan_marketplace.reset_marketplace_list();
            $scope.deferred_list = {};

            //create custom event in lazy repeat list, that triggers when scrolling the list
            $( document ).on( EVENT_LAZY_SCROLL,
                function()
                {
                    //disable the expanded list item upon scrolling, in order to stabilize rendering of list.
                    if (!isNull($scope.shownItem))
                        $scope.shownItem = null;
                    network_search_loan_marketplace.check_items_inview($scope);
                }
            );
            $(document).on(EVENT_BACKBUTTON, function()
            {
                if (service_alert.alert_cleared.value)
                {
                    scope_slidemenu_left.page_load_home();
                }
            });
        };

        $scope.$on("$destroy", function()
        {
            $(document).off(EVENT_BACKBUTTON);
            $(document).off(EVENT_LAZY_SCROLL);
            app.slidingMenu.setSwipeable(false);
            delete $scope.MyDelegate;
            $('#loan_marketplace_list').remove();
            $.each($scope.deferred_list, function (key, value)
            {
                value.resolve();
            });
            network_search_loan_marketplace.reset_marketplace_list();
        });

        $scope.is_menu_open = function () {
            return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
        };
        
        $scope.init();

        /*
        * trust as html does not seem to work right now. need to find out the reason.
        * Using custom directive bind-html-unsafe for now.
        */
        $scope.render_rating = function (item)
        {
            debug_log('render rating ' + item);
            return $sce.trustAsHtml(item.rating_render);
        };


        $scope.show_form_search = function()
        {
            app.slidingMenu.setMainPage('slidemenu_left/10_search.html', {closeMenu: true});
        };

        $scope.load = function ($done) {
            $timeout(function () {
                $http.jsonp('http://numbersapi.com/random/year?callback=JSON_CALLBACK')
                    .success(function (data) {
                        //debug_log('scope load success');
                    })
                    .error(function () {
                        //debug_log('scope load error');
                    })
                    .finally(function () {
                        $done();
                    });
            }, 1000);
        };

        $scope.reset = function () {
            $scope.items.length = 0;
        };

        $scope.click_listrow_information = function (item, $event) {
            $event.stopPropagation();
            if (!item.loaded )
                return;
            if (BOOL_USER_LOGGED_IN_GUEST)
                return service_alert.create_alert(service_alert.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_1);
            if ($scope.isGroupShown(item)) {
                $scope.shownItem = null;
            } else {
                $scope.shownItem = item;
            }
        }

        $scope.check_list_item_show = function (item) {
            $scope.check_item_inview(item);

            if (item.index == network_search_loan_marketplace.NUM_TOTAL_ROW)
                return false;

            return true;
        };

        $scope.user_logged_in_registered = function () {
            return BOOL_USER_LOGGED_IN_REGISTERED;
        };


        $scope.click_invest_now = function ($event, item)
        {
            $event.stopPropagation();
            if (BOOL_USER_LOGGED_IN_GUEST)
                return service_alert.create_alert(service_alert.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_2);
            invest_loan_marketplace.save_selected_investment(item);
            service_alert.create_alert(service_alert.ALERT_LOAN_MARKETPLACE_LOAN_DETAILS, false);
        };

        $scope.debug_configureItemScope = function (generated_index, itemScope) {
            if (itemScope.item)
                return;

            var generated_rating = generated_index % 5  + 1;
            itemScope.item =
            {
                index: generated_index,
                title: 'Loan #' + (generated_index + 1),
                label: '',
                desc: '',
                rating: generated_rating,
                imgsrc: '',
                loaded: false,
                investment: 0,
                returns: 0,
                duration: 0
            };

            if (generated_index == $scope.list_num_items - 1)
                return;

            var deferred = $q.defer();
            itemScope.deferred = deferred;
            $scope.deferred_list[generated_index] =  itemScope.deferred;
            $http.get('https://baconipsum.com/api/?type=all&sentences=3', {timeout: deferred.promise}).success(
                function (data) {
                    itemScope.item =
                    {
                        index: generated_index,
                        title: 'Loan #' + (generated_index + 1),
                        label: '',
                        desc: '',
                        rating: generated_rating,
                        imgsrc: ("http://loremflickr.com/32/32/face,person,profile/all?" + Math.random()),
                        loaded: true,
                        investment: ((generated_index + 1) * 1000) % 10000,
                        returns: (generated_index + 1) * 1000 * 1.5 % 10000,
                        duration: (generated_index + 1) % 30
                    };

                    $("#rateyo_" + generated_index).rateYo(
                        {
                            rating: generated_rating,
                            halfStar: true,
                            disableMouse: true,
                            spacing: '10px',
                            starWidth: '10px'
                        }
                    );

                    if (!itemScope.item)
                        return;

                    itemScope.item.desc = generated_index + '->'  + data[0];
                    itemScope.item.label = 'Makes ' + itemScope.item.desc.substr(0, itemScope.item.desc.indexOf(" ")) + 'bacon';
                    delete $scope.deferred_list[generated_index];
                }
            ).error(
                function () {
                    if (!itemScope.item) {
                        return;
                    }
                    itemScope.item.desc = 'No bacon lorem ipsum';
                    itemScope.item.label = 'No bacon'
                    delete $scope.deferred_list[generated_index];
                });

        };

        $scope.MyDelegate =
        {
            configureItemScope: function (generated_index, itemScope)
            {
                //search starts at index 1, not 0.
                //return $scope.debug_configureItemScope(generated_index, itemScope);
                executeAsync(network_search_loan_marketplace.submit_search(generated_index + 1, 20, $scope, itemScope));

            },
            calculateItemHeight: function (index)
            {

                return $scope.item_height;
            },
            countItems: function ()
            {
                //return 10000;
                return network_search_loan_marketplace.NUM_TOTAL_ROW + 1;
            },
            destroyItemScope: function (index, scope)
            {
                index = parseInt(index);
                network_search_loan_marketplace.delete_marketplace_list_item(index + 1);
                debug_log("Destroyed item #" + index);
                try
                {
                    scope.deferred.resolve();
                }
                catch(err)
                {

                }
                if ($('#item_' + index).length > 0)
                    $('#item_' + index).css("top", $scope.item_height * index);

                if (!scope.item.desc) {
                    delete scope.item;
                }
            }
        };

        $scope.check_item_inview = function(item)
        {
            if (isNull($('#item_' + item.index).offset()))
                return;

            item.inview = false;
            var css_top = parseInt($('#item_' + item.index).offset().top);
            if(css_top > (-viewport.height / 8) && css_top < viewport.height)
                item.inview = true;

            return item.inview;
        }
        
        $scope.isGroupShown = function(item) 
        {
            if (!isNull($scope.shownItem))
            {
                if ($scope.shownItem.index < item.index)
                    $('#item_' + item.index).css("top", $scope.item_height * item.index + $scope.item_height + 5);
                else if ($scope.shownItem.index >= item.index)
                    $('#item_' + item.index).css("top", $scope.item_height * item.index);
            }
            else if (item.index != 0)
            {
                $('#item_' + item.index).css("top", $scope.item_height * item.index);
            }
            else
            {

            }
            return $scope.shownItem === item;
        };


    }
    ]
);