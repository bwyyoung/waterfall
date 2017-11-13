/**
 * Created by bwyyoung on 11/7/16.
 */


var scope_search;
Acacia.controller('search', ['$scope','service_alert', 'network_search_loan_marketplace',
        function($scope, service_alert, network_search_loan_marketplace)
        {
            var screen_width = $(window).width();
            var percentage = 7/100;
            var pixels = (Math.floor(percentage * screen_width)).toString() + 'px';
            scope_search = $scope;
            $scope.loan_term_range_object =
            {
                0 : {'10' : 'days'},
                1 : {'20' : 'days'},
                2 : {'30': 'days'},
                3 : {'40' : 'days'},
                4 : {'50': 'days'},
                5 : {'60': 'days'}
            };
            $scope.slidemenu_open = function ()
            {

                app.slidingMenu.toggleMenu();

            };
            
            $(window).resize(function()
            {
                $scope.update_rating_dimensions();
            });

            $scope.$on('$destroy', function iVeBeenDismissed() {
                app.slidingMenu.setSwipeable(false);
            });

            $scope.update_rating_dimensions = function ()
            {
                //does not seem to update on window resize for desktop browser.
                $("#rateYo").rateYo(
                    {
                        rating: 3,
                        halfStar: false,
                        fullStar: true,
                        ratedFill : "#ffffff",
                        spacing   :  pixels,
                        starWidth :  pixels
                    }
                );
            }

            $scope.show_form_search = function()
            {
                app.slidingMenu.setMainPage('slidemenu_left/10_search.html', {closeMenu: true});
            }


            $scope.setup_terms_range = function () 
            {
                $scope.search = {};
                $scope.search.loan_term_range_value = 0;

                $scope.search.loan_amount = format_dollar_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT_WHOLE, '100');

                $('.range').change( function()
                {
                    $('.clearable_dollar').blur();
                });
                $('.clearable_dollar').val($scope.search.loan_amount);
            }

            $scope.click_search = function()
            {
                //need to validate the users input
                debug_log('rating ' + $("#rateYo").rateYo("rating"));
                $scope.search.rating = $("#rateYo").rateYo("rating");
                debug_log('loan amount ' + $scope.search.loan_amount);
                debug_log('loan term ' + $scope.search.loan_term_range_value);
                network_search_loan_marketplace.reset_marketplace_list();
                network_search_loan_marketplace.save_search($scope.search);
                app.slidingMenu.setMainPage('slidemenu_left/3_loans_marketplace.html', {closeMenu: true});
            }
            
            $scope.update_loan_term_display_text = function ()
            {
                var index = Math.floor($scope.search.loan_term_range_value / 100 * (Object.keys($scope.loan_term_range_object).length) );
                var keys  = Object.keys($scope.loan_term_range_object[index]);

                $scope.search.loan_term_display_text = keys[0] + ' ' + $scope.loan_term_range_object[index][keys[0]];
                $scope.search.search_term_integer = keys[0];
                $scope.search.search_term_unit_time = $scope.loan_term_range_object[index][keys[0]]
                    .replace('days', 'day')
                    .replace('months', 'month')
                    .replace('years', 'year');
            }

            $scope.click_cancel = function()
            {
                app.slidingMenu.setMainPage('slidemenu_left/1_home.html', {closeMenu: true});
            }

            $scope.init = function ()
            {
                debug_log('CONTROLLER SEARCH INIT');

                app.slidingMenu.setSwipeable(false);
                $scope.update_rating_dimensions();
                setup_credit_box($scope, 'price');
                $scope.setup_terms_range();

            }

            $scope.init();
            $(document).ready(function () {
                $scope.update_loan_term_display_text();
            });

        }]
);

function destroy_credit_box() {
    $('.clearable_dollar').unbind();
}

function setup_credit_box(scope, box_id)
{

    function toggle_clearinput(v)
    {
        return v?'addClass':'removeClass';
    }

    function loan_amount_verifyinput(evt, value)
    {
        var charCode = keycodes_translate_android(evt, value);
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

    $('.clearable_dollar').bind('keydown',function(evt)
    {
        if (!loan_amount_verifyinput(evt, $(this).val()))
            document.getElementById(box_id).value  = '';
        return (loan_amount_verifyinput(evt,$(this).val()));
    });


    $('.clearable_dollar').bind('keyup',function(event)
    {
        if (!loan_amount_verifyinput(event,$(this).val()))
        {
            document.getElementById(box_id).value  = $(this).val().substring(0, $(this).val().length - 1);
            return loan_amount_verifyinput(event,$(this).val());
        }
        document.getElementById(box_id).value  = format_dollar_comma_numberstring(DEFAULT_CURRENCY_NUMBER_FORMAT_WHOLE, $(this).val());
    });
}

function format_dollar_comma_numberstring(numberformat, value)
{
    //remove dollar sign
    var symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
    var symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];

    value =value.replace(symbol, '').replace(symbol_native, '').replace(/,/g, '');

    //add commas
    if (isNull(value)|| value.length == 0)
        return '';
    value = parseInt(value);
    value = numberformat.format(value).replace(symbol, symbol_native);
    if (isNull(value))
        value = '';

    return value;
}
