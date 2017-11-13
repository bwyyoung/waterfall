// wrap in UMD - see https://github.com/umdjs/umd/blob/master/jqueryPlugin.js

var DEFAULT_CITY = "Please Input City";

(function(factory) {
	if (typeof define === "function" && define.amd) {
		define([ "jquery" ], function($) {
			factory($, window, document);
		});
	} else {
		factory(jQuery, window, document);
	}
})(function($, window, document, undefined) {
	"use strict";
	var pluginName = "citySelect", id = 1, // give each instance its own ID for namespaced event handling
	defaults = {
		initialCity: DEFAULT_CITY,
		// Default city
		defaultCity: DEFAULT_CITY,
		// Position the selected flag inside or outside of the input
		defaultStyling: "inside",
		// Display only these cities
		onlyCities: []
	}, keys = {
		UP: 38,
		DOWN: 40,
		ENTER: 13,
		ESC: 27,
		PLUS: 43,
		A: 65,
		Z: 90
	}, windowLoaded = false;
	// keep track of if the window.load event has fired as impossible to check after the fact
	$(window).load(function() {
		windowLoaded = true;
	});
	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options);
		this._defaults = defaults;
		// event namespace
		this.ns = "." + pluginName + id++;
		this._name = pluginName;
		this.init();
	}
	Plugin.prototype = {
		init: function() {
			// Process all the data: onlyCities, preferredCities, defaultCity etc
			var allow_dropdown = this._processCityData();

			// Generate the markup
			this._generateMarkup();
			// Set the initial state of the input value and the selected flag
			this._setInitialState(allow_dropdown);


			debug_log('init allow dropdown ' + allow_dropdown);
			// Start all of the event listeners: input keyup, selectedFlag click
			if (allow_dropdown)
				this._initListeners();
			// Return this when the auto city is resolved.
			this.autoCityDeferred = new $.Deferred();
			// Get auto city.
			this._initAutoCity();

			return this.autoCityDeferred;
		},
		/********************
		 *  PRIVATE METHODS
		 ********************/
		// prepare all of the city data, including onlyCities, preferredCities and
		// defaultCity options
		_processCityData: function() {
			// set the instances city data objects
			return this._setInstanceCityData();
			// set the preferredCities property
		},
		// process onlyCities array if present
		_setInstanceCityData: function() {
			var that = this;
			debug_log('_setInstanceCityData');
			var city_array = [
				{
					n: DEFAULT_CITY,
					i: DEFAULT_CITY
				}
			];
			if (!isNull(this.options.cities_displayed))
			{
				city_array = [];
				this.options.cities_displayed.sort();
				debug_log('set instance  '  + this.options.cities_displayed.length);
				if (this.options.cities_displayed.length == 0)
					return false;
				for (var i = 0; i < this.options.cities_displayed.length; i++)
				{
					city_array.push(
						{
							n: this.options.cities_displayed[i],
							i: this.options.cities_displayed[i]
						}
					);
				}
			}

			var allCities = $.each(city_array, function(i, c) {
				c.name = c.n;
				c.iso2 = c.i;
				delete c.n;
				delete c.i;
			});
			this.cities = allCities;
			if (isNull(this.options.cities_displayed))
				return false;
			return true;
		},
		// generate all of the markup for the plugin: the selected flag overlay, and the dropdown
		_generateMarkup: function() {
			// City input
			this.cityInput = $(this.element);
			// containers (mostly for positioning)
			var mainClass = "city-select";
			if (this.options.defaultStyling) {
				mainClass += " " + this.options.defaultStyling;
			}
			this.cityInput.wrap($("<div>", {
				"class": mainClass
			}));

			// city list contains: preferred cities, then divider, then all cities
			this.cityList = $("<ul>", {
				"class": "city-list v-hide"
			}).appendTo('.city-select');

			this._appendListItems(this.cities, "");
			// Add the hidden input for the city code
			this.cityCodeInput = $("#"+this.cityInput.attr("id")+"_code");
			if (!this.cityCodeInput) {
				this.cityCodeInput = $('<input type="hidden" id="'+this.cityInput.attr("id")+'_code" name="'+this.cityInput.attr("name")+'_code" value="" />');
				this.cityCodeInput.insertAfter(this.cityInput);
			}
			// now we can grab the dropdown height, and hide it properly
			this.dropdownHeight = this.cityList.outerHeight();
			this.cityList.removeClass("v-hide").addClass("hide");
			// this is useful in lots of places
			this.cityListItems = this.cityList.children(".city");
		},
		// add a city <li> to the cityList <ul> container
		_appendListItems: function(cities, className) {
			// Generate DOM elements as a large temp string, so that there is only
			// one DOM insert event
			var tmp = "";
			// for each city
			$.each(cities, function(i, c) {
				// open the list item
				tmp += '<li class="city ' + className + '" data-city-code="' + c.name + '">';
				// and the city name
				tmp += '<span class="city-name">' + c.name + '</span>';
				// close the list item
				tmp += '</li>';
			});
			this.cityList.append(tmp);
		},
		// set the initial state of the input value and the selected flag
		_setInitialState: function(allow_dropdown) {
			var flagIsSet = false;
			// If the city code input is pre-populated, update the name and the selected flag
			var selectedCode = this.cityCodeInput.val();
			if (selectedCode) {
				this.selectCity(selectedCode);
			}
			this.defaultCity = 'N/A';
			if (allow_dropdown)
				this.defaultCity = DEFAULT_CITY;
		},
		// initialise the main event listeners: input keyup, and click selected flag
		_initListeners: function() {
			var that = this;
			// Update flag on keyup.
			// Use keyup instead of keypress because we want to update on backspace
			// and instead of keydown because the value hasn't updated when that
			// event is fired.
			// NOTE: better to have this one listener all the time instead of
			// starting it on focus and stopping it on blur, because then you've
			// got two listeners (focus and blur)
			this.cityInput.on("keyup" + this.ns, function() {
			});
			// toggle city dropdown on click
			this.cityInput.on("click" + this.ns, function(e) {
				// only intercept this event if we're opening the dropdown
				// else let it bubble up to the top ("click-off-to-close" listener)
				// we cannot just stopPropagation as it may be needed to close another instance
				if (that.cityList.hasClass("hide") && !that.cityInput.prop("disabled")) {
					that._showDropdown();
				}
			});
			// Despite above note, added blur to ensure partially spelled city
			// with correctly chosen flag is spelled out on blur. Also, correctly
			// selects flag when field is autofilled
			this.cityInput.on("blur" + this.ns, function() {
				if (isNull(that.getSelectedCityData()))
					return;
				if (that.cityInput.val() != that.getSelectedCityData().name) {
					that.setCity(that.cityInput.val());
				}
				var output = that.getSelectedCityData().name.replace(/ *\([^)]*\) */g, "").trim();
				that.cityInput.val(output);
			});
		},
		_initAutoCity: function() {
			if (this.options.initialCity === "auto") {
				this._loadAutoCity();
			} else {
				this.selectCity(this.defaultCity);
				this.autoCityDeferred.resolve();
			}
		},
		// perform the geo ip lookup
		_loadAutoCity: function() {
			var that = this;

			// 3 options:
			// 1) already loaded (we're done)
			// 2) not already started loading (start)
			// 3) already started loading (do nothing - just wait for loading callback to fire)
			if ($.fn[pluginName].autoCity) {
				this.handleAutoCity();
			} else if (!$.fn[pluginName].startedLoadingAutoCity) {
				// don't do this twice!
				$.fn[pluginName].startedLoadingAutoCity = true;

				if (typeof this.options.geoIpLookup === 'function') {
					this.options.geoIpLookup(function(cityCode) {
						$.fn[pluginName].autoCity = cityCode;
						// tell all instances the auto city is ready
						// TODO: this should just be the current instances
						// UPDATE: use setTimeout in case their geoIpLookup function calls this callback straight away (e.g. if they have already done the geo ip lookup somewhere else). Using setTimeout means that the current thread of execution will finish before executing this, which allows the plugin to finish initialising.
						setTimeout(function() {
							$(".city-select input").citySelect("handleAutoCity");
						});
					});
				}
			}
		},
		// Focus input and put the cursor at the end
		_focus: function() {
			this.cityInput.focus();
			var input = this.cityInput[0];
			// works for Chrome, FF, Safari, IE9+
			if (input.setSelectionRange) {
				var len = this.cityInput.val().length;
				input.setSelectionRange(len, len);
			}
		},
		// Show the dropdown
		_showDropdown: function() {

			debug_log('showdropdown');

			this._setDropdownPosition();
			// update highlighting and scroll to active list item
			var activeListItem = this.cityList.children(".active");

			this._highlightListItem(activeListItem);
			// show it
			this.cityList.removeClass("hide");

			this._scrollTo(activeListItem);

			// bind all the dropdown-related listeners: mouseover, click, click-off, keydown
			this._bindDropdownListeners();
			//return;
			
		},
		// decide where to position dropdown (depends on position within viewport, and scroll)
		_setDropdownPosition: function() {
			//var inputTop = this.cityInput.offset().top;
			// show the menu and grab the dropdown height

			//solution for forms located under a nav bar, with a sliding menu
			var toolbar_position = $('.navigation-bar').offset().top + $('.navigation-bar').outerHeight();
			var input_position = this.cityInput.offset().top;
			var height = window.innerHeight - toolbar_position;
			debug_log('dropdownposition ' + toolbar_position + '|' + input_position+ '|' + top + '|'  +  height);
			this.cityList.css("top", toolbar_position + 'px');
			this.cityList.css("max-height", height + 'px');
			this.cityList.css("height", height + 'px');
		},
		// we only bind dropdown listeners when the dropdown is open
		_bindDropdownListeners: function() {
			var that = this;
			// when mouse over a list item, just highlight that one
			// we add the class "highlight", so if they hit "enter" we know which one to select
			this.cityList.on("mouseover" + this.ns, ".city", function(e) {
				that._highlightListItem($(this));
			});
			// listen for city selection
			this.cityList.on("click" + this.ns, ".city", function(e) {
				that._selectListItem($(this));
			});
			// click off to close
			// (except when this initial opening click is bubbling up)
			// we cannot just stopPropagation as it may be needed to close another instance
			var isOpening = true;
			$("html").on("click" + this.ns, function(e) {
				if (!isOpening) {
					that._closeDropdown();
				}
				isOpening = false;
			});
			// Listen for up/down scrolling, enter to select, or letters to jump to city name.
			// Use keydown as keypress doesn't fire for non-char keys and we want to catch if they
			// just hit down and hold it to scroll down (no keyup event).
			// Listen on the document because that's where key events are triggered if no input has focus
			$(document).on("keydown" + this.ns, function(e) {
				// prevent down key from scrolling the whole page,
				// and enter key from submitting a form etc
				e.preventDefault();
				if (e.which == keys.UP || e.which == keys.DOWN) {
					// up and down to navigate
					that._handleUpDownKey(e.which);
				} else if (e.which == keys.ENTER) {
					// enter to select
					that._handleEnterKey();
				} else if (e.which == keys.ESC) {
					// esc to close
					that._closeDropdown();
				} else if (e.which >= keys.A && e.which <= keys.Z) {
					// upper case letters (note: keyup/keydown only return upper case letters)
					// cycle through cities beginning with that letter
					that._handleLetterKey(e.which);
				}
			});
		},
		// Highlight the next/prev item in the list (and ensure it is visible)
		_handleUpDownKey: function(key) {
			var current = this.cityList.children(".highlight").first();
			var next = key == keys.UP ? current.prev() : current.next();
			if (next.length) {
				// skip the divider
				if (next.hasClass("divider")) {
					next = key == keys.UP ? next.prev() : next.next();
				}
				this._highlightListItem(next);
				this._scrollTo(next);
			}
		},
		// select the currently highlighted item
		_handleEnterKey: function() {
			var currentCity = this.cityList.children(".highlight").first();
			if (currentCity.length) {
				this._selectListItem(currentCity);
			}
		},
		// Iterate through the cities starting with the given letter
		_handleLetterKey: function(key) {
			var letter = String.fromCharCode(key);
			// filter out the cities beginning with that letter
			var cities = this.cityListItems.filter(function() {
				return $(this).text().charAt(0) == letter && !$(this).hasClass("preferred");
			});
			if (cities.length) {
				// if one is already highlighted, then we want the next one
				var highlightedCity = cities.filter(".highlight").first(), listItem;
				// if the next city in the list also starts with that letter
				if (highlightedCity && highlightedCity.next() && highlightedCity.next().text().charAt(0) == letter) {
					listItem = highlightedCity.next();
				} else {
					listItem = cities.first();
				}
				// update highlighting and scroll
				this._highlightListItem(listItem);
				this._scrollTo(listItem);
			}
		},

		// remove highlighting from other list items and highlight the given item
		_highlightListItem: function(listItem) {
			this.cityListItems.removeClass("highlight");
			listItem.addClass("highlight");
		},
		// find the city data for the given city code
		// the ignoreOnlyCitiesOption is only used during init() while parsing the onlyCities array
		_getCityData: function(cityCode, ignoreOnlyCitiesOption) {
			var cityList = this.cities;
			for (var i = 0; i < cityList.length; i++) {
				if (cityList[i].name == cityCode) {
					return cityList[i];
				}
			}
			return null;
		},
		// called when the user selects a list item from the dropdown
		_selectListItem: function(listItem) {
			// update selected flag and active list item
			var cityCode = listItem.attr("data-city-code");
			this._closeDropdown();
			// update input value
			this._updateName(cityCode);
			this.cityInput.trigger("change");
			this.cityCodeInput.trigger("change");
			// focus the input
			this._focus();
		},
		// close the dropdown and unbind any listeners
		_closeDropdown: function() {
			this.cityList.addClass("hide");
			// unbind event listeners
			$(document).off("keydown" + this.ns);
			$("html").off("click" + this.ns);
			// unbind both hover and click listeners
			this.cityList.off(this.ns);
		},
		// check if an element is visible within its container, else scroll until it is
		_scrollTo: function(element) {
			if (!element || !element.offset()) {
				return;
			}
			var container = this.cityList, containerHeight = container.height(), containerTop = container.offset().top, containerBottom = containerTop + containerHeight, elementHeight = element.outerHeight(), elementTop = element.offset().top, elementBottom = elementTop + elementHeight, newScrollTop = elementTop - containerTop + container.scrollTop();
			if (elementTop < containerTop) {
				// scroll up
				container.scrollTop(newScrollTop);
			} else if (elementBottom > containerBottom) {
				// scroll down
				var heightDifference = containerHeight - elementHeight;
				container.scrollTop(newScrollTop - heightDifference);
			}
		},
		// Replace any existing city name with the new one
		_updateName: function(cityCode) {

			this.cityCodeInput.val(cityCode).trigger("change");
			//remove bracketed text
			debug_log('update name ' + cityCode);
			var output = cityCode;
			if (this._getCityData(cityCode))
				 output = this._getCityData(cityCode).name.replace(/ *\([^)]*\) */g, "").trim();
			this.cityInput.val(output);

		},
		/********************
		 *  PUBLIC METHODS
		 ********************/
		// this is called when the geoip call returns
		handleAutoCity: function() {
			if (this.options.initialCity === "auto") {
				// we must set this even if there is an initial val in the input: in case the initial val is invalid and they delete it - they should see their auto city
				this.defaultCity = $.fn[pluginName].autoCity;
				// if there's no initial value in the input, then update the flag
				if (!this.cityInput.val()) {
					this.selectCity(this.defaultCity);
				}
				this.autoCityDeferred.resolve();
			}
		},
		// get the city data for the currently selected flag
		getSelectedCityData: function() {
			// rely on the fact that we only set 2 classes on the selected flag element:
			// the first is "flag" and the second is the 2-char city code
			return this._getCityData(this.cityInput.val());
		},
		// update the selected flag
		selectCity: function(cityCode) {
			this._updateName(cityCode);
		},
		// set the input value and update the flag
		setCity: function(city)
		{

			this.cityInput.val(city);
			var output = city.replace(/ *\([^)]*\) */g, "").trim();
			debug_log('set city ' + output);
			this.cityInput.val(output);
		},
		// remove plugin
		destroy: function() {
			// stop listeners
			this.cityInput.off(this.ns);
			// remove markup
			var container = this.cityInput.parent();
			container.before(this.cityInput).remove();
		},
		isCityOpen: function() {
			return !this.cityList.hasClass("hide");
		},
		closeDropDown: function ()
		{
			this._closeDropdown();
		}
	};
	// adapted to allow public functions
	// using https://github.com/jquery-boilerplate/jquery-boilerplate/wiki/Extending-jQuery-Boilerplate
	$.fn[pluginName] = function(options) {
		var args = arguments;
		// Is the first parameter an object (options), or was omitted,
		// instantiate a new instance of the plugin.
		if (options === undefined || typeof options === "object") {
			return this.each(function() {
				if (!$.data(this, "plugin_" + pluginName)) {
					$.data(this, "plugin_" + pluginName, new Plugin(this, options));
				}
			});
		} else if (typeof options === "string" && options[0] !== "_" && options !== "init") {
			// If the first parameter is a string and it doesn't start
			// with an underscore or "contains" the `init`-function,
			// treat this as a call to a public method.
			// Cache the method call to make it possible to return a value
			var returns;
			this.each(function() {
				var instance = $.data(this, "plugin_" + pluginName);
				// Tests that there's already a plugin-instance
				// and checks that the requested public method exists
				if (instance instanceof Plugin && typeof instance[options] === "function") {
					// Call the method of our plugin instance,
					// and pass it the supplied arguments.
					returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
				}
				// Allow instances to be destroyed via the 'destroy' method
				if (options === "destroy") {
					$.data(this, "plugin_" + pluginName, null);
				}
			});
			// If the earlier cached method gives a value back return the value,
			// otherwise return this to preserve chainability.
			return returns !== undefined ? returns : this;
		}
	};
	/********************
   *  STATIC METHODS
   ********************/
	// get the city data object
	$.fn[pluginName].getCityData = function() {
		return allCities;
	};
	// set the city data object
	$.fn[pluginName].setCityData = function(obj) {
		allCities = obj;
	};
	// Tell JSHint to ignore this warning: "character may get silently deleted by one or more browsers"
	// jshint -W100
	// Array of city objects for the flag dropdown.
	// Each contains a name and city code (ISO 3166-1 alpha-2).
	//
	// Note: using single char property names to keep filesize down
	// n = name
	// i = iso2 (2-char city code)
	var allCities = $.each([
		{
			n: DEFAULT_CITY,
			i: DEFAULT_CITY
	}
	], function(i, c) {
		c.name = c.n;
		c.iso2 = c.i;
		delete c.n;
		delete c.i;
	});
});
