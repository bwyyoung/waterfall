/**
 * @service network_upload_file
 * @desc service that manages uploading of files
 * for now, it only uploads the profile photo when you are editing your profile, and changing your profile photo.
 */
Acacia.service('network_upload_file',
    ['$timeout', 'network_api', 'service_alert', 'user_credentials', 'network_message_registration', 'network_inbox',
        function ($timeout, network_api, service_alert, user_credentials) {

            this.URL_UPLOAD_FILE = DEFAULT_SERVER_IP + '/NuAcaciaWebAPI/api/Acacia/UploadFile';
            this.MESSAGE_KEY_UPLOAD_FILE = 'UploadFile';
            this.MESSAGE_KEY_FILE_TYPE = 'UploadType';
            this.FILE_TYPE_PROFILE_PHOTO = "PROFILE_PHOTO";

            var that = this;
            var alert_loading_dialog;


            this.message_upload_photo = function (thephoto_base64_data, thephoto_name, callback, runbackground) {
                if (!runbackground)
                    service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function (dialog) {
                        run_upload(dialog);
                    });
                else
                    run_upload();
                function run_upload(dialog) {
                    if (!runbackground) {
                        service_alert.alert_message = "Uploading Photo..";
                        alert_loading_dialog = dialog;
                    }

                    var m_form_data = new FormData();
                    var blob = dataURItoBlob(thephoto_base64_data);
                    blob.lastModifiedDate = new Date();
                    blob.name = thephoto_name;
                    var file = new File([blob], thephoto_name);

                    m_form_data.append(that.MESSAGE_KEY_UPLOAD_FILE, blob, thephoto_name);
                    m_form_data.append(that.MESSAGE_KEY_FILE_TYPE, that.FILE_TYPE_PROFILE_PHOTO);
                    m_form_data.append(user_credentials.MESSAGE_KEY_INVESTOR_ID, user_credentials.id);

                    if (!("FormData" in window)) {
                        debug_log('FormData is not supported; degrade gracefully/ alert the user as appropiate');
                    }

                    network_api.ajax_call_form_data(that.URL_UPLOAD_FILE, m_form_data, check_response);
                }

                function check_response(success) {
                    if (!runbackground)
                        alert_loading_dialog.hide();
                    if (success && arguments[3][network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {
                        var response = arguments[3];

                        return callback(true, response);
                    }
                    callback(false);
                }


            };
        }
    ]
);
