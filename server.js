/* CONFIGS */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
app.use(session({secret: 'qvqewdxwxqeq4swrts', resave: false, saveUninitialized: false}));
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
var flash = require('connect-flash');
app.use(flash());
//POSTGRES
var pg = require('pg');
var conString = String(process.env.DATABASE_URL || "postgres://postgres:12345@localhost/postgres");

/*========================================================================*/

/*  RESPOSTAS AOS PEDIDOS REST */

/*HOMEPAGE*/
app.get('/', function (req, res) {
    if (req.session.loggedin) {
        sendHTML(res, "index", {username: req.session.username}); // RETORNA MAPA SE ESTÁ LOGGEDIN
        //res.render("index",{username: req.session.username});
    } else {
        sendHTML(res, "login", {message: req.flash('message')}); // SENAO OBRIGA A FAZER LOGIN
    }
});

/* POST LOGIN */
app.post('/login', urlencodedParser, function (req, res) {
    /* ISTO AINDA NÃO FAZ NADA, SÓ REDIRECT PARA O MAPA */

    var username = req.body.username;
    var password = req.body.password;
    var client = new pg.Client(conString);
    client.connect(function (err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query("select * from users where username='" + username + "'", function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            if (result.rows.length > 0) {
                if (result.rows[0].password.trim() == password) {
                    req.session.loggedin = true;
                    req.session.userid = result.rows[0].userid;
                    req.session.username = result.rows[0].username;
                } else {
                    req.session.loggedin = false;
                    req.flash('message', "Wrong password");
                }
            } else {
                req.flash('message', "User not found");
            }
            client.end();
            res.redirect('/');
        });
    });
});

/* GET LOGOUT*/
app.get('/logout', function (req, res) {
    req.session.loggedin = false;
    res.redirect('/');
});

/* POST REGISTER */
app.post('/register', urlencodedParser, function (req, res) {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var confirm_password = req.body.confirm_password;

    if (password != confirm_password) {
        req.session.loggedin = false;
        res.redirect('/');
    }
    else {
        var client = new pg.Client(conString);
        client.connect();
        var query = client.query("insert into users (username,password,email,fogs) " +
            "values ('" + req.body.username + "','" +
            req.body.password + "','" + req.body.email + "',array_fill(0, ARRAY[33768]))");
        query.on("end", function (result) {
            client.end();
            res.redirect('/');
        });
    }
});

/* UPDATE fogs para um utilizador*/
/*app.get('/api/updateFogsForUser', function (req, res) {
    var user = req.query.user;
	var fogs = req.query.fogs;
    var client = new pg.Client(conString);
    client.connect(function (err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query("update users set fogs["+fogs[i]+"] = 1 where username='" + user + "';", function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            client.end();
        });
    });
});*/

/* quick&dirty fix */
app.get('/dropSetUsers', function (req, res) {
    var client = new pg.Client(conString);
    client.connect(function (err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query("DROP TABLE IF EXISTS users;\n\
CREATE TABLE users(\n\
	userID SERIAL,\n\
	username char(50) UNIQUE,\n\
	password char(256),\n\
	email char(256),\n\
	fogs integer[33768],\n\
	PRIMARY KEY(userID)\n\
);", function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            client.end();
        });
    });
});

/* GET fogs para um utilizador*/
app.get('/api/getFogsFromUser', function (req, res) {
	if (req.session.loggedin) {
        var userID = req.session.userid;
		var client = new pg.Client(conString);
		client.connect(function (err) {
			if (err) {
				return console.error('could not connect to postgres', err);
			}
			client.query("select fogs from users where userID=" + userID + ";", function (err, result) {
				if (err) {
					return console.error('error running query', err);
				}
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({result: result.rows}));
				client.end();
			});
		});
	}
});

/* GET especie para uma localizacao*/
//TODO: Verificar lat+long na query?
app.get('/api/getSpeciesFromLocation', function (req, res) {
    var lat = req.query.lat;
    var long = req.query.long;
    var client = new pg.Client(conString);
    client.connect(function (err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query("select scientificname, nomevulgar, species.specieid "
            + "from species,	("
            + "select distinct specieID "
            + "from locations "
            + "where st_covers(location, ST_GeographyFromText('SRID=4326;POINT(" + lat + " " + long + ")'))"
            + ") loc where species.specieid=loc.specieid;", function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({lat: lat, long: long, result: result.rows}));
            client.end();
        });
    });
});

/* GET localizacoes para uma especie*/
//TODO: Verificar se 'especie' esta definido no query? E se existem areas para a especie (caso o utilizador tenha manipulado a pagina para fazer uma query que nao devia)?
app.get('/api/getLocationFromSpecies', function (req, res) {
    var especie = req.query.especie;
    var client = new pg.Client(conString);
    client.connect(function (err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query("select ST_AsGeoJSON(location) "
            + "from locations "
            + "where specieid=" + especie + ";", function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({especie: especie, result: result.rows}));
            client.end();
        });
    });
});
/**
 * inserir as especies que estão na posição do user na sua coleção
 */
app.post('/api/userSpeciesFromLocation', urlencodedParser, function (req, res) {
    if (req.session.loggedin) {
        var userID = req.session.userid;
        var lat = req.body.lat;
        var long = req.body.long;
        var client = new pg.Client(conString);
        client.connect(function (err) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }
            client.query("select distinct specieID "
                + " from locations "
                + " where specieID not in (select specieID from userspecies where userID=" + userID + ") "
                + " and st_covers(location, ST_GeographyFromText('SRID=4326;POINT(" + lat + " " + long + ")'));",
                function (err, result) {
                    if (err) {
                        return console.error('error running query', err);
                    }
                    for (var i = 0; i < result.rows.length; i++) {
                        console.error(result.rows[i].specieid);
                        var i2 = i;
                        var query = client.query("insert into userspecies (userID,specieID) " +
                            "values (" + userID + "," + result.rows[i].specieid + ")");
                        query.on("end", function (result) {
                            console.error(result);
                            if (i2 == result.rows.length - 1)
                                client.end();
                        });
                    }
                });
        });
    }
});


app.get('/catalog', function (req, res) {
    if (req.session.loggedin) {
        sendHTML(res, "catalog", {username: req.session.username});
    }else{
        res.redirect('/');
    }
});
app.get('/api/catalog', function (req, res) {
    if (req.session.loggedin) {
        var known = req.query.known;
        var userID = req.session.userid;
        var client = new pg.Client(conString);
        var select = "";
        if(known=='true'){
            select = "select distinct species.specieID, scientificName, nomevulgar"
                + " from userspecies , species  "
                + " where species.specieID = userspecies.specieID"
                + " and userspecies.userID=" + userID + ";"
        }else if(known=='false'){
            select = "select distinct species.specieID, scientificName, nomevulgar"
            + " from species"
            + " where species.specieID not in (select specieID from userspecies where userID="+userID+")";
        }
        client.connect(function (err) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }
            client.query(select, function (err, result) {
                if (err) {
                    return console.error('error running query', err);
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({result: result.rows}));
                client.end();
            });
        });
    }
});
/*========================================================================*/
/* INICIAR O SERVIDOR */
var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("App listening at http://%s:%s", host, port)

});

function sendHTML(res, file, data) {
    res.render(__dirname + "/public/views/" + file, data);
    //res.sendFile( __dirname + "/public/views/" + file);
}