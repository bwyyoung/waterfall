/*!
 * Suggest jQuery plugin
 *
 * Copyright (c) 2015 Florian Plank (http://www.polarblau.com/)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * USAGE:
 *
 * $('#container').suggest(haystack, {
 *   suggestionColor   : '#cccccc',
 *   moreIndicatorClass: 'suggest-more',
 *   moreIndicatorText : '&hellip;'
 * });
 *
 */

(function ($) {

    $.fn.suggest = function (source, options) {

        var settings = $.extend({
            suggestionColor: '#ccc',
            moreIndicatorClass: 'suggest-more',
            moreIndicatorText: '&hellip;'
        }, options);

        return this.each(function () {

            $this = $(this);

            // this helper will show possible suggestions
            // and needs to match the input field in style
            var $suggest = $('<div/>', {
                'css': {
                    'white-space': 'nowrap',
                    'top': '13px',
                    'left': '45px',
                    'position': 'absolute',
                    'margin': $this.cssShortForAllSides('margin'),
                    'fontFamily': $this.css('fontFamily'),
                    'fontSize': '15px',
                    'lineHeight': '20px',
                    'fontWeight': 'bold',
                    'color': settings.suggestionColor
                }
            });
            var $isBlurred = true;

            var $more = $('<span/>', {
                'css': {
                    'position': 'absolute',
                    'top': $suggest.height() + parseInt($this.css('fontSize'), 10) / 2,
                    'right': '0px',
                    'display': 'block',
                    'fontSize': $this.css('fontSize'),
                    'fontFamily': $this.css('fontFamily'),
                    'color': settings.suggestionColor
                },
                'class': settings.moreIndicatorClass
            })
                .html(settings.moreIndicatorText)
                .hide();

            $this
                .attr({
                    'autocomplete': "off",
                    'spellcheck': "false",
                    'dir': "ltr"
                })
                // by setting the background to transparent, we will
                // be able to "see through" to the suggestion helper
                .css({
                    'background': 'transparent'
                })
                .wrap($('<div/>', {
                    'css': {
                        'position': 'relative',
                    }
                }))

                .bind('keydown.suggest', function (e) {
                    $isBlurred = false;
                    var code = (e.keyCode ? e.keyCode : e.which);

                    // the tab key will force the focus to the next input
                    // already on keydown, let's prevent that
                    // unless the alt key is pressed for convenience
                    if (code == 9 && !e.altKey) {
                        e.preventDefault();

                        // let's prevent default enter behavior while a suggestion
                        // is being accepted (e.g. while submitting a form)
                    } else if (code == 13) {
                        if (!$suggest.is(':empty')) {
                            e.preventDefault();
                        }

                        // use arrow keys to cycle through suggestions
                    } else if (code == 38 || code == 40) {
                        e.preventDefault();
                        var suggestions = $(this).data('suggestions');

                        if (suggestions.all.length > 1) {
                            // arrow down:
                            if (code == 40 && suggestions.index < suggestions.all.length - 1) {
                                suggestions.suggest.html(suggestions.all[++suggestions.index]);
                                // arrow up:
                            } else if (code == 38 && suggestions.index > 0) {
                                suggestions.suggest.html(suggestions.all[--suggestions.index]);
                            }
                            $(this).data('suggestions').index = suggestions.index;
                        }
                    }
                })

                .bind('keyup.suggest', function (e) {
                    var code = (e.keyCode ? e.keyCode : e.which);

                    // Have the arrow keys been pressed?
                    if (code == 38 || code == 40) {
                        return false;
                    }

                    // be default we hide the "more suggestions" indicator
                    $more.hide();

                    // what has been input?
                    var needle = $(this).val();

                    // convert spaces to make them visible
                    var needleWithWhiteSpace = needle.replace(' ', '&nbsp;');

                    // accept suggestion with 'enter' or 'tab'
                    // if the suggestion hasn't been accepted yet
                    if (code == 9 || code == 13) {

                        // only accept if there's anything suggested
                        if ($suggest.text().length > 0) {
                            e.preventDefault();
                            var suggestions = $(this).data('suggestions');
                            $(this).val(suggestions.terms[suggestions.index]);
                            debug_log('setting suggestion on enter ' + suggestions.terms[suggestions.index]);
                            // clean the suggestion for the looks
                            $suggest.empty();
                            $(this).trigger('change');
                            $this.trigger('change');
                            $(this).blur();
                            $this.isBlurred = true;
                            return false;
                        }
                    }

                    // make sure the helper is empty
                    $suggest.empty();

                    // if nothing has been input, leave it with that
                    if (!$.trim(needle).length) {
                        return false;
                    }

                    // see if anything in source matches the input
                    // by escaping the input' string for use with regex
                    // we allow to search for terms containing specials chars as well
                    var regex = new RegExp('^' + needle.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
                    var suggestions = [], terms = [];
                    for (var i = 0, l = source; i < l.length; i++) {
                        if (regex.test(l[i])) {
                            terms.push(l[i]);
                            suggestions.push(needleWithWhiteSpace + l[i].slice(needle.length));
                        }
                    }
                    if (suggestions.length > 0) {
                        // if there's any suggestions found, use the first
                        // don't show the suggestion if it's identical with the current input
                        if (suggestions[0] !== needle) {
                            $suggest.html(suggestions[0]);
                        }
                        // store found suggestions in data for use with arrow keys
                        $(this).data('suggestions', {
                            'all': suggestions,
                            'terms': terms,
                            'index': 0,
                            'suggest': $suggest
                        });

                        // show the indicator that there's more suggestions available
                        // only for more than one suggestion
                        if (suggestions.length > 1) {
                            $more.show();
                        }
                    }
                }).bind('click', function (e) {
                debug_log('click ' + $suggest.text().length + ' ' + $isBlurred);
                if ($suggest.text().length > 0 && !$isBlurred) {
                    e.preventDefault();
                    var suggestions = $(this).data('suggestions');
                    $(this).val(suggestions.terms[suggestions.index]);
                    debug_log('setting suggestion on click ' + suggestions.terms[suggestions.index]);
                    // clean the suggestion for the looks
                    $suggest.empty();
                    $(this).trigger('change');
                    $this.trigger('change');
                    $(this).blur();
                    $isBlurred = true;
                    return false;
                }
                if ($isBlurred) {
                    $(this).val('');
                    $isBlurred = false;
                }

            })
            // clear suggestion on blur
                .bind('blur.suggest', function () {
                    //var suggestions = $(this).data('suggestions');
                    //debug_log('blur suggest ' + $suggest.text().length + '|' + suggestions.index);
                    debug_log('blur suggest');
                    $(this).trigger('change');
                    $this.trigger('change');
                    $isBlurred = true;
                    $suggest.empty();
                });

            // insert the suggestion helpers within the wrapper
            $suggest.insertAfter($this);
            $more.insertAfter($suggest);

        });

    };

    /* A little helper to calculate the sum of different
     * CSS properties around all four sides
     *
     * EXAMPLE:
     * $('#my-div').cssSum('padding');
     */
    $.fn.cssShortForAllSides = function (property) {
        var $self = $(this), sum = [];
        var properties = $.map(['Top', 'Right', 'Bottom', 'Left'], function (side) {
            return property + side;
        });
        $.each(properties, function (i, e) {
            sum.push($self.css(e) || "0");
        });
        return sum.join(' ');
    };
})(jQuery);
