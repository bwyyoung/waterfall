//adapted and modified from https://github.com/kerrishotts/cordova-keyboard-example

var keyboard_scroll = {

     useSmoothScrolling : true,
     smoothScrollDuration : 250,

     getScrollContainers : function() {
        // return all elements that have scrollable regions. For your app this might
        // be very different depending on what you have present on the screen and
        // how your app is structured.
        return [].slice.call(document.querySelectorAll("[is='y-scroll-container']"), 0);
    }
,
     handleTextSelection: function(focusedElement) {
        setTimeout(function () {
            var selStart, selEnd
            var valid = (/text|password|search|tel|url/).test(focusedElement.type);
            if (valid) {
                selStart = focusedElement.selectionStart;
                selEnd = focusedElement.selectionEnd;
                focusedElement.selectionStart = 0;
                focusedElement.selectionEnd = 0;
            }

            setTimeout(function () {
                if (valid) {
                    focusedElement.selectionStart = selStart;
                    focusedElement.selectionEnd = selEnd;
                }
            }, 33);

        }, 0);
    }
    ,
    // Fix: failed to read the 'selectionStart' property from 'HTMLInputElement'
// The @fn parameter provides a callback to execute additional code
     _fixSelection: function(dom, fn) {
    var validType = (/text|password|search|tel|url/).test(dom.type),
        selection = {
            start: validType ? dom.selectionStart : 0,
            end: validType ? dom.selectionEnd : 0
        };
    if (validType && fn instanceof Function) fn(dom);
    return selection;
}

,
     keyboardHidden: function() {
        // whenever the keyboard is hidden, we need to return all the scroll
        // containers that we modified to their appropriate heights
         var screenHeight = window.screen.height;
         debug_log('keyboardShown ' + screenHeight);

         $(document).trigger(EVENT_KEYBOARD_DOWN);

         setTimeout(function () {
            var scrollContainers = keyboard_scroll.getScrollContainers();
            // setting max-height to blank will allow the element to size
            // based on the original CSS values
            scrollContainers.forEach(function (sc) {
                sc.style.maxHeight = "";
            });
        }, 0);
    }

// keyboardShown event handler
//
// Called when the keyboard is shown.
// The height of the keyboard is in e.keyboardHeight
     ,
    keyboardShown: function(e) {
        
        setTimeout(function () {
            var screenHeight = window.screen.height,
                scrollContainers = keyboard_scroll.getScrollContainers();
            // for each scroll container in the DOM, we need to calculate the
            // the height it should be to fit in the reduced view
            debug_log('keyboardShown ' + screenHeight);
            $(document).trigger(EVENT_KEYBOARD_UP, [e.keyboardHeight]);

            scrollContainers.forEach(function (sc) {
                debug_log('found scroll container');
                var scTop = sc.getBoundingClientRect().top;
                // now that we know the top of the scroll container, the height of the
                // the screen, and the height of the keyboard, we can calculate the
                // appropriate max-height for the container.
                sc.style.maxHeight = "" + (screenHeight - e.keyboardHeight - scTop) + "px";
            });
            // changing the height isn't sufficient: we need to scroll any focused
            // element into view.
            setTimeout(function () {
                var focusedElement = document.querySelector(":focus");
                if (focusedElement) {
                    if (!keyboard_scroll.useSmoothScrolling || !window.requestAnimationFrame) {
                        debug_log('keyboardShown option 1 ' +  window.requestAnimationFrame + "|" + keyboard_scroll.useSmoothScrolling);
                        // scroll the element into view, but only if we have to
                        if (focusedElement.scrollIntoViewIfNeeded) {
                            focusedElement.scrollIntoViewIfNeeded();
                        } else {
                            // aim for the bottom of the viewport
                            focusedElement.scrollIntoView(false);
                        }
                        // iOS doesn't always position the cursor correctly after
                        // a scroll operation. Clear the selection so that iOS is
                        // forced to recompute where the cursor should appear.
                        keyboard_scroll.handleTextSelection(focusedElement);
                    } else
                    {
                        debug_log('keyboardShown option 2');

                        // to scroll the element smoothly into view, things become a little
                        // more difficult.
                        var fElTop = focusedElement.getBoundingClientRect().top,
                            sc = focusedElement, scTop, scBottom;
                        // find the containing scroll container if we can
                        while (sc && !sc.matches("[is='y-scroll-container']")) {
                            sc = sc.parentElement;
                        }
                        if (sc) {
                            debug_log('sc');
                            scTop = sc.getBoundingClientRect().top;
                            scBottom = sc.getBoundingClientRect().bottom;
                            if (fElTop < scTop || fElTop > (((scBottom - scTop) / 2) + scTop)) {
                                // the element isn't above the keyboard (or is too far above),
                                // scroll it into view smoothly
                                debug_log('the element isnt above the keyboard (or is too far above),scroll it into view smoothly');

                                var targetTop = ((scBottom - scTop) / 2) + scTop,
                                    deltaTop = fElTop - targetTop,
                                    origScrollTop = sc.scrollTop,
                                    startTimestamp = null;
                                // animate our scroll
                                window.requestAnimationFrame(function scrollStep(timestamp) {
                                    if (!startTimestamp) {
                                        startTimestamp = timestamp;
                                    }
                                    var progressDelta = timestamp - startTimestamp,
                                        pct = progressDelta / keyboard_scroll.smoothScrollDuration;
                                    sc.scrollTop = origScrollTop + (deltaTop * pct);
                                    if (progressDelta < keyboard_scroll.smoothScrollDuration) {
                                        window.requestAnimationFrame(scrollStep);
                                    } else {
                                        // set the scroll to the final desired position, just in case
                                        // we didn't actually get there (or overshot)
                                        sc.scrollTop = origScrollTop + deltaTop;
                                        keyboard_scroll.handleTextSelection(focusedElement);
                                    }
                                });
                            }
                        }
                    }
                }
            }, 0);
        }, 0);
    }
};