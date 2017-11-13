//Difine angular module.


var scope_slidemenu_left;

waterfall.controller('slidemenu_left',  ['$scope', '$window', '$timeout','user_credentials','service_alert',
	function($scope, $window,$timeout, user_credentials, service_alert)
	{
		debug_log('loading slidemenu left');
		scope_slidemenu_left = $scope;
		$scope.window = window;
		$scope.bool_slidemenu_left_user_access = false;
		$scope.hideDialog = true;
		$scope.cur_main_page = DEFAULT_HOME_URL;
		$scope.redirect_home_page = false;
		$scope.redirect_loan_marketplace = false;
		$scope.profile_image = user_credentials.profile_image;

		$scope.$watch(
			function()
			{
				return user_credentials.profile_image;
			},
			function(newValue)
			{
				$scope.profile_image = newValue;
			}
		);

		

		$scope.verify_user_registered_logged_in = function ()
		{
			return BOOL_USER_LOGGED_IN_REGISTERED;
		};

		$scope.verify_user_guest_logged_in = function ()
		{
			return BOOL_USER_LOGGED_IN_GUEST;
		};

		$scope.verify_user_credit_enough = function ()
		{
			if ($scope.credit < DEFAULT_CREDIT_MINIMUM)
			{
				return false;
			}
			return true;
		};

		$scope.toggleAccess = function()
		{
			if (!DEBUG_NO_LOCALSTORAGE)
			{
				var temp = window.localStorage.getItem(USER_LOGGED_IN);
				temp = !toBool(temp);
				window.localStorage.setItem(USER_LOGGED_IN, temp);
			}
		};

		$scope.setup_menu = function()
		{
			if (!DEBUG_NO_LOCALSTORAGE)
			{
				debug_log ('setup menu '  + window.localStorage.getItem(USER_LOGGED_IN));
			$scope.bool_slidemenu_left_user_access = toBool(window.localStorage.getItem(USER_LOGGED_IN));
				return;
			}
			else
			{
				$scope.bool_slidemenu_left_user_access = BOOL_USER_LOGGED_IN_REGISTERED;
			}
		}

		$scope.page_load_home = function()
		{

				app.slidingMenu.closeMenu();
			$timeout(
			function() {
				app.slidingMenu.setMainPage(DEFAULT_HOME_URL);
			}, 100);
		}

		$scope.page_load_inbox = function(load)
		{
			if (!load)
				return;

			app.slidingMenu.closeMenu();

			$timeout(
				function() {
			app.slidingMenu.setMainPage('slidemenu_left/2_inbox.html');
				}, 100);
		}

		$scope.page_load_loans_marketplace = function()
		{
			debug_log('loading loans');
			app.slidingMenu.closeMenu();
			if (app.slidingMenu.getMainPage() == 'slidemenu_left/3_loans_marketplace.html')
				return;
			$timeout(
				function() {
					app.slidingMenu.setMainPage('slidemenu_left/3_loans_marketplace.html')
				}, 100);
		}

		$scope.page_load_loans_portfolio = function(load)
		{
			if (!load)
				return;

				app.slidingMenu.closeMenu();
			$timeout(
				function() {
			app.slidingMenu.setMainPage('slidemenu_left/4_my_loans_portfolio.html');
				}, 100);
		}

		$scope.page_load_profile = function(load)
		{
			if (!load)
				return;

				app.slidingMenu.closeMenu();

			$timeout(
				function() {
			app.slidingMenu.setMainPage('slidemenu_left/5_my_profile.html');
				}, 100);
		}


		$scope.page_load_contact = function(load)
		{
			if (!load)
				return;

				app.slidingMenu.closeMenu();

			$timeout(
				function() {
			app.slidingMenu.setMainPage('slidemenu_left/6_contact_us.html');
				}, 100);
		}

		$scope.page_load_settings = function(load)
		{
			if (!load)
				return;

				app.slidingMenu.closeMenu();

			$timeout(
				function() {
			app.slidingMenu.setMainPage('slidemenu_left/7_settings.html');
				}, 100);
		}

		$scope.page_load_logout= function(load)
		{
			if (!load)
				return;
			app.slidingMenu.closeMenu();
			$timeout(
				function() {
					service_alert.create_alert(service_alert.ALERT_LOGOUT_CONFIRM)
						.then(
							function (dialog) {
								dialog.on('postshow', function (event)
                                {
                                    app.slidingMenu.setMainPage('slidemenu_left/8_logout.html');
								});

							}
						);
				}, 100);
		};

		$scope.profile_picture_click = function()
		{

			if (!DEBUG_NO_LOCALSTORAGE)
				return;
			if (!BOOL_USER_LOGGED_IN_REGISTERED)
			{
				app.slidingMenu.closeMenu();
				$scope.show_form_splash();
			}
			else
			{
				$scope.page_load_profile(true);
			}
	   };



		$scope.getProfileImage = function()
		{
			return user_credentials.profile_image;
		}

		$scope.BOOL_SLIDING_MENU_OPEN = false;

		$scope.sliding_menu_fix = function()
		{
			app.slidingMenu.on("preopen", function()
			{
				debug_log('preopen');

			});

			app.slidingMenu.on("postopen", function()
			{


				$scope.BOOL_SLIDING_MENU_OPEN = true;
				debug_log('postopen');
				$timeout(
					function ()
					{
						$('#special_hide').prop('disabled', false);
						scope_apply($scope);
					}, 200);

			});
			app.slidingMenu.on("preclose", function()
			{
				debug_log('preclose');
				$('#menu_scroller > .ons-scroller__content').scrollTop({scrollTop : 0},250);
				$('#menu_list').animate({scrollTop : 0},250);
				$('#menu_page').animate({scrollTop : 0},250);

			});
			app.slidingMenu.on("postclose", function()
			{
				$scope.BOOL_SLIDING_MENU_OPEN = false;
				debug_log('postclose');
				$timeout(
					function () {
						$('#special_hide').prop('disabled', true);
						scope_apply($scope);
					}, 100);
			});
		}

		$scope.backbutton_disable =  function()
		{
			ons.setDefaultDeviceBackButtonListener(onBackButton);
			app.slidingMenu.getDeviceBackButtonHandler().setListener(onBackButton);
			ons.disableDeviceBackButtonHandler();
		};

        $scope.show_page_dummy = function()
        {
            app.slidingMenu.setMainPage('slidemenu_left/9_dummy.html', {closeMenu: true});
        };

		$scope.show_form_search = function()
		{
			app.slidingMenu.setMainPage('slidemenu_left/10_search.html', {closeMenu: true});
		};

		$scope.dialog_prepare = function(dialog)
		{
			dialog.getDeviceBackButtonHandler().disable();
			dialog.on('preshow', function()
			{
				scope_slidemenu_left.cur_main_page = app.slidingMenu.getMainPage();
				app.slidingMenu.setMainPage('slidemenu_left/9_dummy.html', {closeMenu: true});
			});
	            dialog.on('postshow', function()
	            {
	                executeAsync(function(){
	                    $('#special_hide').prop('disabled', false);
	                });
	            });
			dialog.on('prehide', function()
			{
				executeAsync(function(){
					$('#special_hide').prop('disabled', true);
				});
				app.slidingMenu.setMainPage(scope_slidemenu_left.cur_main_page, {closeMenu: true});
			});
			dialog.on('posthide', function (event)
			{
				dialog.destroy();
			});
			dialog.show();
		};

		$scope.show_form_addcredit = function ()
		{
			return ons.createDialog('credit/1_lets_add_funds.html').then
			(
				function(dialog)
				{
					$scope.dialog_prepare(dialog);
				}
			);
		}

		$scope.show_form_splash = function()
		{
			return ons.createDialog('registration/splash.html').then(
				function(dialog)
				{
					$scope.dialog_prepare(dialog);
				}
			);
		}

		$scope.show_form_signup = function ()
		{
			$scope.show_form_splash().then(function ()
			{
				scope_registration
					.page_load_signup();
			});
		}

		$scope.init = function()
		{
			app.slidingMenu.setSwipeable(false);

			debug_log('slidemenu_left init function called');
			if (!BOOL_USER_LOGGED_IN_REGISTERED && !BOOL_USER_LOGGED_IN_GUEST)
				scope_slidemenu_left.show_form_splash();
			doubleclick_fix();
			if (isMobileDevice())
			{
				cordova.plugins.Keyboard.disableScroll(true);
			}
			$scope.$on('$viewContentLoading',
				function(event, viewConfig){
					console.log('slidemenu content loading: ', event, viewConfig)
				});

			$scope.$on('$viewContentLoaded',
				function(event){
					console.log('slidemenu content loaded: ',event);
					$('#special_hide').prop('disabled', true);
				});
		};

		$scope.$on('initialised', function () {
			$scope.init();
		});
		
		$scope.get_user_level = function () {
			return user_credentials.level;
		}

		$scope.get_name = function () {
			return user_credentials.name;
		}

		$scope.get_username = function () {
			return user_credentials.username;
		}
		$scope.get_credit_formatted_string = function ()
		{
			var symbol_native = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol_native'];
			var symbol = CURRENCY_LIST[DEFAULT_CURRENCY]['symbol'];
			return DEFAULT_CURRENCY_NUMBER_FORMAT.format(user_credentials.credit).replace(symbol, symbol_native);
		}
	}
])
.directive(
'profileImg', function(){
    return function(scope, element, attrs)
    {
	    scope.$watch('profile_image', function(newVal, oldVal)
	    {
	        var url = scope.getProfileImage();
	        element.css({
	            'background-image': 'url(' + url +')',
	        });
        }
        );
    };
}).directive('initialisation',['$rootScope',function($rootScope) {
	return {
		restrict: 'A',
		link: function($scope) {
			var to;
			var listener = $scope.$watch(function() {
				clearTimeout(to);
				to = setTimeout(function () {
					console.log('initialised');
					listener();
					$rootScope.$broadcast('initialised');
				}, 50);
			});
		}
	};
}]);


