
var server = "http://localhost";
var server_port = 8080;
var groupname = null;
var is_authorized = false;
var font = null;
var prevfont = null;
var selected_user = null;
var users = {};

$(function() {
        $("#user_edit_form").hide();
});

var socket = io.connect( server,
        {
                secure:false,
                reconnect:true,
                "reconnection delay":5000,
                port: server_port
        }
);

socket.on( 'connect', function() {
        console.log("socket.io connected.");
        
});

socket.on( 'disconnect', function() {
        console.log("Socket.io disconnected");
        $("#status").html("Disconnected");
        // TODO - clear all of the fields
        $("#settings_container").hide();
        $("#login_container").show();
        $("#user_edit_form").hide();
        alert("Connection lost. Please reload");
});
        
socket.on( "admin_error", function( err ) {
        console.log("ERROR" );
        console.log( err );
});

socket.on( "admin_user_added", function( u ) {
        console.log("User added!");
        //var li = "<li id=\"user_" + u.id + "\"><span style=\"font-weight:bold;color:" + u.color + "\">" + u.name + "</span> color:<input onchange=\"OnAdminColorChange(" + u.id + ", " + this.color + ")\" type=\"text\" class=\"color\" />  [edit] [delete]</li>";
        //$("#userlist").append( li );
        AddUserRow( u );
        
        jscolor.init();
        InitSortList();
});

socket.on( "admin_user_deleted", function( u ) {
        console.log("User deleted!");
        // Somehow find it and remove it.
        var li = $("#user_" + u.id );
        if( li )
        {
                li.remove();
        }
        
});

socket.on( "admin_success", function( data ) {
        if( data.message == "EDIT_SUCCESS" )
        {
               $("#user_edit_form").hide();
               alert( "TODO - update the values in the list on this page. Reload to see changes in the meantime...");
        }
});

socket.on( "admin_login_success", function( data ) {
    console.log("Admin login success");
    is_authorized = true;
    groupname = data.name;
    font = data.font;
    $("#userlist").empty();
    
    console.log( data );
    $("#status").html("Logged In");
    // the entire group info will come here
    // build the table list now
    
    $("#title").val( data.title );
    
    users = {};
    for( var i=0; i<data.users.length; i++  )
    {
        var u = data.users[i];
        console.log("add user: ");
        console.log( u );
        
        AddUserRow( u );
        users[ "user_" + u.id ] = u;
    }
    
    jscolor.init();
    
    $("#settings_container").show();
    InitSortList();
    $("#login_container").hide();
});

socket.on( "admin_login_failed", function( data ) {
        console.log("Login failed.");
        console.log( data );
        $("#status").html("Login Failed.");
});


function AddUserRow( u )
{
        var font_class = font;
        if( font_class == null )
        {
                font_class = "";
        }
        color = "black";
        if( u.color )
        {
                color = u.color;
        }
        var ext = u.extension;
        var ext_text = "";
        if( ext )
        {
                ext_text = "<span class=\"phone_extension\">" + ext + "<span>";
        }
        var li = "<li class=\"ui-state-default " + font_class + "\" id=\"user_" + u.id +
                "\"><span class=\"sort_li ui-icon ui-icon-arrowthick-2-n-s\"></span><span class=\"li_name\" style=\"font-weight:bold;color:" +
                color + "\">" + u.name + "</span> " + ext_text + " color:<input value=\"" + color +
                "\" onchange=\"OnAdminColorChange(" + u.id + ", event )\" type=\"text\" class=\"color\" /> <span class=\"link\" onclick=\"ModifyUser(" +
                u.id + ")\">[edit]</span>  <span class=\"link\" onclick=\"DeleteUser(" + u.id + ") \">[delete]</span></li>";
        $("#userlist").append( li );
}

function InitSortList()
{
        $("#userlist").sortable( {
                stop: SortChange
        });
        $("#userlist").disableSelection();
}

// Called when the sort list order changes
function SortChange( event, ui )
{
        var out = {};
        out.groupname = groupname;
        out.sort = {};
        console.log("Sort order changed!");
        var pos = 0;
        $("#userlist li").each( function( i, el ) {
                console.log( "POSITION[" + pos + "] ->" +  el.id );
                pos++;
                out.sort[ el.id ] = pos;
        });
        
        socket.json.emit( "admin_sort_list", out );
}

function SaveFont(  )
{
        var newfont = $("input:radio[name=font]:checked").val();
        var prevfont = font;
        font = newfont;
        //alert("TODO - change the font now -- " + newfont );
        $("#userlist li").each( function(i, el ) {
                $(el).removeClass( prevfont );
                $(el).addClass( font );
        });
        var msg = {};
        msg.groupname = groupname;
        msg.newfont = newfont;
        socket.json.emit('admin_font_change', msg );
}

$(function() {
   
   console.log("init page now");
   
   
});

function OnAdminColorChange( userid, event )
{
        var newcolor = event.currentTarget.color.toString();
        console.log("Color changed for user: " + userid + " to color " + newcolor );
        if( socket )
        {
                var msg = {};
                msg.uid = userid;
                msg.newcolor = "#" + newcolor;
                $("#user_" + userid + " span").css("color", msg.newcolor );
                socket.json.emit( 'admin_color_change', msg );
        }
}

function Login()
{
   
    var username = $("#groupname").val();
    var password = $("#password").val();
    
    if( !socket )
    {
        alert("Error, socket not connected.");
        return;
    }
    
    var message = {};
    message.groupname = username;
    message.password = password;
    socket.json.emit( "admin_login", message );
    
}

function AddUser()
{
    if( is_authorized && socket )
    {
        var msg = {};
        msg.name = $("#newname").val();
        var email = null;
        if( email != "" )
        {
                msg.email = email;
        }
        
        socket.json.emit( "admin_add_user", msg );
    }
}

function DeleteUser( id )
{
    if( confirm("Are you sure you want to delete user id " + id + "?") )
    {
        if( is_authorized && socket )
        {
            var msg = {};
            msg.id = id;
            msg.groupname = groupname;
            socket.json.emit( "admin_delete_user", msg );
        }
    }
}

function ModifyUser( id )
{
        $("#user_edit_form").show();
        selected_user = users[ "user_" + id ];
        $("#edit_name").val( selected_user.name );
        $("#edit_email").val( selected_user.email );
        $("#edit_extension").val( selected_user.extension );
        
}

function EditUser( )
{
        
        if( is_authorized && socket )
        {
            var msg = {};
            var name = $("#edit_name").val();
            var email = $("#edit_email").val();
            var extension = $("#edit_extension").val();
          
            selected_user.name = name;
            selected_user.email = email;
            selected_user.extension = extension;
            selected_user.groupname = groupname; // store this temporarily so the server can brodcast to the group
            socket.json.emit( "admin_edit_user", selected_user );
        }
}

function EditGroup()
{
    
}