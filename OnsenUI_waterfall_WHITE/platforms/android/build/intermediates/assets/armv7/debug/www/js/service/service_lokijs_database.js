/**
 * @service lokijs_database
 * @desc the database storage service used to store persistent data for user,
 * when he logs in.
 */
waterfall.service('lokijs_database',
    ['$timeout', 'network_api', 'service_alert', 'user_credentials',
        function ($timeout, network_api, service_alert, user_credentials) {
            this.USER_FOUND = false;
            this.users = null;
            this.db = null;
            var that = this;

            /**
             * @function setup_database
             * @desc if database already exists, load it.
             * otherwise, create a new one.
             */
            this.setup_database = function () {
                this.db = new loki('waterfall_marketplace',
                    {
                        autoload: true,
                        autoloadCallback: that.loadHandler,
                        autosave: true,
                        autosaveInterval: 10000
                    }
                );
            };

            /**
             * @function loadhandler
             * @desc callback function when loading database.
             * - get collection of users (1 user, who logged in)
             * - if there is already a user who logged in,
             *    we setup the user_credentials to be this previously logged in user.
             *    in other words, restore last session.
             */
            this.loadHandler = function () {
                that.users = that.db.getCollection('users');
                if (isNull(that.users)) {
                    debug_log('loadHandler users addCollection');
                    that.users = that.db.addCollection('users');
                }
                else {

                    that.USER_FOUND = false;
                    var user_object = that.users.find();
                    debug_log('loadHandler users length' + user_object.length);
                    if (user_object.length > 0) {
                        user_credentials.setup_user(user_object[user_credentials.MESSAGE_KEY_INVESTOR_EMAIL], null, user_object[0]);
                        that.USER_FOUND = true;
                        debug_log('loadHandler users found');
                    }
                }
            };

            this.save_current_user = function () {
                this.remove_current_user();
                this.users.insert(user_credentials.generate_user_object());
                that.db.save();
                this.USER_FOUND = true;
            };

            this.remove_current_user = function () {
                if (this.users.find().length > 0) {
                    this.users.chain().remove();
                }
                this.USER_FOUND = false;
            };
        }
    ]
);


//Purely a test example function, to demonstrate how LOKIJS Works.
function test_loki() {
    var db = new loki('Example');
    var users = db.addCollection('users', {indices: ['email']});
    var odin = users.insert({name: 'odin', email: 'odin.soap@lokijs.org', age: 38});
    var thor = users.insert({name: 'thor', email: 'thor.soap@lokijs.org', age: 25});
    var stan = users.insert({name: 'stan', email: 'stan.soap@lokijs.org', age: 29});
    var oliver = users.insert({name: 'oliver', email: 'oliver.soap@lokijs.org', age: 31});
    var hector = users.insert({name: 'hector', email: 'hector.soap@lokijs.org', age: 15});
    var achilles = users.insert({name: 'achilles', email: 'achilles.soap@lokijs.org', age: 31});
    stan.name = 'Stan Laurel';
// update object (this really only syncs the index)
    users.update(stan);

    var dv = users.addDynamicView('a_complex_view');
    dv.applyWhere(function aCustomFilter(obj) {
        return obj.name.length > 1 && obj.age > 30;
    });
//view the data
    console.log('LokiJS view the data:\n ' + JSON.stringify(dv.data()));

// apply some changes
    users.insert({name: 'ratatosk', email: 'rata@tosk.r', age: 10320});

// behold the dynamicview updating itself by inspecting the data
    console.log('behold the dynamicview updating itself by inspecting the data:\n ' + JSON.stringify(dv.data()));
}