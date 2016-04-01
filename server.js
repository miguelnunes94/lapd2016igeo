var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var session = require('express-session');
var app = express();


app.use(session({secret: 'qvqewdxwxqeq4swrts', resave: false, saveUninitialized: false}));

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public'));

app.get('/', function (req, res) {	
	if (req.session.loggedin) {
		 sendHTML(res, "index.htm");
	}else{	
		sendHTML(res, "login.htm");
	}	 
});

app.post('/login', urlencodedParser, function(req, res){
   	var username = req.body.username;
    var password = req.body.password;

 	req.session.loggedin=true;
  	res.redirect('/');
});


var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("App listening at http://%s:%s", host, port)

});

function sendHTML(res, file){
	res.sendFile( __dirname + "/public/views/" + file);
}