

var waterfall = ons.bootstrap('waterfall_Marketplace' ,
    ['onsen' ,'ngCordova']);


waterfall.directive('bindHtmlUnsafe', function( $compile ) {
    return function( $scope, $element, $attrs ) {

        var compile = function( newHTML ) { // Create re-useable compile function
            newHTML = $compile(newHTML)($scope); // Compile html
            $element.html('').append(newHTML); // Clear and append it
        };

        var htmlName = $attrs.bindHtmlUnsafe; // Get the name of the variable
                                              // Where the HTML is stored

        $scope.$watch(htmlName, function( newHTML ) { // Watch for changes to
            // the HTML
            if(!newHTML) return;
            compile(newHTML);   // Compile it
        });

    };
});

waterfall.directive('scrollTrigger', function($window) {
    return {
        link : function(scope, element, attrs) {
            var offset = parseInt(attrs.threshold) || 0;
            var e = jQuery(element[0]);
            var doc = jQuery(document);
            angular.element(document).bind('scroll', function() {
                if (doc.scrollTop() + $window.innerHeight + offset > e.offset().top) {
                    scope.$apply(attrs.scrollTrigger);
                }
            });
        }
    };
});

var ui_elements = ['ons-page','ons-list','ons-list-item', 'ons-sliding-menu', 'ons-button' ];

function calculateHeight()
{
	$('ons-list').height(window.innerHeight);
}

ons.ready(function() {

    doubleclick_fix();
    if (isMobileDevice())
    {
        
        cordova.plugins.Keyboard.disableScroll(true);
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        window.addEventListener("native.keyboardshow", keyboard_scroll.keyboardShown);
        window.addEventListener("native.keyboardhide", keyboard_scroll.keyboardHidden);
        //show 'done' button with html SELECT elements.

    }
});

function doubleclick_fix()
{
    jQuery.each(ui_elements, function(i, val )
    {
        $(val).on('dblclick', function(e)
        {
            e.preventDefault();
        });
    });
}



waterfall.config(function ($httpProvider) {
    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
});


Element.prototype.documentOffsetTop = function () {
    return this.offsetTop + ( this.offsetParent ? this.offsetParent.documentOffsetTop() : 0 );
};

function removeIOSRubberEffect( element ) {

    element.addEventListener( "touchstart", function () {

        var top = element.scrollTop, totalScroll = element.scrollHeight, currentScroll = top + element.offsetHeight;

        if ( top === 0 ) {
            element.scrollTop = 1;
        } else if ( currentScroll === totalScroll ) {
            element.scrollTop = top - 1;
        }

    } );

}

document.ontouchmove = function ( event ) {

    var isTouchMoveAllowed = true, target = event.target;

    while ( target !== null ) {
        if ( target.classList && target.classList.contains( 'disable-scrolling' ) ) {
            isTouchMoveAllowed = false;
            break;
        }
        target = target.parentNode;
    }

    if ( !isTouchMoveAllowed ) {
        event.preventDefault();
    }

};

//removeIOSRubberEffect( document.querySelector( ".scrollable" ) );