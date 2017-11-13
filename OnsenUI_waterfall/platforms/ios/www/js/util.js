
function toBool(value)
{
    if ("false" === value)
        return false;
    else
        return true;
}

function scope_apply(scope)
{
    try
    {
        debug_log('scope apply');
        if (isNull(scope))
            return;
        else if (!scope.$$phase && !scope.$root.$$phase) {
            scope.$apply();
            debug_log("Scope Apply Done !!");
        }
        else {
            setTimeout(function() {
                if (isNull(scope))
                    return;
                scope_apply(scope)
            }, 200);
        }
    }
    catch(err)
    {
        debug_log(err);
    }

}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function isNull(value)
{
    if (value === null)
        return true;
    if (value === undefined)
        return true;
    else if (($.isEmptyObject(value)))
        return true;
    return false;
}

function string_empty(str)
{
    if (typeof str == 'undefined' || !str || str.length === 0 || str === "" || !/[^\s]/.test(str) || /^\s*$/.test(str) || str.replace(/\s/g,"") === "")
    {
        return true;
    }
    else
    {
        return false;
    }
}

function debug_log(message)
{
    if (DEBUG_LOGGING)
        console.log("DEBUG_LOG",message);
}

function debug_log(tag, message) {
    if (DEBUG_LOGGING)
        console.log(tag, message);
}



function isMobileDevice() {
    return (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/));
}


function list_events()
{
    var ev = '',
        out = [];
    for (ev in window) {
        if (/^on/.test(ev)) {
            out[out.length] = ev;
        }
    }
    debug_log(out.join(', '));
}

function executeAsync(func)
{
    setTimeout(func, 0);
}

function test_ajax()
{
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "http://192.168.100.9/NuwaterfallWebAPI/api/waterfallUser/Login",
        "method": "POST",
        "content-type": "application/x-www-form-urlencoded",
        "data": {
            "Username": "KCHENNYL@hotmail.com",
            "Password": "123456"
        }
    }
    debug_log('test_ajax: ' + JSON.stringify(settings));

    $.ajax(settings).done(function (response) {
        console.log(response);
    });
}

//for android chrome keycode fix
function keycodes_translate_android(e, value)
{
    var kCd = e.keyCode || e.which;
    if (kCd == 0 || kCd == 229)
        kCd = value.charCodeAt(value.length - 1) ;
    return kCd;
}

function getLocale()
{
    if (navigator.languages != undefined)
        return navigator.languages[0];
    else
        return navigator.language;
}