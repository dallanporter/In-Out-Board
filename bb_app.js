#!/usr/bin/node

/******
*
*
*
******/

var fs = require("fs");
var https = require("https");
var http = require("http");
var path = require("path");
var url = require("url");
var mime = require("mime");
var util = require("util");
var mysql = require("mysql");
var passwords = require("./passwords");
var Recaptcha = require("recaptcha").Recaptcha;
var express = require("express");
var app = express();

var groups = {}; // list of active groups
var users = {}; // list of active users

var recaptcha_public_key = "6LeXs-ASAAAAAP9xcj9Guz6ZoXdgpLTw6pOnhdCj";
var recaptcha_private_key = "6LeXs-ASAAAAACuqYMMZpmzG8cw9nlM5XIBtbaAH";

var privateKey = fs.readFileSync("/home/dporter/ssl/private/bb.key").toString();
var certificate = fs.readFileSync("/home/dporter/ssl/certs/bb_chained.crt").toString();

// Use json file to store the host, user, password, and database strings
var pwd = require("./password.json");

var connection = mysql.createConnection({
	host: pwd.host,
	user: pwd.user,
	password: pwd.password,
	database: pwd.database,
});

app.configure( function() {
	app.use( express.bodyParser());
	app.set( "views", __dirname + "/views" );
	app.set( "view engine", "jade" );
	app.use( express.logger( 'dev' ) );
	app.use( express.methodOverride() );
	app.use( express.cookieParser('sers&loo') );
	app.use( express.session() );
	app.use( express.static( path.join( __dirname, 'public') ) );
	app.use( express.favicon() );
	app.locals.pretty = true;
});

// Configure Express.js
//app.get( "/", express.static( __dirname + "/public/index.htm" ) );
app.get( "/formtest.htm", function( req, res ) {
	var recaptcha = new Recaptcha( recaptcha_public_key, recaptcha_private_key );
	var mod_output = recaptcha.toHTML();
	// hack the output to replace http:// with https:// since there is no
	// option in the library for secure http urls...
	mod_output = mod_output.replace(/http:/g, "https:");


	res.render( 'form.jade', {
		layout: false,
		foobar: mod_output

	});
});


app.get( "/signup", function( req, res ) {
	var recaptcha = new Recaptcha( recaptcha_public_key, recaptcha_private_key );
	var mod_output = recaptcha.toHTML();
	// hack the output to replace http:// with https:// since there is no
	// option in the library for secure http urls...
	mod_output = mod_output.replace(/http:/g, "https:");

	res.render( 'signup.jade', {
		layout: false,
		foobar: mod_output,
	});
});



function UpdateDatabase( sql, callback )
{
	console.log("TODO - update the database");
	console.log( sql );
	connection.query( sql, function( err, result, fields2 ) {
		if ( err )
		{
			console.log( err );
			if( callback )
			{
				callback( false );
			}
			return;
		}
		if( callback )
		{
			callback( true );
		}

	});
}

function SendMessageToGroup( groupname, subject, msg )
{
	var group = groups[ groupname ];
	if( !group )
	{
		return false;
	}
	io.sockets.in( groupname ).json.emit( subject, msg  );
}


var options = {
    key: privateKey,
    cert: certificate
};

//var server = https.createServer( options, handler);
//var server_nonsecure = http.createServer( handler );
var server = https.createServer( options, app ); // use express
var server_nonsecure = http.createServer( app ); // use express

var io = require("socket.io").listen( server ); // bind Socket.io to the webserver
server.listen( 443 ); // listen for HTTPS
server_nonsecure.listen( 80 ); // also listen for non-secure HTTP

// Socket.IO callbacks
io.sockets.on("connection", function( socket ) {
	socket.emit("news", { hello: "world!" } );
	socket.on("my other event", function( data ) {
		console.log( data );
	});
	socket.on("button_moved",  function( data ) {
		if( socket.mode != "READWRITE" )
		{
			console.log("Error - invalid permission to move the button");
			socket.json.emit("error", "NICE_TRY");
			return;
		}

		// update that user's button in memory
		var user = users[ "user_" + data.id ];
		if( user )
		{
			user.position.c = data.pos['c'];
			user.position.ce = data.pos['cp']; // ce & cp issue is a mess, how did this happen?
		}

		console.log("received button_moved - broadcasting message... " + util.inspect( data ) + " -> " + data['c'] );
		//socket.broadcast.emit("button_moved", { msg: "button_moved", value: data });

		var sql = "UPDATE users SET button_cell = '" + data.pos['c'] + "', button_cell_pos = " + data.pos['cp'] + " WHERE id = " + data.id + " LIMIT 1";
		console.log( "button SQL = " + sql );
		UpdateDatabase( sql );

		console.log("Emitting button_moved message to room " );
		console.log( socket.room );
		//io.sockets.in( socket.room ).emit( 'button_moved',  data );
		socket.broadcast.to( socket.room ).emit( 'button_moved', data ); // send to everyone *except* the sender
	});



    socket.on("set_remark", function( data ) {

		if( socket.mode != "READWRITE" )
		{
			console.log("Error - invalid permission to set a remark");
			socket.json.emit("error", "NICE_TRY");
			return;
		}
		console.log("Received set remark - broadcasting message..." + util.inspect( data ) );
		//socket.broadcast.emit("set_remark", { msg: "set_remark", value: data });
		//var room = io.sockets.manager.roomClients[ socket.id ];
		var sql = "UPDATE users SET remark = " + mysql.escape(data.remark) + " WHERE id = " + data.id;
		var group = groups[ socket.groupname ];
		if( !group )
		{
			console.log("Error getting group from remarking user.");

		}
		else
		{
			for( var i=0; i<group.users.length; i++ )
			{
				if( group.users[i].id == data.id )
				{
					group.users[i].remark = data.remark;
					break;
				}
			}
		}
		UpdateDatabase( sql );
		//io.sockets.in( socket.room ).emit( 'set_remark', data );
		socket.broadcast.to( socket.room ).emit( 'set_remark', data ); // send to everone *except* the sender
	});
	socket.on("init", function( data ) {
		//console.log("received init from client.");
		//console.log( data );
		// data.token - is the token passed in
		if( data.token == null || data.token == "" )
		{
			socket.json.emit("error", "INVALID_TOKEN");
			return;
		}



		// TODO - load the group from the database and send it now
		//connection.connect();
		// see if we already have the group

		var group = groups[ data.group ];
		if( group )
		{
			//console.log("Group is in memory!");
			var mode = null;
			if( data.token == group.read_token )
			{
				mode = "READONLY";
			}
			else if( data.token == group.readwrite_token )
			{
				mode = "READWRITE";
			}
			if( mode == null )
			{
				socket.json.emit("error", "INVALID_TOKEN");
				return;
			}
			console.log("Setting connection mode to " + mode );
			socket.mode = mode;
			var msg = {};
			msg.group = group;
			msg.mode = mode;
			socket.json.emit("init", msg );
			console.log( socket.id + " is joining group " + data.group );
			//console.log( group.users );
			console.log( socket.handshake.address );
			socket.join( data.group );
			socket.room = data.group; // put the user in the correct 'room'
			socket.groupid = group.id;
			socket.groupname = group.name;
			return;
		}

		// Otherwise, build the group from the database.
		console.log("Group is not in memory, fetch it");
		group = {};

		var sql = "SELECT * FROM groups WHERE name = " + mysql.escape( data.group );
		console.log( sql );
		connection.query( sql, function( err, rows, fields ) {
			if ( err )
			{
				console.log("Database error: " + err );
				socket.json.emit( err );
				return;
			}
			//connection.end();
			//connection.connect();
			if ( rows.length != 1 )
			{
				console.log("Group not found");
				socket.json.emit("error", "GROUP_NOT_FOUND");
				return;
			}


			var groupid = rows[0].id;
			group.id = groupid;
			group.name = rows[0].name;
			group.title = rows[0].title;
			group.password = rows[0].password;
			group.readwrite_token = rows[0].readwrite_token;
			group.read_token = rows[0].read_token;
			group.font = rows[0].font;
            group.alert = rows[0].alert;
			group.users = [];
			// now get users
			sql = "SELECT * FROM users JOIN users_to_groups ON users.id = users_to_groups.userid WHERE users_to_groups.groupid = " + groupid + " ORDER BY users.sort_order, users.id ASC";
			//console.log( sql );
			connection.query( sql, function( err, rows2, fields2 ) {
				if ( err )
				{
					socket.json.emit("error", "Database error: " + err );
					return;
				}
				for( var i=0; i< rows2.length; i++ )
				{
					var user = null;
					user = users["user_" + rows2[i].id ]; // see if we have the user already in memory
					if( user == null )
					{
						user = {}; // create a new user object
						user.id = rows2[i].id;
						user.name = rows2[i].name;
						user.position = {};
						user.position.c = rows2[i].button_cell;
						user.position.ce = rows2[i].button_cell_pos;
						user.color = rows2[i].color;
						user.remark = rows2[i].remark;
						user.extension = rows2[i].extension;
						user.email = rows2[i].email;
						//group.users[ 'user_' + user.id ] = user;
						users["user_" + user.id ] = user; // save the user for now
					}
					group.users.push( user );
				}

				var mode = null;
				if( data.token == group.read_token )
				{
					mode = "READONLY";

				}
				else if( data.token == group.readwrite_token )
				{
					mode = "READWRITE";

				}
				if( mode == null )
				{
					socket.json.emit("error", "INVALID_TOKEN");
					return;
				}
				console.log("Setting connection mode to " + mode );
				socket.mode = mode;
				var msg = {};
				msg.group = group;
				msg.mode = mode;
				socket.json.emit("init", msg );

				//socket.json.emit("init", group );
				//console.log( socket.id + " is joining group " + data.group );
				socket.join( data.group );
				socket.room = data.group; // put the user in the correct 'room'
				socket.groupid = group.id;
				socket.groupname = group.name;

				groups[ group.name ] = group;
			});
			//connection.end();


		});




		//socket.json.emit("init", TEST_group );
		//socket.json.emit("init", group );
		//console.log( socket.id + " is joining group " + data.group );
		//socket.join( data.group );
		//socket.room = data.group; // put the user in the correct 'room'
	});

	socket.on("admin_font_change", function( data ) {
		// TODO - check socket.get( 'is_admin', callback ... ) first before doing below
		console.log("Changing font for group");
		if ( data == null || data.groupname == null || data.newfont == null )
		{
			socket.json.emit("admin_error", { message: "INVALID_DATA" } );
			return;
		}
		var group = groups[ data.groupname ];
		if( group )
		{
			group.font = data.newfont;
		}
		// save the group record to DB
		var sql = "UPDATE groups SET font = '" + data.newfont + "' WHERE id = " + group.id + " LIMIT 1";
		console.log( sql );
		UpdateDatabase( sql );
		if( group )
		{
			SendMessageToGroup( group.name, "reinit", group );
			console.log( "telling clients to reinit" );
		}
	});

	socket.on("admin_color_change", function( data ) {
		// TODO - check socket.get( 'is_admin', callback ... ) first before doing below
		console.log("Changing color for a user.");
		var group = groups[ socket.groupname ];
		if( !group )
		{
			socket.json.emit("admin_error", { message: "INVALID_GROUP" });
			return;
		}
		var user = null;
		for( var i=0; i<group.users.length; i++ )
		{
			if( group.users[i].id == data.uid )
			{
				user = group.users[i];
				break;
			}
		}

		if( user == null )
		{
			socket.json.emit("admin_error", { message: "USER_NOT_FOUND" });
			return;
		}

		user.color = data.newcolor;
		UpdateDatabase( "UPDATE users SET color = '" + user.color + "' WHERE id = " + user.id );
		var msg = {};
		msg.userid = user.id;
		msg.color = user.color;
		SendMessageToGroup( socket.groupname, "change_color", msg );
	});

	socket.on("admin_add_user", function( data ) {
		// TODO - check socket.get( 'is_admin', callback ... ) first before doing below
		console.log("Adding new user...");
		// data->name
		// data->email
		if( data.name == null || data.name == "" )
		{
			console.log("Invalid New User Name");
			socket.json.emit("admin_error", { message: "INVALID_NAME" });
			return;
		}
		if( socket.groupid == null )
		{
			console.log("ERROR - admin group is null");

			socket.json.emit( "admin_error", { message: "INVALID_GROUP" } );
			return;
		}
		var groupid = socket.groupid;
		var groupname = socket.groupname;
		var group = groups[ groupname ];
		var newuser = {};
		var email = "";
		if( data.email )
		{
			email = data.email;
		}
		newuser.name = data.name;
		newuser.remark = 'Welcome!';
		newuser.position = {};
		newuser.position.c = "name";
		newuser.position.ce = 90.0;
		newuser.color = "#000000";
		newuser.sort_order = 9999;
		newuser.email = email;
		var sql = "INSERT INTO users (name, email, remark, color, button_cell, button_cell_pos, sort_order) VALUES ('" + data.name + "', '" + email + "', 'Welcome!', '#000000', 'name', 90.0, 9999 )";
		//console.log( sql );
		connection.query( sql, function( err, result ) {
			if ( err )
			{
				console.log("Database error: " + err );
				socket.json.emit( "admin_error", err );
				return;
			}

			var insertid = result.insertId;
			if( insertid )
			{
				sql = "INSERT INTO users_to_groups (userid, groupid) VALUES (" + insertid + ", " + groupid + ")";
				connection.query( sql, function( err, result ) {
					if( err )
					{
						console.log("Database error: " + err );
						socket.json.emit( "admin_error", err );
					}
					// success.
					// TODO - notify all connected sockets who are
					//        with this group!
					newuser.id = insertid;
					socket.json.emit("admin_user_added", newuser );
					// Tell all connected boards to update the group
					console.log("pushing new user to the group.user array" );
					group.users.push( newuser );
					users[ "user_" + newuser.id ] = newuser; // add it to the all user list
					//console.log("emitting init message (with updated group) to all connected users");
					//console.log( group );
					//io.sockets.in( groupname ).json.emit( "init", group );
					SendMessageToGroup( groupname, "reinit", group );

				});
			}

		});

	});

	socket.on("admin_sort_list", function( data ) {
		// Sort the list with the new sort order
		// incoming data is:
		// data.groupname = the group name
		// data.sort = {}
		//    data.sort['user_<id>'] = <newsortposition>
		console.log("Sorting group list on the server");
		console.log( data );
		var sql = null;
		if( data.sort != null )
		{
			for( var key in data.sort )
			{
				var user = users[ key ];
				if( user )
				{
					user.sort_order = data.sort[ key ];
					var pos = user.sort_order;
					//var uid = key.replace("user_", "" );
					var uid = user.id;
					console.log( user.name + "'s new sort position is " + pos );
					sql = "UPDATE users SET sort_order = " + pos + " WHERE id = " + uid + " LIMIT 1";
					console.log( sql );
					UpdateDatabase( sql );
					console.log( sql );
				}
			}

			// now resort the user list in memory
			var group = groups[data.groupname];
			if( group )
			{
				console.log("TODO - sort the list in memory");
				//console.log( group.users );

				group.users.sort( function( a, b ) {
					return a.sort_order - b.sort_order;
				});

				// Make connected boards reinit
				SendMessageToGroup( data.groupname, "reinit", group );
				console.log( "telling clients to reinit" );
				console.log( group );

			}
		}
	});

	socket.on("admin_edit_user", function( data ) {
		// TODO - check socket.get( 'is_admin', callback ... ) first before doing below
		console.log("Editing existing user...");
		console.log( data );

		var id = data.id;
		var name = data.name;
		var email = data.email;
		var extension = data.extension;
		if( !name || name == "" )
		{
			console.log("Invalid Edit User Name");
			socket.json.emit("admin_error", { message: "INVALID_NAME" });
			return;
		}
		if( !id || id == "" )
		{
			console.log("Invalid Edit User ID");
			socket.json.emit("admin_error", { message: "INVALID_NAME" });
			return;
		}
		if( !extension )
		{
			extension = "";
		}
		if( !email )
		{
			email = "";
		}

		var sql = "UPDATE users SET name = '" + name + "', email = '" + email + "', extension = '" + extension + "' WHERE id = " + id;
		//console.log( sql );
		connection.query( sql, function( err, result ) {
			if ( err )
			{
				console.log("Database error: " + err );
				socket.json.emit( "admin_error", err );
				return;
			}

			console.log("Database updated with user changes");
			if( data.groupname )
			{

				var group = groups[data.groupname];
				if( group )
				{
					console.log("Telling group to reinit");
					// Update the user value in memory
					var user_index = -1;
					for( var i=0; i<group.users.length; i++ )
					{
						if( group.users[i].id == data.id )
						{
							user_index = i;
							break;
						}
					}
					if( user_index >= 0 )
					{
						console.log("Removing user from memory array");
						group.users[ user_index ].name = name;
						group.users[ user_index ].email = email;
						group.users[ user_index ].extension = extension;
					}
					SendMessageToGroup( data.groupname, "reinit", group );
				}

			}
			socket.json.emit("admin_success", { message: "EDIT_SUCCESS" } );

		});

	});

	socket.on("admin_delete_user", function( data ) {
		// TODO - check socket.get( 'is_admin', callback ... ) first before doing below
		console.log("Deleting user " + data.id + "...");
		if( data.id == null )
		{
			// return an error to the client
			socket.json.emit( "admin_error", { error: "invalid id" } );
			return;
		}
		if( data.id > 0 )
		{
			var sql = "DELETE FROM users WHERE id = " + data.id + " LIMIT 1";
			UpdateDatabase( sql, function( success ) {
				if( success )
				{
					socket.json.emit("admin_user_deleted", { message: "success", id: data.id } );
					if( data.groupname )
					{
						var group = groups[ data.groupname ];
						if( group )
						{
							var user_index = -1;
							for( var i=0; i<group.users.length; i++ )
							{
								if( group.users[i].id == data.id )
								{
									user_index = i;
									break;
								}
							}
							if( user_index >= 0 )
							{
								console.log("Removing user from memory array");
								group.users.splice( user_index, 1 ); // remove it from the array
							}

							SendMessageToGroup( data.groupname, "reinit", group );
						}
					}
				}
				else
				{
					// error
					socket.json.emit("admin_error", { error: "some error happened" } );
				}
			});

		}
	});

    socket.on("admin_set_alert", function(data) {
        console.log("Setting board alert to " + data.alert);
        var msg = "NULL";
        if (data.alert!= null && data.alert != "") {
            msg = mysql.escape(data.alert);
        }
        var sql = "UPDATE groups SET alert = " + msg + " WHERE id = " + socket.groupid;
        console.log(sql);
        UpdateDatabase(sql);

        var g = groups[socket.groupname];
        if (g) {
            g.alert = data.alert;
            SendMessageToGroup( data.groupname, "reinit", g );
        }
        //socket.broadcast.to(socket.room).emit("set_alert", data);

    });

    socket.on("admin_set_title", function(data) {
        console.log("Setting board title to " + data.title);
        var sql = "UPDATE groups SET title = " + mysql.escape(data.title) + " WHERE id = " + socket.groupid;
        console.log(sql);
        UpdateDatabase(sql);

        var g = groups[socket.groupname];
        if (g) {
            g.title = data.title;
            SendMessageToGroup( data.groupname, "reinit", g );
        }
        //socket.broadcast.to(socket.room).emit("set_title", data);

    });

    socket.on("admin_style_title", function(data) {
        console.log("Setting board title style to " + data.css);
        var g = groups[socket.groupname];
        if (g) {
            SendMessageToGroup( data.groupname, "reinit", g);
        }
    });

	socket.on("admin_login", function( data ) {
		console.log("Received admin_login => " + data.groupname );
		// data->groupname
		// data->password
		// TODO - see if this groupname/password is valid, if so, emit "admin_login_success"
		socket.json.emit("admin_login_failed");
		var pwd = passwords.hash( data.password );
		console.log("raw password: " + data.password );
		console.log( "Hashed password = " + pwd );

		var testresult = passwords.validate( pwd, data.password );
		console.log("...Testing validate(" + pwd + ", " + data.password + ") -> " + testresult );

		var group = groups[ data.groupname ];

		if( group )
		{
			console.log("Group is in memory!");
			//console.log( group );
			if( !passwords.validate( group.password, data.password ) )
			{
				console.log("Invalid group password");
				socket.json.emit( "admin_error", "{message:'INVALID_PASSWORD'}" );
				return;
			}
			socket.groupid = group.id;
			socket.groupname = group.name;
			socket.json.emit( "admin_login_success", group );
			return;
		}

		// Otherwise, build the group from the datbase.
		console.log("Group not in memory, fetch it");
		group = {};
		// TODO - load the group from the database and send it now
		//connection.connect();


		var sql = "SELECT * FROM groups WHERE name = " + mysql.escape( data.groupname );
		console.log( sql );
		connection.query( sql, function( err, rows, fields ) {
			if ( err )
			{
				console.log("Database error: " + err );
				socket.json.emit( err );
				return;
			}
			if( !passwords.validate( rows[0].password, data.password ) )
			{
				console.log("Invalid password!");
				socket.json.emit("admin_login_failed");
				return;
			}
			console.log("password validated...");
			//connection.end();
			//connection.connect();
			if ( rows.length != 1 )
			{
				console.log("Group not found");
				socket.json.emit("admin_login_failed");
				return;
			}

			console.log( "rows.length = 1");

			var groupid = rows[0].id;
			group.id = groupid;
			group.name = rows[0].name;
			group.title = rows[0].title;
            group.alert = rows[0].alert;
			group.users = [];
			group.password = rows[0].password;
			group.readwrite_token = rows[0].readwrite_token;
			group.read_token = rows[0].read_token;
			group.font = rows[0].font;
			// now get users
			sql = "SELECT * FROM users JOIN users_to_groups ON users.id = users_to_groups.userid WHERE users_to_groups.groupid = " + groupid + " ORDER BY users.sort_order, users.id ASC";
			console.log( sql );
			connection.query( sql, function( err, rows2, fields2 ) {
				if ( err )
				{
					console.log( err );
					socket.json.emit("error", "Database error: " + err );
					return;
				}
				for( var i=0; i< rows2.length; i++ )
				{
					var user = {};
					user.id = rows2[i].id;
					user.name = rows2[i].name;
					user.position = {};
					user.position.c = rows2[i].button_cell;
					user.position.ce = rows2[i].button_cell_pos;
					user.sort_order = rows2[i].sort_order;

					user.remark = rows2[i].remark;
					user.color = rows2[i].color;
					user.extension = rows2[i].extension;
					user.email = rows2[i].email;
					//group.users[ 'user_' + user.id ] = user;
					group.users.push( user );
				}
				socket.groupid = group.id;
				socket.groupname = group.name;
				socket.json.emit( "admin_login_success", group );
				socket.set("is_admin", true );
				groups[ group.name ] = group;

				console.log("Loaded group to memory from DB");

			});
			//connection.end();


		});

	});
});

// Configure Socket.IO -- dont use Flash otherwise Firefox shows a warning sometimes
io.set('transports', [
	'websocket',
	/*'flashsocket',*/
	'htmlfile',
	'xhr-polling',
	'jsonp-polling'
]);

io.set('log level', 2 );
//io.set("log level", 1 );
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
