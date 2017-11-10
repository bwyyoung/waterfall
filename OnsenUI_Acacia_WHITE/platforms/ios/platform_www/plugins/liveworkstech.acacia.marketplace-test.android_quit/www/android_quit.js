cordova.define("liveworkstech.acacia.marketplace-test.android_quit.android_quit", function(require, exports, module) {
var exec = require('cordova/exec');

function android_quit() {
    console.log("android_quit: initialised");
}

android_quit.prototype.quit_android = function(aString){
    console.log("android_quit: quitting app");

    exec(function(result){
        
            /*alert("OK" + reply);*/
        },
        function(result){
            /*alert("Error" + reply);*/
        },"android_quit",aString,[]);
};

var m_android_quit = new android_quit();
module.exports = m_android_quit;

});
