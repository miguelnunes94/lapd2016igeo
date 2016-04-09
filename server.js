	/* CONFIGS */
	var express = require('express');
	var app = express();
	var bodyParser = require('body-parser');
	var session = require('express-session');
	var app = express();
	app.use(session({secret: 'qvqewdxwxqeq4swrts', resave: false, saveUninitialized: false}));

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(express.static('public'));


//POSTGRES
var pg = require('pg');
var conString = String(process.env.DATABASE_URL || "postgres://postgres:12345@localhost/postgres");


/*========================================================================*/

/*  RESPOSTAS AOS PEDIDOS REST */

/*HOMEPAGE*/
app.get('/', function (req, res) {	
	if (req.session.loggedin) {
		 sendHTML(res, "index.htm"); // RETORNA MAPA SE ESTÁ LOGGEDIN
		}else{	
		sendHTML(res, "login.htm"); // SENAO OBRIGA A FAZER LOGIN
	}	 
});

/* POST LOGIN */
app.post('/login', urlencodedParser, function(req, res){
	/* ISTO AINDA NÃO FAZ NADA, SÓ REDIRECT PARA O MAPA */

   	//var username = req.body.username;
    //var password = req.body.password;

    req.session.loggedin=true;
    res.redirect('/');
});



/* GET LOGOUT*/
app.get('/logout', function(req, res){
	req.session.loggedin=false;
	res.redirect('/');
});

/* POST REGISTER */
app.post('/register', urlencodedParser, function(req, res){
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var confirm_password = req.body.confirm_password;


	if (password != confirm_password) 
	{
		req.session.loggedin=false;
		res.redirect('/');
	}
	else 
	{
		var client = new pg.Client(conString);		
		client.connect(function(err) {
			if(err) {
				return console.error('could not connect to postgres', err);
			}
			client.query("INSERT INTO users(username, password,email) values($1, $2, $3)" , function(err, result) {
				if(err) {
					return console.error('error running query', err);
				}				
				client.end();
			});
		});
		req.session.loggedin=true;
		res.redirect('/');
	}
	
});

/* GET especie para uma localizacao*/
//TODO: Verificar lat+long na query?
app.get('/api/getSpeciesFromLocation', function(req, res){
	var lat = req.query.lat;
	var long = req.query.long;
	var client = new pg.Client(conString);
	client.connect(function(err) {
		if(err) {
			return console.error('could not connect to postgres', err);
		}
		client.query("select scientificname, nomevulgar, species.specieid "
			+"from species,	("
			+"select distinct specieID " 
			+"from locations "
			+"where st_covers(location, ST_GeographyFromText('SRID=4326;POINT("+lat+" "+long+")'))"
			+") loc where species.specieid=loc.specieid;", function(err, result) {
				if(err) {
					return console.error('error running query', err);
				}
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({ lat: lat, long: long, result: result.rows}));
				client.end();
			});
	});
});

/* GET localizacoes para uma especie*/
//TODO: Verificar se 'especie' esta definido no query? E se existem areas para a especie (caso o utilizador tenha manipulado a pagina para fazer uma query que nao devia)?
app.get('/api/getLocationFromSpecies', function(req, res){
	var especie = req.query.especie;
	var client = new pg.Client(conString);
	client.connect(function(err) {
		if(err) {
			return console.error('could not connect to postgres', err);
		}
		client.query("select ST_AsGeoJSON(location) "
			+"from locations "
			+"where specieid="+especie+";", function(err, result) {
				if(err) {
					return console.error('error running query', err);
				}
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({ especie: especie, result: result.rows}));
				client.end();
			});
	});
});

/*========================================================================*/
/* INICIAR O SERVIDOR */
var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function () {

	var host = server.address().address
	var port = server.address().port

	console.log("App listening at http://%s:%s", host, port)

});

function sendHTML(res, file){
	res.sendFile( __dirname + "/public/views/" + file);
}