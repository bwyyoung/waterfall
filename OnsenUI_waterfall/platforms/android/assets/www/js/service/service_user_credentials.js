

waterfall.service('user_credentials', [ function()
{
    this.MESSAGE_KEY_TOKEN = "Token";
    this.MESSAGE_KEY_INVESTOR_ID = "InvestorId";
    this.MESSAGE_KEY_INVESTOR_NAME = "InvestorName";
    this.MESSAGE_KEY_INVESTOR_EMAIL = "InvestorEmail";
    this.MESSAGE_KEY_INVESTOR_MOBILE = "InvestorMobile";
    this.MESSAGE_KEY_INVESTOR_DOB = "InvestorDOB";
    this.MESSAGE_KEY_CREDIT_CURRENCY = "CreditCurrency";
    this.MESSAGE_KEY_CREDIT_BALANCE = "CreditBalance";

    
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
    this.profile_image =  this.guest_profile_image;
    this.email = this.debug_email;
    this.phone_number = this.debug_phone_number;
    this.dob = this.debug_dob;
    this.token = '';
    this.id = '-1';
    
    this.setup_user_debug = function ()
    {
        this.profile_image  = this.debug_profile_image;
        this.username =  this.debug_username;
        this.level =  this.debug_level;
        this.credit =  this.debug_credit;
        this.email = this.debug_email;
        this.phone_number = this.debug_phone_number;
        this.dob = this.debug_dob;
    }
    var that = this;

    this.setup_user = function(username, password, response)
    {
        //TODO: TEMP SETUP USER DEBUG, because we need:
        // profile image, level, credit, phone number, dob
        if (DEBUG_USER)
            this.setup_user_debug();
        this.username =  username;
        this.email =  username;
        if (!isNull(response))
        {
            this.id =  response[this.MESSAGE_KEY_INVESTOR_ID];
            this.username =  response[this.MESSAGE_KEY_INVESTOR_EMAIL];
            this.name = response[this.MESSAGE_KEY_INVESTOR_NAME];
            this.phone_number = response[this.MESSAGE_KEY_INVESTOR_MOBILE];
            this.dob = new Date(response[this.MESSAGE_KEY_INVESTOR_DOB]);
            this.dob = this.dob.getDate() + '/' + this.dob.getMonth() + '/' + this.dob.getFullYear();
            this.token = response[this.MESSAGE_KEY_TOKEN];
            this.credit = response[this.MESSAGE_KEY_CREDIT_BALANCE];
            this.currency = response[this.MESSAGE_KEY_CREDIT_CURRENCY];
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
        }
    }
    
    this.logout = function()
    {
        this.profile_image  = this.guest_profile_image;
        this.username =  this.guest_username;
        this.name =  this.guest_name;
        this.level =  this.guest_level;
        this.credit =  this.guest_credit;
        this.email = this.debug_email;
        this.phone_number = this.debug_phone_number;
        this.dob =  this.debug_dob;
    }
}]);
