/**
 * @service user_credentials
 * @desc this service stores user credentials, and shares it with different controllers
 * that need these credentials.
 */
Acacia.service('user_credentials', [function () {
    this.MESSAGE_KEY_TOKEN = "Token";
    this.MESSAGE_KEY_INVESTOR_ID = "InvestorId";
    this.MESSAGE_KEY_INVESTOR_NAME = "InvestorName";
    this.MESSAGE_KEY_INVESTOR_EMAIL = "InvestorEmail";
    this.MESSAGE_KEY_INVESTOR_MOBILE = "InvestorMobile";
    this.MESSAGE_KEY_INVESTOR_DOB = "InvestorDOB";
    this.MESSAGE_KEY_CREDIT_CURRENCY = "CreditCurrency";
    this.MESSAGE_KEY_CREDIT_BALANCE = "CreditBalance";
    this.MESSAGE_KEY_PROFILE_PHOTO_URL = 'ProfilePhotoURL';


    this.debug_username = 'JohnSmith@debuguser.com';
    this.debug_name = 'John Smith';
    this.debug_level = 1;
    this.debug_profile_image = "css/custom_images/icons/debug_userpic.png";
    this.debug_phone_number = '+0123456789';
    this.debug_email = 'johnsmith@debuguser.com';
    this.debug_dob = '24/1/1984';
    this.debug_credit = 0;

    this.guest_username = this.debug_username;
    this.guest_name = 'Guest';
    this.guest_level = 0;
    this.guest_credit = 0;
    this.guest_currency = DEFAULT_CURRENCY;
    this.guest_profile_image = 'css/custom_images/icons/@guestpic@3x.png';

    this.username = this.debug_username;
    this.name = this.guest_name;
    this.level = this.guest_level;
    this.credit = this.guest_credit;
    this.currency = this.guest_currency;
    this.profile_image = this.guest_profile_image;
    this.captured_image_base64_data = null;
    this.email = this.debug_email;
    this.phone_number = this.debug_phone_number;
    this.dob = this.debug_dob;
    this.token = '';
    this.id = '-1';

    this.address_object = null;

    this.setup_user_debug = function () {
        this.profile_image = this.debug_profile_image;
        this.username = this.debug_username;
        this.level = this.debug_level;
        this.credit = this.debug_credit;
        this.email = this.debug_email;
        this.phone_number = this.debug_phone_number;
        this.dob = this.debug_dob;
    };
    var that = this;

    /**
     * @function setup_user
     * @desc setup the user before logging in
     * @param username
     * @param password
     * @param response
     * get extra data from the server response/database saved data before logging in
     */
    this.setup_user = function (username, password, response) {
        //TODO: TEMP SETUP USER DEBUG, because we need:
        // profile image, level, credit, phone number, dob
        if (DEBUG_USER)
            this.setup_user_debug();
        this.username = username;
        this.email = username;

        if (!isNull(response)) {
            debug_log('setup user ' + JSON.stringify(response));
            this.id = response[this.MESSAGE_KEY_INVESTOR_ID];
            this.username = response[this.MESSAGE_KEY_INVESTOR_EMAIL];
            this.email = response[this.MESSAGE_KEY_INVESTOR_EMAIL];
            this.name = response[this.MESSAGE_KEY_INVESTOR_NAME];
            this.phone_number = response[this.MESSAGE_KEY_INVESTOR_MOBILE];
            this.dob = new Date(response[this.MESSAGE_KEY_INVESTOR_DOB]);
            if (isNaN(this.dob.getTime()))
                this.dob = response[this.MESSAGE_KEY_INVESTOR_DOB];
            else
                this.dob = ('0' + this.dob.getDate()).slice(-2) + '/' +
                    ('0' + (this.dob.getMonth() + 1)).slice(-2)
                    + '/' + this.dob.getFullYear();
            this.token = response[this.MESSAGE_KEY_TOKEN];
            this.credit = response[this.MESSAGE_KEY_CREDIT_BALANCE];
            this.currency = response[this.MESSAGE_KEY_CREDIT_CURRENCY];
            this.profile_image = response[this.MESSAGE_KEY_PROFILE_PHOTO_URL];

            if (isNull(this.currency))
                this.currency = this.guest_currency;
            DEFAULT_CURRENCY = this.currency;
            DEFAULT_CURRENCY_NUMBER_FORMAT = new Intl.NumberFormat(
                [DEFAULT_LOCALE],
                {
                    style: "currency",
                    currency: DEFAULT_CURRENCY,
                    currencyDisplay: "symbol",
                    maximumFractionDigits: 2
                }
            );

            DEFAULT_CURRENCY_NUMBER_FORMAT_WHOLE = new Intl.NumberFormat(
                [DEFAULT_LOCALE],
                {
                    style: "currency",
                    currency: DEFAULT_CURRENCY,
                    currencyDisplay: "symbol",
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0
                }
            );
            scope_apply(scope_slidemenu_left);
        }
    };

    /**
     * @function generate_user_object
     * @desc generate an object containing user credentials, and return it.
     * @returns {user_credentials_object}
     */
    this.generate_user_object = function () {
        var current_user = {};
        current_user[this.MESSAGE_KEY_TOKEN] = this.token;
        current_user[this.MESSAGE_KEY_INVESTOR_ID] = this.id;
        current_user[this.MESSAGE_KEY_INVESTOR_NAME] = this.name;
        current_user[this.MESSAGE_KEY_INVESTOR_EMAIL] = this.username;
        current_user[this.MESSAGE_KEY_INVESTOR_MOBILE] = this.phone_number;
        current_user[this.MESSAGE_KEY_INVESTOR_DOB] = this.dob;
        current_user[this.MESSAGE_KEY_CREDIT_CURRENCY] = this.currency;
        current_user[this.MESSAGE_KEY_CREDIT_BALANCE] = this.credit;
        current_user[this.MESSAGE_KEY_PROFILE_PHOTO_URL] = this.profile_image;
        return current_user;
    };

    /**
     * @function logout
     * @desc log out, and reset user credentials to that of guest.
     */
    this.logout = function () {
        this.profile_image = this.guest_profile_image;
        this.username = this.guest_username;
        this.name = this.guest_name;
        this.level = this.guest_level;
        this.credit = this.guest_credit;
        this.email = this.debug_email;
        this.phone_number = this.debug_phone_number;
        this.dob = this.debug_dob;
    }
}]);
