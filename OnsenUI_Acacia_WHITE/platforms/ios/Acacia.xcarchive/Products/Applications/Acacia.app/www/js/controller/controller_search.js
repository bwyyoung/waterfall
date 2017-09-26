/**
 * Created by bwyyoung on 11/7/16.
 */

/**
 * @controller search
 * @desc search controller for loan marketplace
 * 
 */
var scope_search;
Acacia.controller('search', ['$scope', 'service_alert', 'network_search_loan_marketplace',
    function ($scope, service_alert, network_search_loan_marketplace) {
        var screen_width = $(window).width();
        var percentage = 7 / 100;
        var pixels = (Math.floor(percentage * screen_width)).toString() + 'px';
        scope_search = $scope;

        /**
         * @object loan_term_range_object
         * @desc range of values used for slider in selecting loan term
         * @type {{0: {10: string}, 1: {20: string}, 2: {30: string}, 3: {40: string}, 4: {50: string}, 5: {60: string}}}
         */
        $scope.loan_term_range_object =
        {
            0: {'10': 'days'},
            1: {'20': 'days'},
            2: {'30': 'days'},
            3: {'40': 'days'},
            4: {'50': 'days'},
            5: {'60': 'days'}
        };

        $scope.slidemenu_open = function () {
            app.slidingMenu.toggleMenu();
        };

        /**
         * when window is resized, update the dimensions of rateYo Rating.
         */
        $(window).resize(function () {
            $scope.update_rating_dimensions();
        });

        /**
         * @function init
         * @desc initialisation function
         * - backbutton event
         */
        $scope.init = function () {
            $(document).on(EVENT_BACKBUTTON,
                function () {
                    scope_slidemenu_left.page_load_home();
                }
            );
        };

        $scope.init();

        $scope.$on('$destroy', function () {
            app.slidingMenu.setSwipeable(false);
            $(document).off(EVENT_BACKBUTTON);
        });

        /**
         * @function update_rating_dimensions
         * @desc initialise rating based on screen size
         */
        $scope.update_rating_dimensions = function () {
            //does not seem to update on window resize for desktop browser.
            $("#rateYo").rateYo(
                {
                    rating: 3,
                    halfStar: false,
                    fullStar: true,
                    spacing: pixels,
                    starWidth: pixels
                }
            );
        };

        /**
         * @function init_search_rateyo
         * @desc init rateyo search
         */
        $scope.init_search_rateyo = function () {
            $scope.update_rating_dimensions();
        };

        /**
         * @function show_form_search
         * @desc show the search form
         */
        $scope.show_form_search = function () {
            app.slidingMenu.setMainPage('slidemenu_left/10_search.html', {closeMenu: true});
        };

        /**
         * @function setup_terms_range
         * @desc setup the range slider for loan term
         */
        $scope.setup_terms_range = function () {
            $scope.search = {};
            $scope.search.loan_term_range_value = 0;

            $scope.search.loan_amount = format_symbol_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT_WHOLE, '100');

            $('.range').change(function () {
                $('.clearable_dollar').blur();
            });
            $('.clearable_dollar').val($scope.search.loan_amount);
        };

        /**
         * @function click_search
         * @desc click search button, and save the search for the loan marketplace screen to pickup.
         */
        $scope.click_search = function () {
            //need to validate the users input
            $scope.search.rating = $("#rateYo").rateYo("rating");
            network_search_loan_marketplace.reset_marketplace_list();
            network_search_loan_marketplace.save_search($scope.search);
            app.slidingMenu.setMainPage('slidemenu_left/3_loans_marketplace.html', {closeMenu: true});
        };

        /**
         * @function update_loan_term_display_text
         * @desc as the user plays with the loan term slider, update the text displayed on screen.
         */
        $scope.update_loan_term_display_text = function () {
            var index = Math.floor($scope.search.loan_term_range_value);
            var keys = Object.keys($scope.loan_term_range_object[index]);

            $scope.search.loan_term_display_text = keys[0] + ' ' + $scope.loan_term_range_object[index][keys[0]];
            $scope.search.search_term_integer = keys[0];
            $scope.search.search_term_unit_time = $scope.loan_term_range_object[index][keys[0]]
                .replace('days', 'day')
                .replace('months', 'month')
                .replace('years', 'year');
        };

        $scope.click_cancel = function () {
            app.slidingMenu.setMainPage('slidemenu_left/1_home.html', {closeMenu: true});
        };

        /**
         * @function init
         * @desc initialisation for rating and range
         */
        $scope.init = function () {
            app.slidingMenu.setSwipeable(false);
            $scope.update_rating_dimensions();
            $scope.setup_terms_range();
        };

        /**
         * @function init_loan_amount
         * @desc setup credit box, and initialise 'steps' of range based on length of range object.
         */
        $scope.init_loan_amount = function () {
            setup_credit_box($scope, 'price');
            var keys = Object.keys($scope.loan_term_range_object).length;
            $("#loan_term_range").attr({

                'step': 1,
                'min': 0,
                'max': keys - 1,
                'value': keys
            });
        };

        $scope.init();
        $(document).ready(function () {
            $scope.update_loan_term_display_text();
        });

    }]
);

/**
 * @function destroy_credit_box
 * @desc unbind the credit box from our setup_credit_box sequence.
 */
function destroy_credit_box() {
    $('.clearable_dollar').unbind();
}

/**
 * @function setup_credit_box
 * @desc setup the credit box for currency input
 * - automatically add commas, and currency symbol
 * - delete any invalid characters input
 * @param scope
 * controller scope
 * @param box_id
 * the id of the input text field, that we wish to apply this ranged input.
 */
function setup_credit_box(scope, box_id)
{
    function toggle_clearinput(v) {
        return v ? 'addClass' : 'removeClass';
    }

    function loan_amount_verifyinput(evt, value) {
        var charCode = keycodes_translate_android(evt, value);
        //only allow numeric input
        var condition = (charCode > 31 && (charCode < 48 || charCode > 57));
        return !condition;
    }

    var textboxwidth;

    $(document).on('input', '.clearable_dollar', function () {
        $(this)[toggle_clearinput(this.value)]('x');
        textboxwidth = $(this).width();
    })
        .on('mousemove', '.x',
            function (e) {//($(this).width()/10 * 2.5)
                $(this)[toggle_clearinput(this.offsetWidth - 50 < e.clientX - this.getBoundingClientRect().left)]('onX');
            }).on('touchstart click', '.onX',
        function (ev) {
            ev.preventDefault();
            $(this).removeClass('x onX').val('').change();
            scope_apply(scope);
        })
    ;

    $('.clearable_dollar').bind('keydown', function (evt) {
        if (!loan_amount_verifyinput(evt, $(this).val()))
            document.getElementById(box_id).value = '';
        return (loan_amount_verifyinput(evt, $(this).val()));
    });


    $('.clearable_dollar').bind('keyup', function (event) {
        if (!loan_amount_verifyinput(event, $(this).val())) {
            document.getElementById(box_id).value = $(this).val().substring(0, $(this).val().length - 1);
            return loan_amount_verifyinput(event, $(this).val());
        }
        document.getElementById(box_id).value = format_symbol_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT_WHOLE, $(this).val());
    });
}

/**
 * @function format_symbol_comma_numberstring
 * @desc format a number string based on currency
 * with commas and currency symbol
 * @param numberformat
 * the currency format
 * @param value
 * the number string
 * @returns {value}
 * the formatted number string
 */
function format_symbol_comma_numberstring(numberformat, value) {
    //remove dollar sign
    var symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
    var symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];
    value = value.replace(symbol, '').replace(symbol_native, '').replace(/,/g, '');
    //add commas
    if (isNull(value) || value.length == 0)
        return '';
    value = parseInt(value);
    value = numberformat.format(value).replace(symbol, symbol_native);
    if (isNull(value))
        value = '';

    return value;
}