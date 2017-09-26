/**
 * @service network_api
 * @desc this handles all AJAX api calls to the server,
 * both of x-www-form-urlencoded and form-data type calls.
 */
Acacia.service('network_api', function () {
    this.MESSAGE_STATUS_SUCCESS = "000";
    this.MESSAGE_STATUS_OK = "200";
    this.MESSAGE_STATUS_BLOCKED = "300";
    this.MESSAGE_STATUS_FAILED = "400";


    var MESSAGE_KEY_APPLICATIONGROUP;
    this.MESSAGE_KEY_APPLICATIONGROUP = MESSAGE_KEY_APPLICATIONGROUP = "ApplicationGroup";
    this.MESSAGE_KEY_STATUS = "Status";
    this.MESSAGE_KEY_MESSAGE = "Message";

    /**
     * @function ajax_call
     * @desc x-www-form-urlencoded version of ajax call
     * @param url
     * the url to call
     * @param data
     * the json data
     * @param callback
     * the callback function after the ajax call is done, with success and fail states.
     */
    this.ajax_call = function (url, data, callback) {
        var message = {
            "async": true,
            "crossDomain": true,
            "url": url,
            "method": "POST",
            "content-type": "application/x-www-form-urlencoded",
            "data": data,
            "timeout": 20000
        };
        debug_log('ajax_call: ' + JSON.stringify(message));
        $.ajax(message).done(
            function (data, textStatus, jqXHR) {
                debug_log('ajax_call success: ' + JSON.stringify(data));
                callback(true, jqXHR, textStatus, data);
            }
        ).fail(
            function (jqXHR, textStatus, errorThrown) {
                callback(false, jqXHR, textStatus, errorThrown);
            }
        );
    };

    /**
     * @function ajax_call_form_data
     * @desc form-data version of ajax call
     * @param url
     * the url to call
     * @param data
     * the json data
     * @param callback
     * the callback function after the ajax call is done, with success and fail states.
     */
    this.ajax_call_form_data = function (url, data, callback) {
        var message = {
            "async": true,
            "crossDomain": true,
            "processData": false,
            "contentType": false,
            "method": "POST",
            "data": data,
            "timeout": 20000,
            "url": url
        };
        debug_log('ajax_call: ' + JSON.stringify(message));
        $.ajax(message).done(
            function (data, textStatus, jqXHR) {
                debug_log('ajax_call success: ' + JSON.stringify(data));
                callback(true, jqXHR, textStatus, data);
            }
        ).fail(
            function (jqXHR, textStatus, errorThrown) {
                callback(false, jqXHR, textStatus, errorThrown);
            }
        );
    }
});

//allow cors (attempt)
$(document).on("mobileinit", function () {
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
});