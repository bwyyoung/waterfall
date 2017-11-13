/**
 * Created by bwyyoung on 22/6/16.
 */

/**
 * @function onLoad
 * @desc
 */
function onLoad() {
    debug_log('onLoad');
    if (isMobileDevice())
        document.addEventListener("deviceready", onDeviceReady, false);
    /* We are using a web browser, and debugging,
     so lets simulate the same behaviour as a mobile device.*/
    else if (!isMobileDevice() && DEBUG_NETWORK) {
        onDeviceReady();
    }
}

function import_javascript_file(thefile) {
    var imported = document.createElement('script');
    imported.src = thefile;
    document.head.appendChild(imported);
}


if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function () {
        FastClick.attach(document.body);
    }, false);
}

/**
 * @function onerror
 * @desc custom callback function for UNHANDLED EXCEPTIONS in cordova,
 * and our app. We show an alert dialog highlighting the error.
 * Once that dialog is dismissed, the app can go on running as usual.
 * This can be disabled in RELEASE by setting DEBUG_ERROR to false.
 * @param msg
 * the string error message
 * @param file
 * the file the error came from
 * @param line
 * the line of code in the file the error came from
 */
window.onerror = function (msg, file, line) {
    if (DEBUG_ERROR)
        alert("Error: " + msg + "\n File: " + file + "\n Line: " + line);
};

function init_LocalStorage() {
    //If this first variable is not set, we setup the rest.
    if (window.localStorage[USER_LOGGED_IN]) {
        window.localStorage.setItem(USER_LOGGED_IN, false);
    }
    debug_log('init local storage ' + window.localStorage.getItem(USER_LOGGED_IN));
}

/**
 * @function onDeviceReady
 * @desc call function when device ready event is triggered.
 * - hide splashscreen
 * - event listener for backbutton
 * - get sim info
 */
function onDeviceReady() {
    if (isMobileDevice()) {
        if (true)
            debug_log('Cordova: Device is Ready!');
        else
            navigator.notification.alert(
                'Cordova: Device is Ready!'
            );
        var is_ios = ((navigator.userAgent.match(/iPad/i)) == "iPad" ) || ((navigator.userAgent.match(/iPhone/i)) == "iPhone");
        if (is_ios && navigator && navigator.splashscreen)
            navigator.splashscreen.hide();
    }
    else
        debug_log('Browser: Device is ready');
    init_LocalStorage();
    document.addEventListener("backbutton", onBackButton, false);
    if (!isNull(window.plugins))
        window.plugins.sim.getSimInfo(siminfo_successCallback, siminfo_errorCallback);
}

/**
 * @function siminfo_successCallback
 * @desc on success retrieval of sim info, store it in variable.
 * @param result
 */
function siminfo_successCallback(result) {
    debug_log('sim_info: ' + JSON.stringify(result));
    SIM_INFO = result;
};

function siminfo_errorCallback(error) {
    debug_log(error);
};

/**
 * @function check_crosswalk
 * @desc check if we are using a WKWebView
 */
function check_crosswalk() {
    if (window.indexedDB)
        debug_log('USING crosswalk');
    else
        debug_log('ALERT', 'NOT USING crosswalk/wkwebview');
}


/**
 * @function onBackButton
 * @desc
 * master handler for back button in Marketplace. For Android
 * trigger a custom event EVENT_BACKBUTTON, to be handled by respective controllers.
 */
function onBackButton(event) {
    if (event) {
        try {
            event.preventDefault();
            event.stopPropagation();
            debug_log('onBackButton e.preventDefault();');
            //custom backbutton event listener
            $(document).trigger(EVENT_BACKBUTTON);
        }
        catch (error) {
            debug_log(error);
        }
    }
}



