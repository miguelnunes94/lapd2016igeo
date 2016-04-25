var cBounds,
	overlay,
	squareSize = 5,
	r1 = Math.sqrt(2*(squareSize*squareSize))/2,
	r2 = r1*4/3,
	canvas = document.createElement("canvas"),
	draw;

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
	draw.fillStyle="rgba(0,0,0,0.85)";
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
	
	addClick();
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
	
	//var scale = Math.pow(2, map.getZoom());
	//var worldPoint = projection.fromLatLngToPoint(latLng);
	//return [Math.floor((worldPoint.x - bottomLeft.x) * scale), Math.floor((worldPoint.y - topRight.y) * scale)];
	
	var proj = map.getProjection(); //map.getProjection();
	//cBounds
	var tR = proj.fromLatLngToPoint( cBounds.getNorthEast() );
	var bL = proj.fromLatLngToPoint( cBounds.getSouthWest() );
	//var sc = Math.pow( 2, map.getZoom() );
	var wP = proj.fromLatLngToPoint(latLng);
	
	
	var pw = tR.x - bL.x; //cBounds.getNorthEast().lng()-cBounds.getSouthWest().lng();
	var ph = bL.y - tR.y; //cBounds.getSouthWest().lat()-cBounds.getNorthEast().lat();
	var py = (wP.y - tR.y) / ph; //(lat-cBounds.getNorthEast().lat())/ph;
	var px = (wP.x - bL.x) / pw; //(lng-cBounds.getSouthWest().lng())/pw;
	//console.log(px+","+py);
	var cx = px*canvas.width;
	var cy = py*canvas.height;
	//console.log(cx+","+cy);
	light( cx, cy );
}

/*clear area near clicked points*/
function light(x,y){
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
