


function test_loki() {
    var db = new loki('Example');
    var users = db.addCollection('users', { indices: ['email'] });
    var odin = users.insert( { name : 'odin', email: 'odin.soap@lokijs.org', age: 38 } );
    var thor = users.insert( { name : 'thor', email : 'thor.soap@lokijs.org', age: 25 } );
    var stan = users.insert( { name : 'stan', email : 'stan.soap@lokijs.org', age: 29 } );
    var oliver = users.insert( { name : 'oliver', email : 'oliver.soap@lokijs.org', age: 31 } );
    var hector = users.insert( { name : 'hector', email : 'hector.soap@lokijs.org', age: 15} );
    var achilles = users.insert( { name : 'achilles', email : 'achilles.soap@lokijs.org', age: 31 } );
    stan.name = 'Stan Laurel';
// update object (this really only syncs the index)
    users.update(stan);

    var dv = users.addDynamicView('a_complex_view');
    dv.applyWhere(function aCustomFilter(obj){
        return obj.name.length  > 1 && obj.age > 30;
    });
//view the data
    console.log('LokiJS view the data:\n ' + JSON.stringify(dv.data()));

// apply some changes
    users.insert({ name: 'ratatosk', email: 'rata@tosk.r', age: 10320 });

// behold the dynamicview updating itself by inspecting the data
    console.log('behold the dynamicview updating itself by inspecting the data:\n ' + JSON.stringify(dv.data()));
}