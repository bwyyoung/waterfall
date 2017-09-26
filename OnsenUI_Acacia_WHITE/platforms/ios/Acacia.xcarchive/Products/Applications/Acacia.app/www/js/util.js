/**
 * @function toBool
 * convert a string false or true, into a true boolean
 * @param value
 * string value
 * @returns {boolean}
 */
function toBool(value) {
    if ("false" === value)
        return false;
    else
        return true;
}

/**
 * @function scope_apply
 * @desc force refresh view with controller variables that may have changed.
 * normally we dont need this, as there is a regular refresh cycle.
 * however, sometimes we want to immediately refresh a lot of data
 * quickly without delay.
 * @param scope
 * scope of the controller.
 */
function scope_apply(scope) {
    try {
        debug_log('scope apply');
        if (isNull(scope))
            return;
        else if (!scope.$$phase && !scope.$root.$$phase) {
            scope.$apply();
            debug_log("Scope Apply Done !!");
        }
        else {
            setTimeout(function () {
                if (isNull(scope))
                    return;
                scope_apply(scope)
            }, 200);
        }
    }
    catch (err) {
        debug_log(err);
    }

}

/**
 * @function validateEmail
 * @desc validate an email string
 * @param email
 * the email string
 * @returns {boolean}
 * if true, email is valid
 */
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

/**
 * @function isNull
 * @desc check if variable is truly null
 * @param value
 * @returns {boolean}
 */
function isNull(value) {
    if (value === null)
        return true;
    if (value === undefined)
        return true;
    else if (($.isEmptyObject(value)))
        return true;
    return false;
}

/**
 * @function string empty
 * @desc check if str is empty
 * @param str
 * @returns {boolean}
 */
function string_empty(str) {
    if (typeof str == 'undefined' || !str || str.length === 0 || str === "" || !/[^\s]/.test(str) || /^\s*$/.test(str) || str.replace(/\s/g, "") === "") {
        return true;
    }
    else {
        return false;
    }
}

/**
 * @function debug_log
 * @desc console logs should be used through this funciton, as we can turn them off through DEBUG_LOGGING.
 * @param message
 */
function debug_log(message) {
    if (DEBUG_LOGGING)
        console.log("DEBUG_LOG", message);
}

function debug_log(tag, message) {
    if (DEBUG_LOGGING)
        console.log(tag, message);
}


/**
 * @function isMobileDevice
 * @desc are we currently running on desktop or mobile phone?
 * @returns {boolean}
 * if true, we are on an Android/iOS device
 */
function isMobileDevice() {
    return (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/));
}


/**
 * @function executeAsync
 * @desc helper function for setTimeout.
 * @param func
 * the function we wish to call asynchronously.
 */
function executeAsync(func) {
    setTimeout(func, 0);
};


/**
 * @function keycodes_translate_android
 * @desc some android platforms return us platform specific keycodes which are not universal.
 * We need to translate them to the universal keycodes that can be recognised on iOS and desktop.
 * @param e
 * @param value
 * @returns {a.ui.keyCode|{BACKSPACE, COMMA, DELETE, DOWN, END, ENTER, ESCAPE, HOME, LEFT, PAGE_DOWN, PAGE_UP, PERIOD, RIGHT, SPACE, TAB, UP}|*|Number|Object|number}
 */
//for android chrome keycode fix
function keycodes_translate_android(e, value) {
    var kCd = e.keyCode || e.which;
    if (kCd == 0 || kCd == 229)
        kCd = value.charCodeAt(value.length - 1);
    return kCd;
}

function getLocale() {
    if (navigator.languages != undefined)
        return navigator.languages[0];
    else
        return navigator.language;
}
1
/**
 * @function showToast
 * @desc showing a toast text, helper function for android.
 * @param text
 */
function showToast(text) {
    setTimeout(function () {
        if (device.platform != 'windows') {
            window.plugins.toast.showShortBottom(text);
        } else {
            showDialog(text);
        }
    }, 100);
}

/**
 * @function dataURItoBlob
 * @desc convert data uri image data, to blob, for upload to server.
 * @param dataURI
 * @returns {*}
 */
function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type: mimeString});
}