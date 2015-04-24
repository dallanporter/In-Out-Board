# In-Out-Board
A digital in-and-out board using HTML, JavaScript, MySQL and Node.js

![In Out Board Screnshot]
(http://www.dallanporter.com/inout-screen.png)

[See a live demo here.](http://inout.dallanporter.com:8080)


This application is a Node.js application that stores users & groups in a MySQL database. The
application allows for an unlimited number of users and groups, and users can belong to
multiple groups. A simple 'admin' interface is available to all groups to allow manually adding,
removing and customizing users.

## Usage
Include the following into an HTML page hosted by the Node.js application (express.js)
or add this code to any other webpage and simply add the full URL to the script src tags.
```
<script language="javascript" type="text/javascript" src="/js/jquery.js"></script>
<script language="javascript" type="text/javascript" src="/bootstrap/js/bootstrap.js"></script>
<script type="text/javascript" language="javascript" src="/js/messaging.js"></script>
<script type="text/javascript" language="javascript" src="/js/buttonboard.js"></script>
						
var buttonboard = null;
$(function() {
	window.buttonboard = $("#buttonboard").ButtonBoard( 
	  { 	
		  group:"testgroup",
		  token:"token456",
		  height:"auto",
		  view_only: false,
		  show_settings: false
		  
	  } 
	);
});
```

Change the server & server_port variable to be your server url in /js/bb.js and /js/buttonboard.js
```
var server = "http://localhost"; // change to your server url
var server_port = 8080; // change to your server port
```

This project needs a lot of work obviously. But it's functional and several organizations and businesses have
been using it regularly.

hit me up if you have any questions.

-- Dallan


