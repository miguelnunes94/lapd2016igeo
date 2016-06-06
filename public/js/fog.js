var cBounds,
	overlay,
	squareSize = 5,
	r1 = Math.round(Math.sqrt(2*(squareSize*squareSize))/2*100)/100,
	r2 = Math.round(r1*4/3*100)/100,
	canvas = document.createElement("canvas"),
	draw,
	fogArray,
	sendArray = [],
	px = -1,
	py = -1;
//w=670, w/5=134; h=1260, h/5=252;
//134*252=33768 possible fog positions (~33kb)

//Used to clear unused parts of the map:
var ppr = [
	287.65,    8.95,
	203.37,   34.97,
	154.49,   81.99,
	156.99,  119.01,
	174.94,  208.05,
	194.39,  284.09,
	197.88,  298.60,
	150.00,  493.20,
	157.98,  508.21,
	120.08,  631.77,
	 56.25,  687.30,
	 57.74,  758.33,
	 60.24,  784.35,
	 43.78,  825.37,
	 49.27,  852.38,
	 90.16,  860.38,
	100.13,  912.91,
	142.02,  908.91,
	158.98,  899.90,
	175.94,  932.92,
	176.44,  974.94,
	162.97, 1013.96,
	159.98, 1021.47,
	173.94, 1030.97,
	136.04, 1232.57,
	449.23, 1240.08,
	545.97,  950.93,
	530.02,  727.82,
	636.74,  214.56,
	665.66,  161.53,
	608.81,   43.47,
	330.53,   52.47
];

/*converter coordenadas de um array do loadLocationFromSpecies para coordenadas do google (lat+lng).*/
function ctoc(arr_c){
	var ret = [];
	for(var i=0;i<arr_c.length;i++){
		ret.push( {lat: arr_c[i][0], lng: arr_c[i][1]} );
	}
	return ret;
}

/*pintar poligonos*/
var polys = [];
function paintPoly(coords_real){
	var coords = ctoc(coords_real);
	var poly = new google.maps.Polygon({
		paths: coords,
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#FF0000',
		fillOpacity: 0.35
	});
	poly.setMap(map);
	polys.push(poly);
}

/*limpar os poligonos para fora do mapa*/
function clearMap(){
	for(var i=0;i<polys.length;i++){
		polys[i].setMap(null);
	}
	polys=[];
}

/*iniciar o fog:*/
function initFog(){
	fogArray = new Array( 33768 );
	for(var i=0;i<fogArray.length;i++)
		fogArray[i]=0;
	
	cBounds = new google.maps.LatLngBounds(
		new google.maps.LatLng(36.88,-9.78),//SW,lat,lng
		new google.maps.LatLng(42.21,-6.09)//NE,lat,lng
	);
	
	canvas.style.borderStyle = 'none';
	canvas.style.borderWidth = '0px';
	canvas.style.position = 'absolute';
	canvas.width = 670;
	canvas.height = 1260;
	
	draw = canvas.getContext("2d");
	draw.fillStyle="rgba(0,0,0,0.45)";
	draw.fillRect(0,0,canvas.width,canvas.height);
	/*draw.clearRect(0,0,148,422);
	draw.clearRect(0,0,90,607);
	draw.clearRect(0,920,134,1260);*/
	//light(squareSize/2+squareSize,squareSize/2+squareSize);
	
	cOverlay.prototype = new google.maps.OverlayView();
	cOverlay.prototype.onAdd = function(){
		var panes = this.getPanes();
		panes.overlayLayer.appendChild(canvas);
	}

	cOverlay.prototype.draw = function() {
	  var overlayProjection = this.getProjection();

	  var sw = overlayProjection.fromLatLngToDivPixel(cBounds.getSouthWest());
	  var ne = overlayProjection.fromLatLngToDivPixel(cBounds.getNorthEast());

	  canvas.style.left = sw.x + 'px';
	  canvas.style.top = ne.y + 'px';
	  canvas.style.width = (ne.x - sw.x) + 'px';
	  canvas.style.height = (sw.y - ne.y) + 'px';
	};

	cOverlay.prototype.onRemove = function() {
	  canvas.parentNode.removeChild(canvas);
	  canvas = null;
	};
	
	overlay = new cOverlay(map);
	
	var dgCO = draw.globalCompositeOperation;
	var dfS = draw.fillStyle;
	draw.globalCompositeOperation="destination-in";
	draw.fillStyle = "#fff";
	draw.beginPath();
	
	draw.moveTo(ppr[0],ppr[1]);
	for(var i=2;i<ppr.length;i+=2){
		draw.lineTo( ppr[i], ppr[i+1] );
	}
	
	draw.fill();
	draw.globalCompositeOperation=dgCO;
	draw.fillStyle=dfS;
	
	//Get the fogs from the server, and attempt to 'clear up' the grid as needed.
	getFogsFromUser();
	
	//TODO: Remove this.
	//addClick();
}

function getFogsFromUser(){
	$.ajax( {
		method: "GET",
		url: "/api/getFogsFromUser",
		data: {}
	} ).done( function(data){
		var ffogs = data.result[0].fogs; //Update the fogs.
		//Just in case, attempt to reduce data transferred between the client and the server. Might not always be on time, though.
		for(var i=0;i<sendArray.length;i++){
			if(ffogs[ sendArray[i]-1 ] == 1){
				sendArray.splice(i,1);
				i--;
			}
		}
		for(var x=0;x<134;x++){
			for(var y=0;y<252;y++){
				if(ffogs[y*134+x]==1 && fogArray[y*134+x]==0){
					light_grid(x,y);
				}
			}
		}
		for(var i=0;i<ffogs.length;i++){
			//Apply OR on each part of the fogArray, so we can still explore while the server sends us its array.
			fogArray[i] |= ffogs[i];
		}
	} );
}

function cOverlay(map){
	this.setMap(map);
}

/*Test clicking coordinates.*/
function addClick(){
	google.maps.event.addListener(map, 'click', function(e) {
		//console.log(e.latLng.lat()+","+e.latLng.lng());
		map_light( e.latLng );
	});
}

/*Call light from the given lat/lng points.*/
function map_light( latLng ){
	var proj = map.getProjection();
	var tR = proj.fromLatLngToPoint( cBounds.getNorthEast() );
	var bL = proj.fromLatLngToPoint( cBounds.getSouthWest() );
	var wP = proj.fromLatLngToPoint( latLng );
	
	var pw = tR.x - bL.x;
	var ph = bL.y - tR.y;
	var py = (wP.y - tR.y) / ph;
	var px = (wP.x - bL.x) / pw;
	var cx = px*canvas.width;
	var cy = py*canvas.height;
	line( cx, cy );
}

/*make a line of 'light' from the previous point to the next*/
function line(nx,ny){
	if( px==-1 || py==-1 ){
		light(nx,ny);
	} else {
		var len = Math.sqrt( (px-nx)*(px-nx)+(py-ny)*(py-ny) );
		var xx = (nx-px)/len;
		var yy = (ny-py)/len;
		for(var i=0;i<len;i++)
			light( Math.round( px + xx*i ), Math.round( py + yy*i ) );
	}
	px=nx;
	py=ny;
}

/*clear area near clicked points*/
function light(x,y){
	//Get a proper "x and y" in-array position.
	x = Math.floor(x/squareSize);
	y = Math.floor(y/squareSize);
	if(fogArray[y*134+x]==1)
		return;
	fogArray[y*134+x] = 1;
	sendArray.push(y*134+x+1);
	light_grid(x,y);
}

function light_grid(x,y){
	//Get the position "in the grid".
	x += 0.5;
	y += 0.5;
	x *= squareSize;
	y *= squareSize;
	//Clear the position.
	var dgCO = draw.globalCompositeOperation;
	var dfS = draw.fillStyle;
	draw.globalCompositeOperation="destination-out";
	var grd=draw.createRadialGradient(x,y,r1,x,y,r2);
	grd.addColorStop(0,"rgba(0,0,0,1)");
	grd.addColorStop(1,"rgba(0,0,0,0)");
	draw.fillStyle=grd;
	draw.beginPath();
	draw.arc( x, y, r2, //x,y,r
				0, 2 * Math.PI, false);
	draw.fill();
	draw.globalCompositeOperation=dgCO;
	draw.fillStyle=dfS;
}

function updateServerArray(){
	if(sendArray.length > 0){
		$.ajax( {
			method: "GET",
			url: "/api/updateFogsForUser",
			data: {seen: sendArray}
		} ).done( function(data){
			//Should only receive a "success" or "failure", or nothing (if nothing then remove this).
			console.log( data );
		} );
		sendArray = []; //Clear the array.
	}
	//Otherwise, if the array is empty, do nothing.
}