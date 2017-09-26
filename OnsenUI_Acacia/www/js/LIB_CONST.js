var DEBUG_USER = true;
var DEBUG_NETWORK = true;
var DEBUG_NO_LOCALSTORAGE = true;
var DEBUG_ERROR= true;
var DEBUG_LOGGING=true;

var USER_LOGGED_IN = 'USER_LOGGED_IN';

var BOOL_USER_LOGGED_IN_REGISTERED = false;
var BOOL_USER_LOGGED_IN_GUEST = false;

var DEFAULT_HOME_URL = 'slidemenu_left/1_home.html';

var DEFAULT_CREDIT_MINIMUM = 100;
var DEFAULT_CREDIT_ADD_MINIMUM = 100;

var EVENT_BACKBUTTON = "backbutton_press";
var EVENT_KEYBOARD_UP = "keyboard_up";
var EVENT_KEYBOARD_DOWN = "keyboard_down";
var EVENT_LAZY_SCROLL = "Lazy_Scroll";

/*
We need to force locale to en-US, because different locales mess up number formatting.
For example, fr-FR creates numbers like '100,00 US$' (100USD) ,
where the symbol is placed at back of number, and decimal point is replaced with comma.
 */
var DEFAULT_LOCALE = 'en-US';

var DEFAULT_CURRENCY = 'USD';

var DEFAULT_CURRENCY_NUMBER_FORMAT = new Intl.NumberFormat(
    [DEFAULT_LOCALE],
    {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        currencyDisplay: "symbol",
        maximumFractionDigits: 2
    }
);

var DEFAULT_CURRENCY_NUMBER_FORMAT_WHOLE = new Intl.NumberFormat(
    [DEFAULT_LOCALE],
    {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        currencyDisplay: "symbol",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    }
);

var DEFAULT_APPLICATIONGROUP = "P2P";

