CREATE EXTENSION postgis;

DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS users;
/*DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS species;*/

CREATE TABLE users(
	userID SERIAL,
	username char(50) UNIQUE,
	password char(256),
	email char(256),
	fogs integer[33768],
	PRIMARY KEY(userID)
);

CREATE TABLE routes(
	routeID SERIAL,
	userID int references users(userID),
	route xml,
	PRIMARY KEY(routeID)
);

CREATE TABLE species (
	specieID int,
	scientificName char(256),
	nomevulgar char(256),
	PRIMARY KEY (specieID)
);

CREATE TABLE locations(
	locationID SERIAL,
	specieID int references species(specieID),
	location GEOGRAPHY(POLYGON,4326),
	PRIMARY KEY (locationID)	
);

CREATE TABLE userspecies(
    specieID int references species(specieID),
    userID int references users(userID),
    PRIMARY KEY(userID,specieID)
);

/*
INSERT INTO species (specieID, scientificName, nomevulgar) VALUES (1, 'Teste', 'teste');
INSERT INTO locations (specieID,location) VALUES (1, ST_GeographyFromText('SRID=4326;POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))') );
select specieID from locations where st_covers(location, ST_GeographyFromText('SRID=4326;POINT(5 5)'));

*/