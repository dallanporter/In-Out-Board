

// NOTE - The iFrame script

// Make console.log available
window.log=function(){log.history=log.history||[];log.history.push(arguments);if(this.console){console.log(Array.prototype.slice.call(arguments))}};
// make it safe to use console.log always
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,timeStamp,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();){b[a]=b[a]||c}})((function(){try
{console.log();return window.console;}catch(err){return window.console={};}})());

//http://stackoverflow.com/questions/1131630/javascript-jquery-param-inverse-function
var QueryStringToHash = function QueryStringToHash  (query) {
	var query_string = {};
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		pair[0] = decodeURIComponent(pair[0]);
		pair[1] = decodeURIComponent(pair[1]);
		    // If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = pair[1];
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [ query_string[pair[0]], pair[1] ];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(pair[1]);
		}
	}
	return query_string;
};

var socket = io.connect("http://secure.button-board.com",
			{
				secure:true,
				reconnect:true,
				"reconnection delay":5000,
				port: 443,
				'max reconnect attempts': 10000
			}
		);
var positions = {};
var button_size = 30;
var board_size = "medlarge";
var do_reconnect = false;
var token = null;
var group = null;
var font = null;

var bb_users = {};
var bb_view_only = false;
var bb_show_settings = true;
var bb_mode = null;

if( !socket )
{
	alert("Error connection to socket.");
}
socket.on( 'news', function( data ) {
	//console.log( data );
	socket.emit("my other event", {my: "data"});
});

socket.on( 'error', function( data ) {
	console.log( data );
});

socket.on( 'button_moved', function( data ) {
	console.log("move button now.");
	MoveButton( "username", data );
});

socket.on( 'connect', function() {
	console.log("socket.io connected.");
	if ( do_reconnect )
	{
		socket.json.emit("init", { group: group, token: token } );
	}
});

socket.on( 'set_remark', function( data ) {
	console.log("socket.io set remark now!");
	var id = data.id;
	var new_remark = data.remark;
	SetRemark( id, new_remark );
});

socket.on("set_title", function(data) {
    console.log("Setting board title to " + data.title);
    $("#bb_title_text").html(data.title);
});

socket.on("style_title", function(data) {
    console.log("Setting board title style to be " + data.css);
    $("#bb_title_text").css(data.css);
});


socket.on( 'change_color', function( data ) {
	console.log("Changing color for user: " + data.userid + " -> " + data.color );
	$("#row_" + data.userid ).css("color", data.color );
	$("#remark_" + data.userid ).css("color", data.color );
});


socket.on( 'init', function( data ) {
	/* Handle init message. This will be an object containing the entire board
	[
		{
			id:<userid:Int>,
			name:<username:String>,
			remark:<remarks:String>,
			position: { c:<cell:String>, cp:<cell percentage:Float> }
		}
		...
	]
	*/
	bb_view_only = data.mode == "READONLY";
	var group = data.group;
	font = data.group.font;
	ClearBoard(); // clear it first in case we're re-initializing

	var group_id = group.id;
	var group_name = group.name;
    if (group.title) {
        $("#bb_title_text").html(group.title);
    }
	/*
	if ( bb_view_only )
	{
		$("#bb_title_text").html( group_name + " (view only)" );
	}
	else
	{
		$("#bb_title_text").html( group_name );
	}
	*/
	var board = group.users;
	console.log("Recieved init from the server");
	if( board)
	{
		for(var i=0; i<board.length; i++)
		{
			AddPersonToBoard( board[i] );
		}
		// Add a blank row at the bottom
		AddBlankRow();
		console.log("Sending parent a message");
		ResizeBoard();
		ResizeButtons(); // normally gets called by ResizeBoard, but do exta call one time here
		NotifyParentSizeChanged();

        if (group.title) {
            $("#bb_title_text").html(group.title);
        }
	}


	do_reconnect = true; // set flag to reconnect on socket loss
});

socket.on( 'reinit', function( group ) {
	/* Handle init message. This will be an object containing the entire board
	[
		{
			id:<userid:Int>,
			name:<username:String>,
			remark:<remarks:String>,
			position: { c:<cell:String>, cp:<cell percentage:Float> }
		}
		...
	]
	*/


	ClearBoard(); // clear it first in case we're re-initializing
	bb_users = {}; // reset the object holding all users
	var group_id = group.id;
	var group_name = group.name;
    if (group.title) {
        $("#bb_title_text").html(group.title);
    }
	font = group.font;
	/*
	if ( bb_view_only )
	{
		$("#bb_title_text").html( group_name + " (view only)" );
	}
	else
	{
		$("#bb_title_text").html( group_name );
	}
	*/
	var board = group.users;
	console.log("Recieved init from the server");
	if( board)
	{
		for(var i=0; i<board.length; i++)
		{

			AddPersonToBoard( board[i] );
		}
		// Add a blank row at the bottom
		AddBlankRow();
		console.log("Sending parent a message");
		ResizeBoard();
		ResizeButtons(); // normally gets called by ResizeBoard, but do exta call one time here
		NotifyParentSizeChanged();

	}

	do_reconnect = true; // set flag to reconnect on socket loss
});

socket.on( 'disconnect', function() {
	console.log("socket.io disconnected.");
	// Clear the board or show a disconnected state
	ClearBoard();
});

$(function() {
	InitBoard();
	window.onresize = function( e )
	{
		// Handle the page resizing here

		// Rebuild the position lookup table
		ResizeBoard();
	}
	$.receiveMessage( function(msg) {
		// NOTE - this is the IFRAME WINDOW (the board)



		var decoded = QueryStringToHash( msg.data );
		console.log("Received message from parent: " + decoded.message );
		switch ( decoded.message )
		{
			case "board_load":
				console.log("Load the board!");
				break;
			case "board_init":
				console.log("Received board_init from from parent.");
				// send the server the init command with the group and token
				group = decoded.group;
				token = decoded.token;
				if ( decoded.show_settings == "false" )
				{
					// hide the settings icon
					bb_show_settings = false;
				}
				else
				{
					bb_show_settings = true;
				}
				if ( decoded.view_only == "true" )
				{
					// the board is view only
					bb_view_only = true;
				}
				else
				{
					bb_view_only = false;
				}

                if (!group.title) {
                    try
                    {
                        if( decoded["opts[logo]"] && decoded["opts[logo]"] != "" )
                        {
                            console.log("Try setting the logo to " + decoded["opts[logo]"] );
                            var url = decoded["opts[logo]"];
                            //$("#bb_title_text").empty(); // remove any text
                            $("#bb_title_text").html("<img src=\"" + url + "\" />" );
                        }
                        else if( decoded["opts[title]"] )
                        {
                            var title = decoded["opts[title]"];
                            $("#bb_title_text").html( title );
                        }
                    }
                    catch( ex )
                    {
                        console.log("Caught exception accessing options");
                    }
                }
				socket.json.emit("init", { group: decoded.group, token: decoded.token } );

				break;
			default:
				console.log("Unhandled message from parent window.");
				break;
		}

	});

	SendParentMessage( { message:'board_ready' } );

});

function TableResized()
{
	console.log("table resized?!?!?!?");
}

function SendParentMessage( param )
{
	console.log("Sending parent message");
	console.log( param );
	try
	{
		var url = (window.location != window.parent.location) ? document.referrer: document.location;

		$.postMessage( param, url, parent ); // tell the parent frame the size changed
	}
	catch( ex )
	{
		console.log("Error sending parent message.");
	}
}

function ResizeBoard()
{
	var new_width = $("#container").width();
	//console.log("ResizeBoard() -- Width of board is now " + new_width );
	var prev_size = button_size;
	$(".user_row").removeClass("font_size_tiny");
	$(".user_row").removeClass("font_size_medium");
	$(".user_row").removeClass("font_size_medlarge");
	$(".user_row").removeClass("font_size_large");
	$(".user_row").removeClass("font_size_giant");
	$(".remark_cell").removeClass("font_size_tiny");
	$(".remark_cell").removeClass("font_size_medium");
	$(".remark_cell").removeClass("font_size_medlarge");
	$(".remark_cell").removeClass("font_size_large");
	$(".remark_cell").removeClass("font_size_giant");

	var fontname = font;
	if( fontname != null )
	{
		$(".remark_cell").addClass( fontname );
		$(".user_row").addClass( fontname );
	}

	if( new_width < 350 )
	{
		// Tiny
		button_size = 10;
		board_size = "tiny";
		$(".user_row").addClass("font_size_tiny");
		$(".remark_cell").addClass("font_size_tiny");

	}
	else if( new_width < 475 )
	{
		// Med
		button_size = 20;
		board_size = "medium";
		$(".user_row").addClass("font_size_medium");
		$(".remark_cell").addClass("font_size_medium");
	}
	else if( new_width < 900 )
	{
		// MedLarge
		button_size = 30;
		board_size = "medlarge";
		$(".user_row").addClass("font_size_medlarge");
		$(".remark_cell").addClass("font_size_medlarge");
	}
	else if( new_width < 1500 )
	{
		// Large
		button_size = 40;
		board_size = "large";
		$(".user_row").addClass("font_size_large");
		$(".remark_cell").addClass("font_size_large");
	}
	else
	{
		button_size = 75;
		board_size = "giant";
		$(".user_row").addClass("font_size_giant");
		$(".remark_cell").addClass("font_size_giant");
	}

	//console.log("Setting board size to: " + board_size );

	// the new width =
	BuildPositionLookupTable();
	if( prev_size != button_size )
	{
		ResizeButtons();

		NotifyParentSizeChanged(); // tell parent to resize the be iframe
	}


	RepositionButtons();
	RepositionRemarks();

	if ( bb_show_settings == "false" )
	{
		$("#bb_settings").hide();
	}
	else
	{
		$("#bb_settings").show();
	}


}

function RepositionButtons()
{
	for( var key in bb_users )
	{
		var u = bb_users[key];
		u.button.css("left", CalculateButtonPosition( u.button.data("pos") ) - button_size/2.0 );
	}
}

function ResizeButtons( )
{
	// TODO - loop through all visible buttons and change size
	//$("#test_button").css("width", button_size );
	//$("#test_button").css("height", button_size );
	//$("#test_button").css("background-image", "url(../images/buttons/default/" + board_size + ".png)" );
	var top = null;
	for( var key in bb_users )
	{
		if( bb_users[key] )
		{
			bb_users[key].button.css("width", button_size );
			bb_users[key].button.css("height", button_size );
			bb_users[key].button.css("background-image", "url(../images/buttons/default/" + board_size  + ".png)" );
			top = bb_users[key].row[0].offsetTop;
			//top = bb_users[key].row[0].offset().top();
			bb_users[key].button.css("top", top );
			//console.log("Button top: " + top );
		}
	}
}

function RepositionRemarks()
{
	var top = null;
	for( var key in bb_users )
	{
		var u = bb_users[key];
		top = bb_users[key].row[0].offsetTop;
		//top = $("#remark_" + key ).offset().top;
		u.remark_container.css("top", top );
	}
}

function InitBoard()
{
	//$("#remark_editor").hide();
	/*
	$(".remark").bind( "click", function( a ) {
		$("#remark_editor").show();
		var  top = a.currentTarget.offsetTop + 5;
		$("#remark_editor").css("top", top);
		$("#remark_editor").css("right", 4);
	});
	*/
	// test a button
	/*
	$("#test_button").draggable( {
		stop: function(event, ui ) {
			console.log("Drag end");
			var msg = {};
			msg.value = ui.offset.left;
			var pos = GetButtonPosition( ui.offset.left + (button_size/2.0) );
			socket.json.emit("button_moved", pos );
		},
		containment: $("#container")
	});
	*/
	ResizeBoard(); // intial resize setup


}

function ClearBoard()
{
	for( var key in bb_users )
	{
		var user = bb_users[key];
		if( user )
		{
			$(user.row[0]).remove();
			user.button.remove();
			user.remark_container.remove();
		}
	}

	$("#bb_extrarow").remove();
}

function BuildPositionLookupTable()
{
	// Get the position lookup table
	// head_name, head_in, head_out, head_blank, head_vac, head_9 - head_5, head_remarks
	positions.pos_name = $("#head_name").offset().left;
	positions.pos_in = $("#head_in").offset().left;
	positions.pos_out = $("#head_out").offset().left;
	positions.pos_blank = $("#head_blank").offset().left;
	positions.pos_vac = $("#head_vac").offset().left;
	positions.pos_9 = $("#head_9").offset().left;
	positions.pos_10 = $("#head_10").offset().left;
	positions.pos_11 = $("#head_11").offset().left;
	positions.pos_12 = $("#head_12").offset().left;
	positions.pos_1 = $("#head_1").offset().left;
	positions.pos_2 = $("#head_2").offset().left;
	positions.pos_3 = $("#head_3").offset().left;
	positions.pos_4 = $("#head_4").offset().left;
	positions.pos_5 = $("#head_5").offset().left;
	positions.pos_remarks = $("#head_remarks").offset().left;
}

// Take the X coordinate of the button and return the Cell and Percent position of the cell
// i.e.  400 -> returns -> { c:'in', cp:'33.3' } [ depending on the width of the board at the time]
function GetButtonPosition( xcoord )
{
	var button_width = button_size;
	var tmp_width = 0;
	var c = "name";
	var cpercent = 50; // TEST
	if( xcoord < positions.pos_in )
	{
		c = "name";
	}
	else if( xcoord <  positions.pos_out )
	{
		c = "in";
	}
	else if( xcoord <  positions.pos_blank )
	{
		c = "out";
	}
	else if( xcoord < positions.pos_vac )
	{
		c = "blank";

	}
	else if( xcoord < positions.pos_9 )
	{
		c = "vac";
	}
	else if( xcoord < positions.pos_10 )
	{
		c = "9am";
	}
	else if( xcoord < positions.pos_11 )
	{
		c = "10am";
	}
	else if( xcoord < positions.pos_12 )
	{
		c = "11am";
	}
	else if( xcoord < positions.pos_1 )
	{
		c = "12pm";
	}
	else if( xcoord < positions.pos_2 )
	{
		c = "1pm";
	}
	else if( xcoord < positions.pos_3 )
	{
		c = "2pm";
	}
	else if( xcoord < positions.pos_4 )
	{
		c = "3pm";
	}
	else if( xcoord < positions.pos_5 )
	{
		c = "4pm";
	}
	else if( xcoord < positions.pos_remarks )
	{
		c = "5pm";
	}
	else
	{
		// we're in the remarks area.
		c = "remarks";
	}
	result = {};
	result.c = c;
	var cellwidth = GetCellWidth( c );
	// TODO - figure out where the button lies inside of the cell
	result.cp = cpercent;
	return result;
}

// Returns the table cell width for the given ('whichone') cell.
// These can vary depending on the page size (customizable)
function GetCellWidth( whichone )
{
	var result = 0;
	switch( whichone )
	{
		case "name":
			result = positions.pos_in - positions.pos_name;
			break;
		case "in":
			result = positions.pos_out - positions.pos_in;
			break;
		case "out":
			result = positions.pos_blank - positions.pos_out;
			break;
		case "blank":
			result = positions.pos_vac - positions.pos_blank;
			break;
		case "vac":
			result = positions.pos_9 - positions.pos_vac;
			break;
		case "9am":
			result = positions.pos_10 - positions.pos_9;
			break;
		case "10am":
			result = positions.pos_11 - positions.pos_10;
			break;
		case "11am":
			result = positions.pos_12 - positions.pos_11;
			break;
		case "12pm":
			result = positions.pos_1 - positions.pos_12;
			break;
		case "1pm":
			result = positions.pos_2 - positions.pos_1;
			break;
		case "2pm":
			result = positions.pos_3 - positions.pos_2;
			break;
		case "3pm":
			result = positions.pos_4 - positions.pos_3;
			break;
		case "4pm":
			result = positions.pos_5 - positions.pos_4;
			break;
		case "5pm":
			result = positions.pos_remarks - positions.pos_5;
			break;
		case "remarks":
			result = $("#container").width() - positions.pos_remarks;
			break;
		default:
			result = 0;
	}
	return result;
}

// Given an object parameter {c:<cellname>, cp:<percentage within cell>},
// return the x coordinate where the button should be
function CalculateButtonPosition( pos )
{
	// pos.c = "which cell", i.e. "in, out, vac, 9am, ..., 5pm, remarks
	// pos.cp = <percentage within this cell>, i.e. 50 -> 50% -> middle of the cell
	var xpos = 0;
	if( pos.ce != null )
	{
		pos.cp = pos.ce; // for some reason it's ce first, then cp. ugh..
	}
	if( pos.c == null || pos.cp == null )
	{
		xpos = 20;
		return xpos; // return 0
	}
	switch( pos.c )
	{
		case "name":
			xpos = 0;
			break;
		case "in":
			xpos = positions.pos_in;
			break;
		case "out":
			xpos = positions.pos_out;
			break;
		case "blank":
			xpos = positions.pos_blank;
			break;
		case "vac":
			xpos = positions.pos_vac;
			break;
		case "9am":
			xpos = positions.pos_9;
			break;
		case "10am":
			xpos = positions.pos_10;
			break;
		case "11am":
			xpos = positions.pos_11;
			break;
		case "12pm":
			xpos = positions.pos_12;
			break;
		case "1pm":
			xpos = positions.pos_1;
			break;
		case "2pm":
			xpos = positions.pos_2;
			break;
		case "3pm":
			xpos = positions.pos_3;
			break;
		case "4pm":
			xpos = positions.pos_4;
			break;
		case "5pm":
			xpos = positions.pos_5;
			break;
		case "remarks":
		default:
			xpos = positions.pos_remarks;
			break;
	}

	// TODO - figure out the offset for the percent
	var cell_width = GetCellWidth( pos.c );

	return xpos + (cell_width * pos.cp/100.0);
}

function OnButtonDragged( a, b )
{

}

function AcceptRemarks()
{
	$("#remark_editor").hide();
}

function CancelRemarks()
{
	$("#remark_editor").hide();
}

function MoveButton( whichone, data )
{
	// data = { c: <which cell - string>, cp: <percentage within cell - number > }
	// TODO - convert value to x coordinate
	//$("#test_button").css("left", value );
	var position = null;
	if( data.pos )
	{
		position = data.pos;
	}
	else if( data.position )
	{
		position = data.position;
	}
	else
	{
		console.log("Error moving button. No data");
		return;
	}
	var xpos = CalculateButtonPosition( position ) - button_size/2.0;
	var button = $("#button_" + data.id );
	if( button )
	{
		button.animate({"left":xpos}, 1000, 'easeInOutQuad' );
		button.data( "pos", position );
	}
}

function SetRemark( id, newremark )
{
	console.log("Setting remark now...");
	$("#remark_" + id).text( newremark );
}

function AddBlankRow()
{
	console.log("Adding Blank Row to the board");
	var str = "<tr id=\"bb_extrarow\" class=\"user_row\">";
        str += "<td class=\"name\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"remark\"></td>";
        str += "</tr>";
	var tr = $(str);
	$("#container > tbody:last").append( str );
}

function AddPersonToBoard( data )
{
	// Add the person to the board now
	//console.log("Adding person to the board");
	var fontname = font;
	if( fontname == null )
	{
		fontname = "";
	}
	var ext_string = "";
	if( data.extension && data.extension != "" )
	{
		ext_string = "<span class=\"phone_extension\">" + data.extension + "</span>";
	}

	var str = "<tr id=\"row_" + data.id + "\" class=\"user_row\">";
        str += "<td class=\"name\">" + data.name + " " + ext_string + "</td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "<td class=\"sm\"></td>";
        str += "</tr>";
	var tr = $(str);
	$("#container > tbody:last").append( str );

	var row = $("#row_" + data.id );
	var y = row[0].offsetTop;

	var str = "<div id=\"button_" + data.id + "\" style=\"top:" + y + "px;left:30px;\" class=\"button\"></div>";
	$("#button_container").append( str );



	str = "<div id=\"remark_" + data.id + "\" class=\"remark remark_cell\" style=\"top:" + y + "px;right:0px;\">" + data.remark + "</div>";
	$("#remark_container").append( str );


	if ( !bb_view_only )
	{
		$("#remark_" + data.id ).editInPlace( { callback:
			function(id, newtext, oldtext) {
				//alert("New Text: " + newtext );
				var msg = {};
				msg.id = id.replace("remark_", "");
				msg.remark = newtext;
				socket.json.emit("set_remark", msg );
				return newtext;
			}, show_buttons: false, bg_over: "transparent" } );
	}

	var u = {};
	u.name = data.name;
	u.id = data.id;
	u.remarks = data.remarks;
	u.color = data.color;
	u.email = data.email;
	u.extension = data.extension;
	u.button = $("#button_" + u.id );
	u.button.data( "user", u ); // pointer back to user
	u.button.data( "pos", { c: 'in', cp: 50 } ); // set initially as 'in'
	MoveButton( "username", data ); // move their button to the correct spot.
	u.button.css("left", CalculateButtonPosition( u.button.data("pos") ) );
	u.row = row;
	bb_users['user_' + u.id ] = u; // store the user
	u.remark_container = $("#remark_" + u.id ); // store the remark container

	if ( !bb_view_only )
	{

		$("#button_" + u.id ).draggable( {
			stop: function(event, ui ) {
				var b = $("#button_" + u.id );
				//console.log("Drag end");
				var msg = {};
				msg.value = ui.offset.left;
				msg.pos = GetButtonPosition( ui.offset.left + (button_size/2.0) );
				msg.id = u.id;
				socket.json.emit("button_moved", msg );
				b.data( "pos", msg.pos ); // save the new position
				// put it back vertically
				if( ui.originalPosition.top != ui.offset.top )
				{
					$(this).animate({"top":ui.originalPosition.top}, 1000, 'easeInOutQuad' );
				}
				StopDragging( event, ui );
			},
			start: StartDragging,
			drag: DragMovement,
			containment: $("#container")
		});
		$("#button_" + data.id ).addClass("use_pointer");

	}

	row.css("color", u.color ); // set the color
	u.remark_container.css("color", u.color );

}

function StartDragging( event, ui )
{
	//console.log("Start dragging");
	var top = ui.offset.top + 40;
	var left = ui.offset.left;
	$("#position_callout").show();


}

function StopDragging( event, ui )
{
	//console.log("Stop dragging");
	$("#position_callout").hide();
}

function DragMovement( event, ui )
{
	//console.log("drag");
	var top = ui.offset.top - 35;
	var left = ui.offset.left - 10;
	$("#position_callout").offset( { top: top, left: left } );
	var pos = GetButtonPosition( left  + (button_size) );
	$("#position_callout").text( pos.c );
}

function NotifyParentSizeChanged()
{
	try
	{
		var url = (window.location != window.parent.location) ? document.referrer: document.location;
		var msg = {};
		msg.message = "board_changed";
		msg.data = $("#board_c").height();
		$.postMessage( msg, url, parent ); // tell the parent frame the size changed
	}
	catch( ex )
	{
		console.log("Error notifying parent.");
	}
}

function ShowSettings()
{
	window.open("https://secure.button-board.com/settings.htm", "_blank" );
}