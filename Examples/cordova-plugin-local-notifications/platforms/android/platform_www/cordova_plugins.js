cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-plugin-x-toast.Toast",
        "file": "plugins/cordova-plugin-x-toast/www/Toast.js",
        "pluginId": "cordova-plugin-x-toast",
        "clobbers": [
            "window.plugins.toast"
        ]
    },
    {
        "id": "cordova-plugin-x-toast.tests",
        "file": "plugins/cordova-plugin-x-toast/test/tests.js",
        "pluginId": "cordova-plugin-x-toast"
    },
    {
        "id": "cordova-plugin-device.device",
        "file": "plugins/cordova-plugin-device/www/device.js",
        "pluginId": "cordova-plugin-device",
        "clobbers": [
            "device"
        ]
    },
    {
        "id": "cordova-plugin-local-notifications-pgb.LocalNotification",
        "file": "plugins/cordova-plugin-local-notifications-pgb/www/local-notification.js",
        "pluginId": "cordova-plugin-local-notifications-pgb",
        "clobbers": [
            "cordova.plugins.notification.local",
            "plugin.notification.local"
        ]
    },
    {
        "id": "cordova-plugin-local-notifications-pgb.LocalNotification.Core",
        "file": "plugins/cordova-plugin-local-notifications-pgb/www/local-notification-core.js",
        "pluginId": "cordova-plugin-local-notifications-pgb",
        "clobbers": [
            "cordova.plugins.notification.local.core",
            "plugin.notification.local.core"
        ]
    },
    {
        "id": "cordova-plugin-local-notifications-pgb.LocalNotification.Util",
        "file": "plugins/cordova-plugin-local-notifications-pgb/www/local-notification-util.js",
        "pluginId": "cordova-plugin-local-notifications-pgb",
        "merges": [
            "cordova.plugins.notification.local.core",
            "plugin.notification.local.core"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-x-toast": "2.3.1",
    "cordova-plugin-device": "1.1.2",
    "android.support.v13": "23.0.1-r2",
    "cordova-plugin-local-notifications-pgb": "0.8.2-rc.1"
};
// BOTTOM OF METADATA
});