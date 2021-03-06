/* CONFIGS */
var http = require('http');
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
var client = new pg.Client(conString);
client.connect();
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
        res.redirect('/');
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
        var query = client.query("insert into users (username,password,email,fogs) " +
            "values ('" + req.body.username + "','" +
            req.body.password + "','" + req.body.email + "',array_fill(0, ARRAY[33768]))");
        query.on("end", function (result) {
            res.redirect('/');
        });
    }
});

/* UPDATE fogs para um utilizador*/
app.get('/api/updateFogsForUser', function (req, res) {
    if (req.session.loggedin) {
        var userID = req.session.userid;
        var seen = req.query.seen;
        for (var i = 0; i < seen.length; i++) {
            client.query("update users set fogs[" + seen[i] + "] = 1 where userID=" + userID + ";", function (err, result) {
                if (err) {
                    return console.error('error running query', err);
                }
            });
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({result: "success"}));
    }
});

/* quick&dirty fix */
/*app.get('/dropSetUsers', function (req, res) {
 var client = new pg.Client(conString);
 client.connect(function (err) {
 if (err) {
 return console.error('could not connect to postgres', err);
 }
 client.query("DROP TABLE IF EXISTS routes;DROP TABLE IF EXISTS userspecies;DROP TABLE IF EXISTS users;\
 CREATE TABLE users(\
 userID SERIAL,\
 username char(50) UNIQUE,\
 password char(256),\
 email char(256),\
 fogs integer[33768],\
 PRIMARY KEY(userID)\
 );\
 CREATE TABLE userspecies(\
 specieID int references species(specieID),\
 userID int references users(userID),\
 PRIMARY KEY(userID,specieID)\
 );", function (err, result) {
 if (err) {
 return console.error('error running query', err);
 }
 res.setHeader('Content-Type', 'application/json');
 res.send(JSON.stringify({result: "Quick&Dirty: Erased users from DB."}));
 client.end();
 });
 });
 });*/

/* GET fogs para um utilizador*/
app.get('/api/getFogsFromUser', function (req, res) {
    if (req.session.loggedin) {
        var userID = req.session.userid;
        client.query("select fogs from users where userID=" + userID + ";", function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({result: result.rows}));
        });
    }
});

/* GET especie para uma localizacao*/
//TODO: Verificar lat+long na query?
app.get('/api/getSpeciesFromLocation', function (req, res) {
    var lat = req.query.lat;
    var long = req.query.long;
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
    });
});

/* GET localizacoes para uma especie*/
//TODO: Verificar se 'especie' esta definido no query? E se existem areas para a especie (caso o utilizador tenha manipulado a pagina para fazer uma query que nao devia)?
app.get('/api/getLocationFromSpecies', function (req, res) {
    var especie = req.query.especie;
    client.query("select ST_AsGeoJSON(location) "
        + "from locations "
        + "where specieid=" + especie + ";", function (err, result) {
        if (err) {
            return console.error('error running query', err);
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({especie: especie, result: result.rows}));
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
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({result: "success"})); //To stop it from timing out.
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
                    });
                }
            });
    }
});


app.get('/catalog', function (req, res) {
    if (req.session.loggedin) {
        sendHTML(res, "catalog", {username: req.session.username});
    } else {
        res.redirect('/');
    }
});
app.get('/api/catalog', function (req, res) {
    if (req.session.loggedin) {
        var known = req.query.known;
        var userID = req.session.userid;
        var select = "";
        if (known == 'true') {
            select = "select distinct species.specieID, scientificName, nomevulgar"
                + " from userspecies , species  "
                + " where species.specieID = userspecies.specieID"
                + " and userspecies.userID=" + userID + ";"
        } else if (known == 'false') {
            select = "select distinct species.specieID, scientificName, nomevulgar"
                + " from species"
                + " where species.specieID not in (select specieID from userspecies where userID=" + userID + ")";
        }

        client.query(select, function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({result: result.rows}));
        });
    }
});
app.get('/api/search', function (req, res) {
    var text = req.query.text;
    client.query("select distinct(scientificName),* " +
        "from species " +
        "where scientificName ilike '%" + text + "%' " +
        "or nomevulgar ilike '%" + text + "%'", function (err, result) {
        if (err) {
            return console.error('error running query', err);
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({result: result.rows}));
    });
});

app.get('/api/gbif', function (req, res) {
    var str = '';
    callback = function (response) {

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            res.send(str);
        });
    };
    http.request(req.query.gbif, callback).end();

});
app.get('/search', function (req, res) {
    if (req.session.loggedin) {
        sendHTML(res, "search", {username: req.session.username});
    } else {
        res.redirect('/');
    }
});
/*========================================================================*/
/* INICIAR O SERVIDOR */
var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("App listening at http://%s:%s", host, port);

});

function sendHTML(res, file, data) {
    res.render(__dirname + "/public/views/" + file, data);
    //res.sendFile( __dirname + "/public/views/" + file);
}