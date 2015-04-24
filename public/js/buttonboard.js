
var server = "http://localhost";
var server_port = 8080;
// NOTE - The parent window script

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

(function( $ ) {	
	$.fn.ButtonBoard = function( opts ) {
		// Dont allow chainability -- only one object should be used
		var defaults = {
			group: "demo",
			width: 400,
			height:500,
			top: 20,
			left:100,
			autoscale:true,
			fontsize:"11px",
			view_only: false,
			show_settings: true,
			logo: null
		};
		
		this.html(""); // remove any content
		
		
		var options = $.extend( {}, defaults, opts );
				
		
		this.iframe = $("<iframe id=\"buttonboard_main\" scrolling=\"no\"/>");
		this.iframe.appendTo( this );
		if ( location.protocol == "https:" )
		{
			var tmp = server;
			if( server_port != 443 )
			{
				tmp += ":" + server_port;
			}
			this.src = tmp + "/board.htm";
			this.iframe.attr("src", tmp + "/board.htm");
		}
		else
		{
			var tmp = server;
			if( server_port != 80 )
			{
				tmp += ":" + server_port;
			}
			this.src = tmp + "/board.htm";
			this.iframe.attr("src", tmp + "/board.htm");			
		}

		//iframe.attr("height", "100%");
		this.iframe.attr("width", "100%");
		this.iframe.attr("scrolling", "no");
		this.iframe.attr("frameborder", 0);
		this.iframe.attr("marginheight", 0);
		this.iframe.attr("marginwidth", 0 );
		
		
		this.iframe.resize(function() {
			//alert("iframe has resized!");
		});
		
	
		//this.css("position", "absolute");
		//this.css("top", options.top);
		//this.css("left", options.left);
		//this.css("width", options.width);
		//this.css("background-color", options.bgcolor );
		
		
		/*
		this.test = function( val )
		{
			//console.log("inside ButtonBoard::test() " + this );
			$.postMessage( 'hello from parent', this.src, this.iframe.get(0).contentWindow );
		}
		*/
		
		this.SendBoardMessage = function ( param )
		{
			console.log("Sending board message");
			console.log( param );
			try
			{
				var url = this.src;
				
				$.postMessage( param, url, this.iframe.get(0).contentWindow );
			}
			catch( ex )
			{
				console.log("Error sending board a message");
			}
		}	
		
		$.receiveMessage( function(msg)
		{
			// NOTE - this is the PARENT WINDOW
			var decoded = QueryStringToHash( msg.data );
			console.log("Received a message from the board: " + decoded.message );
			switch( decoded.message )
			{
				case "board_changed":
					//$("#buttonboard_main").height( $("#buttonboard_main").contents().height() );
					console.log("Setting the iframe height to " + decoded.data );
					//$("buttonboard_main").attr("height", decoded.data );
					$("#buttonboard_main").css( "height", decoded.data + "px" );
					break;
				case "board_ready":
					console.log("Received board_ready message from iframe");
					if( opts.title )
					{
						opts.title = opts.title.replace(/ /g, "&nbsp" );	// get rid of the space
					}
					buttonboard.SendBoardMessage( { message: "board_init", group: opts.group, token: opts.token, view_only: opts.view_only, show_settings: opts.show_settings, opts:opts } );
					
					break;
				default:
					console.log("Unhandled message from board");
			}
		});
		
		
		
		
		return this;
	};
	
	$.fn.ButtonBoard.test = function( val )
	{
		return this.each( function() {
			(new $.ButtonBoard($(this),options));
		});
	};
})( jQuery );

/*
function SendBoardMessage( param )
{
	console.log("Sending board message");
	console.log( param );
	try
	{
		var url = this.src;
		
		$.postMessage( param, url, this.iframe.get(0).contentWindow );
	}
	catch( ex )
	{
		console.log("Error sending board a message");
	}
}
*/

function TestMessage()
{
	//console.log("TODO - test messaging now.");
	//buttonboard.test('message');
	buttonboard.SendBoardMessage('message');
}

