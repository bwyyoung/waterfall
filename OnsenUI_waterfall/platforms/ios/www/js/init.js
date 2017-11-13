/**
 * Created by bwyyoung on 22/6/16.
 */

function onLoad()
{
    debug_log('onLoad');
    if (isMobileDevice())
	    document.addEventListener("deviceready", onDeviceReady, false);
    /* We are using a web browser, and debugging,
     so lets simulate the same behaviour as a mobile device.*/
    else if (!isMobileDevice() && DEBUG_NETWORK)
    {
        debug_log('SIMULATING ONDEVICEREADY');
        onDeviceReady();
    }
}

function import_javascript_file(thefile)
{
    var imported = document.createElement('script');
    imported.src = thefile;
    document.head.appendChild(imported);
}


if ('addEventListener' in document) {
	document.addEventListener('DOMContentLoaded', function() {
		FastClick.attach(document.body);
	}, false);
}


/*document.addEventListener('focusout', function(e) {window.scrollTo(0, 0)});
if(/Android 4\.[0-3]/.test(navigator.appVersion)){
	window.addEventListener("resize", function(){
		if(document.activeElement.tagName=="INPUT"){
			window.setTimeout(function(){
				document.activeElement.scrollIntoViewIfNeeded();
			},0);
		}
	})
}*/




window.onerror = function (msg, file, line)
{
    if (DEBUG_ERROR)
        alert("Error: " + msg + "\n File: " + file + "\n Line: " + line);
}

function init_LocalStorage()
{
	//If this first variable is not set, we setup the rest.
	if (window.localStorage[USER_LOGGED_IN])
	{
		 window.localStorage.setItem(USER_LOGGED_IN, false);
	}
	debug_log ('init local storage '  + window.localStorage.getItem(USER_LOGGED_IN));


}

function onDeviceReady() 
{
	debug_log('Device Ready!');
	if (isMobileDevice())
	{
		if (true)
			debug_log('Cordova: Device is Ready!');
		else
			navigator.notification.alert(
		    'Cordova: Device is Ready!'
		);
		var is_ios = ((navigator.userAgent.match(/iPad/i))  == "iPad" )|| ((navigator.userAgent.match(/iPhone/i))  == "iPhone");
		if(is_ios && navigator && navigator.splashscreen)
			navigator.splashscreen.hide();
	}
	else
		debug_log('Browser: Device is ready');
	init_LocalStorage();
	document.addEventListener("backbutton", onBackButton, false );
}


function check_crosswalk()
{
	if (window.indexedDB)
		debug_log('USING crosswalk');
	else
		debug_log('ALERT','NOT USING crosswalk/wkwebview');
}


//master handler for back button in Marketplace. For Android
function onBackButton(event)
{
	if (event)
	{
		try {
			event.preventDefault();
			event.stopPropagation();
			debug_log('onBackButton e.preventDefault();');
			//custom backbutton event listener
			$(document).trigger(EVENT_BACKBUTTON);
		}
		catch(error)
		{
			debug_log(error);
		}
	}
	//later on, experiment with   window.history.back(); navigator.app.exitApp();
}


