/**
 * Created by bwyyoung on 18/7/16.
 */


var scope_loan_marketplace;
/**
 * @controller loan_marketplace
 * @desc controller for loan marketplace, with the infinite scrolling ONSEN lazy-repeat list
 */
Acacia.controller('loan_marketplace',
    ['$sce', '$scope', '$http', '$q', '$timeout', 'network_search_loan_marketplace', 'invest_loan_marketplace', 'service_alert',
        function ($sce, $scope, $http, $q, $timeout, network_search_loan_marketplace, invest_loan_marketplace, service_alert) {

            scope_loan_marketplace = $scope;
            $scope.$timeout = $timeout;
            $scope.shownItem = null;
            $scope.item_height = 126;
            $scope.list_num_items = 10000000 + 1;

            //get viewport width and height
            var viewport = {
                width: $(window).width(),
                height: $(window).height()
            };

            $scope.slidemenu_open = function () {
                app.slidingMenu.toggleMenu();
            };

            /**
             * @function init
             * @desc initialise controller
             * - events for lazy scrolling, backbutton
             */
            $scope.init = function () {
                app.slidingMenu.setSwipeable(false);

                network_search_loan_marketplace.reset_marketplace_list();
                $scope.deferred_list = {};
                //create custom event in lazy repeat list, that triggers when scrolling the list
                $(document).on(EVENT_LAZY_SCROLL,
                    function () {
                        //disable the expanded list item upon scrolling, in order to stabilize rendering of list.
                        if (!isNull($scope.shownItem))
                            $scope.shownItem = null;
                        network_search_loan_marketplace.check_items_inview($scope);
                    }
                );
                $(document).on(EVENT_BACKBUTTON, function () {
                    debug_log('event backbutton loan marketplace ' + service_alert.alert_cleared.value);
                    if (service_alert.alert_cleared.value) {
                        scope_slidemenu_left.page_load_home();
                    }
                });
            };

            /**
             * @function destroy
             * @desc on destroy, kill all events associated with this controller
             * as well as any API calls that may be pending with server.
             */
            $scope.$on("$destroy", function () {
                $(document).off(EVENT_BACKBUTTON);
                $(document).off(EVENT_LAZY_SCROLL);
                app.slidingMenu.setSwipeable(false);
                //delete delegate for lazy-repeat items
                delete $scope.MyDelegate;
                $('#loan_marketplace_list').remove();
                //kill deferred API calls
                $.each($scope.deferred_list, function (key, value) {
                    value.resolve();
                });
                network_search_loan_marketplace.reset_marketplace_list();
            });

            $scope.is_menu_open = function () {
                return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
            };

            $scope.init();

            /**
             * @function render_rating
             * @desc render html string as html code on screen for rateYo
             * we are cloning a single rateYo rating, into multiple listed rows.
             * This is more efficient and less glitchy in rendering rateYo with Lazy-Repeat lists using jQuery
             * 1. We render 1 RateYo rating hidden from the viewer
             * 2. we clone that rating into the specific row.
             * @param item
             * the item object containing the row of a marketplace listing
             * @returns {html_rating}
             * an html render of the 5 star rating.
             */
            $scope.render_rating = function (item) {
                /*
                 * trust as html with built in angular functions,
                 * does not seem to work right now. need to find out the reason.
                 * Using custom directive bind-html-unsafe for now.
                 */
                return $sce.trustAsHtml(item.rating_render);
            };

            /**
             * @function show_form_search
             * @desc show search screen, by setting main page from sliding menu
             */
            $scope.show_form_search = function () {
                app.slidingMenu.setMainPage('slidemenu_left/10_search.html', {closeMenu: true});
            };

            /**
             * @function reset
             * @desc reset loan marketplace list
             */
            $scope.reset = function () {
                $scope.items.length = 0;
            };

            /**
             * @function click_listrow_information
             * @desc click the row, expand the description if the user is registered
             * if not, show a popup dialog
             * @param item
             * the specific item in the list
             * @param $event
             * the click event. stop propagating it to other elements, if this one is clicked
             */
            $scope.click_listrow_information = function (item, $event) {
                $event.stopPropagation();
                if (!item.loaded)
                    return;
                if (BOOL_USER_LOGGED_IN_GUEST)
                    return service_alert.create_alert(service_alert.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_1);

                if ($scope.isGroupShown(item)) {
                    $scope.shownItem = null;
                } else {
                    $scope.shownItem = item;
                }
            };
            /**
             * @function check_list_item_show
             * @desc check if the item is in view, and prevent the very last row index
             * from rendering in order to allow the one
             * on top to expand the description.
             * @param item
             * @returns {boolean}
             * if item is eligible to be rendered, return true.
             */
            $scope.check_list_item_show = function (item) {
                $scope.check_item_inview(item);
                if (item.index == network_search_loan_marketplace.NUM_TOTAL_ROW)
                    return false;
                return true;
            };

            /**
             * @function user_logged_in_registered
             * @desc is the user registered when viewing this list?
             */
            $scope.user_logged_in_registered = function () {
                return BOOL_USER_LOGGED_IN_REGISTERED;
            };

            /**
             * @function click_invest_row
             * @desc when clicking the invest button, if user is registered, show loan details dialog to confirm investment
             * if not registered, show a dialog advising user to register
             * @param $event
             * @param item
             */
            $scope.click_invest_now = function ($event, item) {
                $event.stopPropagation();
                if (BOOL_USER_LOGGED_IN_GUEST)
                    return service_alert.create_alert(service_alert.ALERT_LOAN_MARKETPLACE_SIGNUP_NOTIFICATION_2);
                invest_loan_marketplace.save_selected_investment(item);
                service_alert.create_alert(service_alert.ALERT_LOAN_MARKETPLACE_LOAN_DETAILS, false);
            };

            /**
             * @function debug_configureItemScope
             * @desc the test version of our lazylist, where we originally loaded dummy data to the screen
             * @param generated_index
             * index of the current item
             * @param itemScope
             * the reference to the item currently being initialised/rendered
             */
            $scope.debug_configureItemScope = function (generated_index, itemScope) {
                if (itemScope.item)
                    return;

                var generated_rating = generated_index % 5 + 1;
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
                $scope.deferred_list[generated_index] = itemScope.deferred;
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

                        itemScope.item.desc = generated_index + '->' + data[0];
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

            /**
             * @desc A delegate for the ONSEN lazy-repeat list, and how the list gets its items rendered on screen
             * functions in this delegate are CALLED BACK when ONSENUI needs them to be called. all this is managed via ONSENUI.
             * @type {{configureItemScope: $scope.MyDelegate.configureItemScope, calculateItemHeight: $scope.MyDelegate.calculateItemHeight, countItems: $scope.MyDelegate.countItems, destroyItemScope: $scope.MyDelegate.destroyItemScope}}
             */
            $scope.MyDelegate =
            {
                /**
                 * @function configureItemScope
                 * @desc initialisation function for the list item
                 * @param generated_index
                 * index of the current item
                 * @param itemScope
                 * the reference to the item currently being initialised/rendered
                 */
                configureItemScope: function (generated_index, itemScope) {
                    //search starts at index 1, not 0.
                    //uncomment this if you want to use the debug dummy rendered items, and comment out executeAsync
                    //return $scope.debug_configureItemScope(generated_index, itemScope);
                    executeAsync(network_search_loan_marketplace.submit_search(generated_index + 1, 20, $scope, itemScope));
                },
                /**
                 * @function calculateItemHeight
                 * @desc get the row item height
                 * @param index
                 * index of row
                 * @returns {number}
                 * height in pixels
                 */
                calculateItemHeight: function (index) {
                    return $scope.item_height;
                },
                /**
                 * @function countItems
                 * @desc return the total number of maximum rows to be displayed in the lazy list
                 * @returns {total_num_rows}
                 * total number of rows returned from server, + 1 for empty blank space at bottom
                 */
                countItems: function () {
                    //return 10000;
                    return network_search_loan_marketplace.NUM_TOTAL_ROW + 1;
                },
                /**
                 * @function destroyItemScope
                 * @desc when item no longer needs to be rendered, and is to be destroyed, this function is called.
                 * - set the css top value
                 * - delete the item data obtained from server
                 * @param index
                 * index of the item
                 * @param scope
                 * item scope. reference to item object
                 */
                destroyItemScope: function (index, scope) {
                    index = parseInt(index);
                    network_search_loan_marketplace.delete_marketplace_list_item(index + 1);
                    try {
                        //sometimes there is error when trying to resolve pending API calls.
                        scope.deferred.resolve();
                    }
                    catch (err) {

                    }
                    if ($('#item_' + index).length > 0)
                        $('#item_' + index).css("top", $scope.item_height * index);

                    if (!scope.item.desc) {
                        delete scope.item;
                    }
                }
            };

            /**
             * @function check_item_inview
             * @desc check if we need to render list item/row based on coordinates (x,y) values
             * @param item
             * the item in question
             * @returns {boolean}
             * if item is in view, return true
             */
            $scope.check_item_inview = function (item) {
                if (isNull($('#item_' + item.index).offset()))
                    return;

                item.inview = false;
                var css_top = parseInt($('#item_' + item.index).offset().top);
                if (css_top > (-viewport.height / 8) && css_top < viewport.height)
                    item.inview = true;

                return item.inview;
            };

            /**
             * @function isGroupShown
             * @desc is the accordion group shown, and does it need to be rendered?
             * @param item
             * the item object
             * @returns {boolean}
             * if the currently clicked item is expanded matches with this item check from the parameter,
             * then yes, the item in the parameter is the one that is currently shown.
             */
            $scope.isGroupShown = function (item) {
                if (!isNull($scope.shownItem)) {
                    if ($scope.shownItem.index < item.index)
                        $('#item_' + item.index).css("top", $scope.item_height * item.index + $scope.item_height + 5);
                    else if ($scope.shownItem.index >= item.index)
                        $('#item_' + item.index).css("top", $scope.item_height * item.index);
                }
                else if (item.index != 0) {
                    $('#item_' + item.index).css("top", $scope.item_height * item.index);
                }

                //For iOS White Only
                if ($scope.shownItem === item)
                    $('#row_item_' + item.index).css("border-bottom", 'none');
                else
                    $('#row_item_' + item.index).css("border-bottom", '1px solid black');

                return $scope.shownItem === item;
            };


        }
    ]
);