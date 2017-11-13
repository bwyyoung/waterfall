Acacia.service('network_api', function()
{
    this.MESSAGE_STATUS_SUCCESS = "000";
    this.MESSAGE_STATUS_OK = "200";
    this.MESSAGE_STATUS_BLOCKED = "300";
    this.MESSAGE_STATUS_FAILED = "400";


    var MESSAGE_KEY_APPLICATIONGROUP;
    this.MESSAGE_KEY_APPLICATIONGROUP =  MESSAGE_KEY_APPLICATIONGROUP  = "ApplicationGroup";
    this.MESSAGE_KEY_STATUS = "Status";
    this.MESSAGE_KEY_MESSAGE = "Message";

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
        debug_log('ajax_call: '+ JSON.stringify(message));
        $.ajax(message).done(
            function (data, textStatus, jqXHR)
            {
                debug_log('ajax_call success: ' + JSON.stringify(data));
                callback(true, jqXHR, textStatus, data);
            }
        ).fail(
            function  ( jqXHR, textStatus, errorThrown)
            {
                callback(false, jqXHR, textStatus, errorThrown);
            }
        );
        }
    }
);

$( document ).on( "mobileinit", function()
{
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
});
