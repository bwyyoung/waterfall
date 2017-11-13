

var waterfall = ons.bootstrap('waterfall_Marketplace',
    ['onsen', 'ngCordova']);

/**
 * @directive bindHtmlUnsafe
 * @desc
 * directive to bind a string into useable html that can be interpreted by the browser.
 */
waterfall.directive('bindHtmlUnsafe', function ($compile) {
    return function ($scope, $element, $attrs) {

        var compile = function (newHTML) { // Create re-useable compile function
            newHTML = $compile(newHTML)($scope); // Compile html
            $element.html('').append(newHTML); // Clear and append it
        };

        var htmlName = $attrs.bindHtmlUnsafe; // Get the name of the variable
                                              // Where the HTML is stored

        $scope.$watch(htmlName, function (newHTML) { // Watch for changes to
            // the HTML
            if (!newHTML) return;
            compile(newHTML);   // Compile it
        });

    };
});

/**
 * @directive scrollTrigger
 * @desc trigger an event on scrolling.
 */
waterfall.directive('scrollTrigger', function ($window) {
    return {
        link: function (scope, element, attrs) {
            var offset = parseInt(attrs.threshold) || 0;
            var e = jQuery(element[0]);
            var doc = jQuery(document);
            angular.element(document).bind('scroll', function () {
                if (doc.scrollTop() + $window.innerHeight + offset > e.offset().top) {
                    scope.$apply(attrs.scrollTrigger);
                }
            });
        }
    };
});


/**
 * onsen ready event function
 * when onsen is ready for us to use, we do our initialisation functions.
 */
ons.ready(function () {
    doubleclick_fix();
    if (isMobileDevice()) {
        var deviceType = (navigator.userAgent.match(/iPad/i)) == "iPad" ? "iPad" :
            (navigator.userAgent.match(/iPhone/i)) == "iPhone" ? "iPhone" :
                (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" :
                    (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
        //check if notifications are allowed on system.
        cordova.plugins.notification.local.hasPermission(function (granted) {
            debug_log('cordova.plugins.notification.local.hasPermission ' + granted);
            if (!granted)
                cordova.plugins.notification.local.registerPermission(function (granted) {
                    if (!granted)
                        showToast('Notifications disabled');
                });
        });
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);

        //iOS 10 resolves the 'floating cursor' issue, and has automatic scrollup and scrolldown with keyboard visible events.
        //therefore, there is no need for the keyboard_scroll library to be activated in later iPhones.
        //
        // However, phones on iOS 9 or android, MUST have the this software keyboard
        // scrollup implementation in order to facilitate form fills.
        if ((deviceType == 'iPad' || deviceType == 'iPhone' ))
            if (parseFloat(device.version) >= 10.0)
                return;
        cordova.plugins.Keyboard.disableScroll(true);
        window.addEventListener("native.keyboardshow", keyboard_scroll.keyboardShown);
        window.addEventListener("native.keyboardhide", keyboard_scroll.keyboardHidden);
    }
});

/**
 * @function doubleclick_fix
 * @desc fix doubleckick issue with onsen, where doubleclick can cause double event propagation.
 */
function doubleclick_fix() {
    var ui_elements = ['ons-page', 'ons-list', 'ons-list-item', 'ons-sliding-menu', 'ons-button'];

    jQuery.each(ui_elements, function (i, val) {
        $(val).on('dblclick', function (e) {
            e.preventDefault();
        });
    });
}

/**
 * initial configuration for Onsen waterfall
 * setup httpprovider defaults in order to resolve issues involving api calls
 */
waterfall.config(function ($httpProvider) {
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
});


Element.prototype.documentOffsetTop = function () {
    return this.offsetTop + ( this.offsetParent ? this.offsetParent.documentOffsetTop() : 0 );
};

/**
 * @event ontouchmove
 * if there is touch movement, we may have some elements that we want to disable scrolling for.
 * @param event
 * touch event
 */
document.ontouchmove = function (event) {
    var isTouchMoveAllowed = true, target = event.target;
    while (target !== null) {
        if (target.classList && target.classList.contains('disable-scrolling')) {
            isTouchMoveAllowed = false;
            break;
        }
        target = target.parentNode;
    }
    if (!isTouchMoveAllowed) {
        event.preventDefault();
    }
};

/**
 * custom show hide event for each element.
 * when an element shows itself or hides itself, trigger a custom event.
 */
(function ($) {
    $.each(['show', 'hide'], function (i, ev) {
        var el = $.fn[ev];
        $.fn[ev] = function () {
            this.trigger(ev);
            return el.apply(this, arguments);
        };
    });
})(jQuery);

